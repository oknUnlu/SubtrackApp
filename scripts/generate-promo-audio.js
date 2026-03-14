#!/usr/bin/env node
/**
 * SubTrack Promo Audio Generator
 * Generates a pleasant ambient/lo-fi background track as WAV.
 * No external dependencies - pure Node.js audio synthesis.
 *
 * Usage: node scripts/generate-promo-audio.js
 */

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const CHANNELS = 2; // stereo
const DURATION = 31; // seconds (match video)
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION;
const BPM = 85;
const BEAT_DURATION = 60 / BPM;

// --- Musical notes (Hz) ---
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

// --- Utility functions ---
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** Soft sine with slight warmth */
function warmSine(phase) {
  const s = Math.sin(phase);
  return s + 0.15 * Math.sin(phase * 2) + 0.05 * Math.sin(phase * 3);
}

/** ADSR envelope */
function adsr(t, attack, decay, sustain, release, duration) {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < duration - release) return sustain;
  if (t < duration) return sustain * (1 - (t - (duration - release)) / release);
  return 0;
}

/** Simple low-pass filter state */
function createLPF(cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  return { alpha, prevL: 0, prevR: 0 };
}

function applyLPF(lpf, sampleL, sampleR) {
  lpf.prevL += lpf.alpha * (sampleL - lpf.prevL);
  lpf.prevR += lpf.alpha * (sampleR - lpf.prevR);
  return [lpf.prevL, lpf.prevR];
}

/** Simple delay/reverb effect */
function createDelay(delaySec, feedback, mix) {
  const delaySamples = Math.floor(delaySec * SAMPLE_RATE);
  return {
    bufferL: new Float32Array(delaySamples),
    bufferR: new Float32Array(delaySamples),
    idx: 0,
    size: delaySamples,
    feedback,
    mix,
  };
}

function applyDelay(delay, sampleL, sampleR) {
  const delayedL = delay.bufferL[delay.idx];
  const delayedR = delay.bufferR[delay.idx];
  delay.bufferL[delay.idx] = sampleL + delayedL * delay.feedback;
  delay.bufferR[delay.idx] = sampleR + delayedR * delay.feedback;
  delay.idx = (delay.idx + 1) % delay.size;
  return [
    sampleL + delayedL * delay.mix,
    sampleR + delayedR * delay.mix,
  ];
}

// --- Music layers ---

/** Warm pad - layered detuned sine waves */
function padLayer(t) {
  // Chord progression: Cmaj7 -> Am7 -> Fmaj7 -> G7
  const chordLen = BEAT_DURATION * 8; // 8 beats per chord
  const chordIdx = Math.floor(t / chordLen) % 4;

  const chords = [
    [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.B3],      // Cmaj7
    [NOTES.A3 * 0.5, NOTES.C3, NOTES.E3, NOTES.G3], // Am7
    [NOTES.F3 * 0.5, NOTES.A3 * 0.5, NOTES.C3, NOTES.E3], // Fmaj7
    [NOTES.G3 * 0.5, NOTES.B3 * 0.5, NOTES.D3, NOTES.F3], // G7
  ];

  const chord = chords[chordIdx];
  let valL = 0, valR = 0;

  chord.forEach((freq, i) => {
    const detune1 = 1.002 + i * 0.001;
    const detune2 = 0.998 - i * 0.001;
    const phase1 = 2 * Math.PI * freq * detune1 * t;
    const phase2 = 2 * Math.PI * freq * detune2 * t;
    valL += warmSine(phase1) * 0.08;
    valR += warmSine(phase2) * 0.08;
  });

  // Slow LFO for movement
  const lfo = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.15 * t);
  return [valL * lfo, valR * lfo];
}

/** Gentle arpeggio - soft plucked notes */
function arpLayer(t) {
  const noteLen = BEAT_DURATION * 0.5;
  const patternLen = BEAT_DURATION * 8;
  const patternIdx = Math.floor(t / patternLen) % 4;

  const patterns = [
    [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.G4, NOTES.E4, NOTES.G4, NOTES.B4,
     NOTES.C5, NOTES.G4, NOTES.E4, NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.E5],
    [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4, NOTES.E4, NOTES.C4, NOTES.E4, NOTES.G4,
     NOTES.A4, NOTES.E4, NOTES.C4, NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4, NOTES.C5],
    [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4, NOTES.C4, NOTES.A3, NOTES.C4, NOTES.E4,
     NOTES.F4, NOTES.C4, NOTES.A3, NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4, NOTES.A4],
    [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4, NOTES.D4, NOTES.B3, NOTES.D4, NOTES.F4,
     NOTES.G4, NOTES.D4, NOTES.B3, NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4, NOTES.B4],
  ];

  const localT = t % patternLen;
  const noteIdx = Math.floor(localT / noteLen) % patterns[patternIdx].length;
  const noteT = localT - noteIdx * noteLen;
  const freq = patterns[patternIdx][noteIdx];

  const env = adsr(noteT, 0.01, 0.15, 0.3, 0.2, noteLen);
  const phase = 2 * Math.PI * freq * t;
  const val = Math.sin(phase) * env * 0.12;

  // Slight stereo spread based on note
  const pan = 0.3 * Math.sin(noteIdx * 1.7);
  return [val * (0.5 - pan), val * (0.5 + pan)];
}

/** Sub bass - very gentle */
function bassLayer(t) {
  const chordLen = BEAT_DURATION * 8;
  const chordIdx = Math.floor(t / chordLen) % 4;
  const bassNotes = [NOTES.C3 * 0.5, NOTES.A3 * 0.25, NOTES.F3 * 0.25, NOTES.G3 * 0.25];
  const freq = bassNotes[chordIdx];

  const localT = t % chordLen;
  const env = adsr(localT, 0.3, 0.5, 0.6, 0.5, chordLen);
  const val = Math.sin(2 * Math.PI * freq * t) * env * 0.15;
  return [val, val];
}

/** Soft hi-hat-like ticks */
function tickLayer(t) {
  const tickInterval = BEAT_DURATION * 0.5;
  const localT = t % tickInterval;

  if (localT > 0.05) return [0, 0];

  // Simple noise burst
  const env = Math.exp(-localT * 120);
  const noise = (Math.random() * 2 - 1) * env * 0.03;

  // Alternate pan slightly
  const tickIdx = Math.floor(t / tickInterval);
  const pan = 0.2 * (tickIdx % 2 === 0 ? -1 : 1);
  return [noise * (0.5 - pan), noise * (0.5 + pan)];
}

/** High sparkle notes - occasional */
function sparkleLayer(t) {
  const sparkleInterval = BEAT_DURATION * 4;
  const localT = t % sparkleInterval;

  if (localT > 0.8) return [0, 0];

  const sparkleNotes = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C5];
  const idx = Math.floor(t / sparkleInterval) % sparkleNotes.length;
  const freq = sparkleNotes[idx];

  const env = adsr(localT, 0.02, 0.2, 0.15, 0.4, 0.8);
  const val = Math.sin(2 * Math.PI * freq * t) * env * 0.06;

  return [val * 0.4, val * 0.6];
}

// --- Main generation ---

function generateAudio() {
  console.log("\nSubTrack Promo Audio Generator");
  console.log(`  Sample rate: ${SAMPLE_RATE}`);
  console.log(`  Duration: ${DURATION}s`);
  console.log(`  BPM: ${BPM}\n`);

  const outputDir = path.join(__dirname, "..", "assets", "promo");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const bufferL = new Float32Array(TOTAL_SAMPLES);
  const bufferR = new Float32Array(TOTAL_SAMPLES);

  // Effects
  const delay1 = createDelay(0.375, 0.3, 0.25); // 1/8 note delay
  const delay2 = createDelay(0.75, 0.2, 0.15);  // 1/4 note delay
  const lpf = createLPF(3500);

  console.log("Synthesizing audio...");

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;

    // Layer mixing
    const [padL, padR] = padLayer(t);
    const [arpL, arpR] = t > 2 ? arpLayer(t) : [0, 0]; // arp enters at 2s
    const [bassL, bassR] = bassLayer(t);
    const [tickL, tickR] = t > 4 ? tickLayer(t) : [0, 0]; // ticks enter at 4s
    const [sparkL, sparkR] = t > 8 ? sparkleLayer(t) : [0, 0]; // sparkle at 8s

    let mixL = padL + arpL + bassL + tickL + sparkL;
    let mixR = padR + arpR + bassR + tickR + sparkR;

    // Apply delay
    [mixL, mixR] = applyDelay(delay1, mixL, mixR);
    [mixL, mixR] = applyDelay(delay2, mixL, mixR);

    // Apply LPF
    [mixL, mixR] = applyLPF(lpf, mixL, mixR);

    // Master volume envelope
    let vol = 0.85;
    // Fade in (first 3 seconds)
    if (t < 3) vol *= t / 3;
    // Fade out (last 3 seconds)
    if (t > DURATION - 3) vol *= (DURATION - t) / 3;

    bufferL[i] = clamp(mixL * vol, -1, 1);
    bufferR[i] = clamp(mixR * vol, -1, 1);

    if (i % (SAMPLE_RATE * 5) === 0) {
      process.stdout.write(`\r  Progress: ${Math.round((t / DURATION) * 100)}%`);
    }
  }
  console.log("\r  Progress: 100%");

  // Write WAV file
  console.log("\nWriting WAV file...");
  const wavPath = path.join(outputDir, "subtrack-bgm.wav");
  writeWav(wavPath, bufferL, bufferR);

  const stats = fs.statSync(wavPath);
  console.log(`  Audio saved: ${wavPath}`);
  console.log(`  Size: ${(stats.size / (1024 * 1024)).toFixed(1)} MB`);
  console.log("\nDone!");
}

function writeWav(filepath, left, right) {
  const numSamples = left.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = numSamples * CHANNELS * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // RIFF header
  buffer.write("RIFF", offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write("WAVE", offset); offset += 4;

  // fmt chunk
  buffer.write("fmt ", offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM
  buffer.writeUInt16LE(CHANNELS, offset); offset += 2;
  buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * bytesPerSample, offset); offset += 4;
  buffer.writeUInt16LE(CHANNELS * bytesPerSample, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data chunk
  buffer.write("data", offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Interleaved PCM data
  for (let i = 0; i < numSamples; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    const sR = Math.max(-1, Math.min(1, right[i]));
    buffer.writeInt16LE(Math.round(sL * 32767), offset); offset += 2;
    buffer.writeInt16LE(Math.round(sR * 32767), offset); offset += 2;
  }

  fs.writeFileSync(filepath, buffer);
}

generateAudio();
