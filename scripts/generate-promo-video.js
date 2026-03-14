#!/usr/bin/env node
/**
 * SubTrack Promotional Video Generator — Vertical (YouTube Shorts)
 * Native 1080x1920 vertical layout for mobile-first viewing.
 *
 * Usage: node scripts/generate-promo-video.js
 */

const sharp = require("sharp");
const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "..", "assets", "promo");
const FRAMES_DIR = path.join(OUTPUT_DIR, "frames");

const W = 1080;
const H = 1920;

const COLORS = {
  bg1: "#0a0f1a",
  bg2: "#111827",
  bg3: "#1f2937",
  green: "#22c55e",
  white: "#ffffff",
  gray: "#9ca3af",
  lightGray: "#d1d5db",
  cardBg: "#1a2332",
  purple: "#7c3aed",
};

// ----- SVG HELPERS -----

function bgGradient(id = "mainBg") {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="${COLORS.bg1}"/>
    <stop offset="100%" stop-color="${COLORS.bg2}"/>
  </linearGradient>`;
}

function decorCircles() {
  return `
    <circle cx="900" cy="200" r="250" fill="${COLORS.green}" opacity="0.04"/>
    <circle cx="100" cy="1700" r="200" fill="${COLORS.green}" opacity="0.03"/>
    <circle cx="540" cy="960" r="350" fill="${COLORS.purple}" opacity="0.02"/>
  `;
}

function appIcon(x, y, size) {
  const rx = Math.round(size * 0.22);
  const s = size / 100;
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${COLORS.green}"/>
    <g transform="translate(${x}, ${y}) scale(${s})">
      <path d="M 35 25 C 50 25, 68 28, 68 42 C 68 52, 55 55, 45 55" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
      <path d="M 50 48 L 43 55 L 50 62" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 65 75 C 50 75, 32 72, 32 58 C 32 48, 45 45, 55 45" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
      <path d="M 50 38 L 57 45 L 50 52" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

function progressBar(x, y, w, h, pct, color = COLORS.green) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#374151"/>
    <rect x="${x}" y="${y}" width="${w * pct}" height="${h}" rx="${h / 2}" fill="${color}"/>
  `;
}

function card(x, y, w, h, rx = 24) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${COLORS.cardBg}" stroke="#2d3748" stroke-width="1"/>`;
}

function easeOut(t) { return 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3); }

// ===== SCENES (vertical layout) =====

/** Scene 1: Intro (0-89, 3s) */
function scene1(fi) {
  const p = easeOut(fi / 60);
  const iconSize = 160 * p;
  const ix = (W - iconSize) / 2;
  const tOp = Math.max(0, (fi / 60 - 0.3) / 0.7);
  const sOp = Math.max(0, (fi / 60 - 0.5) / 0.5);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <!-- Glow -->
    <circle cx="${W / 2}" cy="750" r="200" fill="${COLORS.green}" opacity="0.06"/>
    ${iconSize > 5 ? appIcon(ix, 640 - iconSize / 2, iconSize) : ""}
    <text x="${W / 2}" y="${810 + 10 * p}" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${tOp}">SubTrack</text>
    <text x="${W / 2}" y="910" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="${COLORS.green}" text-anchor="middle" opacity="${sOp}">Expense &amp; Subscription Tracker</text>
    <text x="${W / 2}" y="980" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${COLORS.gray}" text-anchor="middle" opacity="${sOp}">Your finances, simplified.</text>
  </svg>`;
}

/** Scene 2: Expense Tracking (90-209, 4s) */
function scene2(fi) {
  const lf = fi - 90;
  const p = easeOut(lf / 30);
  const cats = [
    { name: "Food &amp; Drink", amount: "$245", pct: 0.7, color: "#f97316" },
    { name: "Transport", amount: "$120", pct: 0.35, color: "#3b82f6" },
    { name: "Entertainment", amount: "$85", pct: 0.25, color: "#8b5cf6" },
    { name: "Shopping", amount: "$190", pct: 0.55, color: "#ec4899" },
    { name: "Bills &amp; Utilities", amount: "$310", pct: 0.9, color: "#6366f1" },
  ];

  let items = "";
  cats.forEach((c, i) => {
    const ip = easeOut((lf - i * 8) / 20);
    const y = 620 + i * 150;
    items += `
      <g opacity="${ip}">
        ${card(80, y - 30, 920, 120)}
        <text x="130" y="${y + 18}" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${COLORS.white}">${c.name}</text>
        <text x="940" y="${y + 18}" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${c.color}" text-anchor="end" font-weight="bold">${c.amount}</text>
        ${progressBar(130, y + 42, 770, 14, c.pct * ip, c.color)}
      </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <text x="${W / 2}" y="340" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${COLORS.green}" text-anchor="middle" letter-spacing="4" opacity="${p}">FEATURE</text>
    <text x="${W / 2}" y="420" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${p}">Expense Tracking</text>
    <text x="${W / 2}" y="490" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.gray}" text-anchor="middle" opacity="${p}">Categorize and monitor every expense</text>
    ${items}
  </svg>`;
}

/** Scene 3: Budget &amp; Charts (210-329, 4s) */
function scene3(fi) {
  const lf = fi - 210;
  const p = easeOut(lf / 30);
  const cp = Math.min(lf / 60, 1);
  const cx = W / 2, cy = 750, r = 180;

  const segs = [
    { pct: 0.30, color: "#f97316" },
    { pct: 0.20, color: "#3b82f6" },
    { pct: 0.15, color: "#8b5cf6" },
    { pct: 0.25, color: "#ec4899" },
    { pct: 0.10, color: "#6366f1" },
  ];

  const circ = 2 * Math.PI * r;
  let donut = "", off = 0;
  segs.forEach((s) => {
    const len = circ * s.pct * cp;
    donut += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="45"
      stroke-dasharray="${len} ${circ}" stroke-dashoffset="${-off * cp}"
      transform="rotate(-90 ${cx} ${cy})" opacity="0.9"/>`;
    off += circ * s.pct;
  });

  const bp = Math.min(Math.max(lf - 20, 0) / 40, 1);
  const budgets = [
    { label: "Food", spent: 245, total: 300, color: "#f97316" },
    { label: "Transport", spent: 120, total: 150, color: "#3b82f6" },
    { label: "Entertainment", spent: 85, total: 100, color: "#8b5cf6" },
    { label: "Shopping", spent: 190, total: 200, color: "#ec4899" },
  ];

  let bItems = "";
  budgets.forEach((b, i) => {
    const y = 1090 + i * 130;
    const pctVal = Math.min((b.spent / b.total) * bp, 1);
    const col = pctVal > 0.9 ? "#ef4444" : pctVal > 0.7 ? "#f59e0b" : b.color;
    bItems += `
      <g opacity="${bp}">
        <text x="130" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${COLORS.white}">${b.label}</text>
        <text x="940" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${COLORS.gray}" text-anchor="end">$${b.spent} / $${b.total}</text>
        ${progressBar(130, y + 16, 780, 16, pctVal, col)}
      </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <text x="${W / 2}" y="340" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${COLORS.green}" text-anchor="middle" letter-spacing="4" opacity="${p}">FEATURE</text>
    <text x="${W / 2}" y="420" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${p}">Budget &amp; Charts</text>
    <text x="${W / 2}" y="490" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.gray}" text-anchor="middle" opacity="${p}">Set limits and visualize your spending</text>
    <circle cx="${cx}" cy="${cy}" r="${r - 22}" fill="${COLORS.bg1}"/>
    ${donut}
    <circle cx="${cx}" cy="${cy}" r="${r - 45}" fill="${COLORS.bg1}"/>
    <text x="${cx}" y="${cy - 10}" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="bold" fill="${COLORS.white}" text-anchor="middle">$950</text>
    <text x="${cx}" y="${cy + 30}" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${COLORS.gray}" text-anchor="middle">This Month</text>
    ${bItems}
  </svg>`;
}

/** Scene 4: Subscriptions (330-449, 4s) */
function scene4(fi) {
  const lf = fi - 330;
  const p = easeOut(lf / 30);
  const subs = [
    { name: "Netflix", price: "$15.99/mo", color: "#e50914", icon: "N" },
    { name: "Spotify", price: "$9.99/mo", color: "#1db954", icon: "S" },
    { name: "iCloud", price: "$2.99/mo", color: "#3b82f6", icon: "i" },
    { name: "YouTube Premium", price: "$13.99/mo", color: "#ff0000", icon: "Y" },
    { name: "ChatGPT Plus", price: "$20.00/mo", color: "#10a37f", icon: "G" },
  ];

  let cards = "";
  subs.forEach((s, i) => {
    const ip = easeOut((lf - i * 10) / 20);
    const y = 620 + i * 150;
    cards += `
      <g opacity="${ip}">
        ${card(80, y - 35, 920, 120)}
        <rect x="120" y="${y - 10}" width="60" height="60" rx="14" fill="${s.color}"/>
        <text x="150" y="${y + 30}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#fff" text-anchor="middle" font-weight="bold">${s.icon}</text>
        <text x="210" y="${y + 5}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${COLORS.white}">${s.name}</text>
        <text x="210" y="${y + 42}" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="${COLORS.gray}">Renews in 15 days</text>
        <text x="940" y="${y + 18}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.green}" text-anchor="end" font-weight="bold">${s.price}</text>
      </g>`;
  });

  const tOp = Math.max(0, (lf - 60) / 20);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <text x="${W / 2}" y="340" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${COLORS.green}" text-anchor="middle" letter-spacing="4" opacity="${p}">FEATURE</text>
    <text x="${W / 2}" y="420" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${p}">Subscriptions</text>
    <text x="${W / 2}" y="490" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.gray}" text-anchor="middle" opacity="${p}">Track all subscriptions in one place</text>
    ${cards}
    <g opacity="${tOp}">
      ${card(80, 1420, 920, 80)}
      <text x="150" y="1470" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.gray}">Monthly Total</text>
      <text x="940" y="1470" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="${COLORS.green}" text-anchor="end" font-weight="bold">$62.96/mo</text>
    </g>
  </svg>`;
}

/** Scene 5: Smart Tips (450-569, 4s) */
function scene5(fi) {
  const lf = fi - 450;
  const p = easeOut(lf / 30);
  const tips = [
    { title: "Food spending is 40% above average", border: "#f59e0b" },
    { title: "Consider canceling unused subs", border: COLORS.green },
    { title: "You saved 15% more than last month!", border: "#7c3aed" },
    { title: "You spend most on weekends", border: "#3b82f6" },
  ];

  let items = "";
  tips.forEach((t, i) => {
    const ip = easeOut((lf - i * 15) / 25);
    const y = 620 + i * 200;
    items += `
      <g opacity="${ip}">
        <rect x="80" y="${y - 30}" width="920" height="150" rx="20" fill="${COLORS.cardBg}" stroke="${t.border}" stroke-width="2"/>
        <rect x="80" y="${y - 30}" width="5" height="150" rx="2" fill="${t.border}"/>
        <text x="130" y="${y + 30}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.white}">${t.title}</text>
        <text x="130" y="${y + 72}" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${COLORS.gray}">Based on your spending patterns</text>
      </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <text x="${W / 2}" y="340" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${COLORS.purple}" text-anchor="middle" letter-spacing="4" opacity="${p}">FEATURE</text>
    <text x="${W / 2}" y="420" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${p}">Smart Tips</text>
    <text x="${W / 2}" y="490" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.gray}" text-anchor="middle" opacity="${p}">Personalized insights to save more</text>
    ${items}
  </svg>`;
}

/** Scene 6: More Features (570-689, 4s) */
function scene6(fi) {
  const lf = fi - 570;
  const p = easeOut(lf / 30);
  const features = [
    { title: "Dark Mode", desc: "Easy on the eyes" },
    { title: "Biometric Lock", desc: "Fingerprint &amp; Face ID" },
    { title: "8 Languages", desc: "Global support" },
    { title: "CSV Export", desc: "Share your data" },
    { title: "Auto Detection", desc: "Recurring expenses" },
    { title: "Tags &amp; Labels", desc: "Organize freely" },
  ];

  let grid = "";
  features.forEach((f, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const ip = easeOut((lf - i * 8) / 20);
    const x = 120 + col * 460;
    const y = 600 + row * 280;
    grid += `
      <g opacity="${ip}">
        ${card(x, y, 400, 220)}
        <text x="${x + 200}" y="${y + 100}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="${COLORS.white}" text-anchor="middle">${f.title}</text>
        <text x="${x + 200}" y="${y + 148}" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${COLORS.gray}" text-anchor="middle">${f.desc}</text>
      </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <text x="${W / 2}" y="340" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${COLORS.green}" text-anchor="middle" letter-spacing="4" opacity="${p}">AND MORE</text>
    <text x="${W / 2}" y="420" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${p}">Packed with Features</text>
    <text x="${W / 2}" y="490" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.gray}" text-anchor="middle" opacity="${p}">Everything you need</text>
    ${grid}
  </svg>`;
}

/** Scene 7: Privacy (690-809, 4s) */
function scene7(fi) {
  const lf = fi - 690;
  const p = easeOut(lf / 30);
  const sp = easeOut((lf - 10) / 30);

  const points = [
    "All data stored locally on your device",
    "No personal data sent to servers",
    "No account required",
    "Delete all data anytime",
  ];

  let items = "";
  points.forEach((pt, i) => {
    const ip = Math.max(0, Math.min(1, (lf - 20 - i * 10) / 20));
    const y = 920 + i * 100;
    items += `
      <g opacity="${ip}">
        <circle cx="200" cy="${y}" r="14" fill="${COLORS.green}"/>
        <text x="240" y="${y + 9}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${COLORS.lightGray}">${pt}</text>
      </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <g opacity="${sp}" transform="translate(${W / 2 - 60}, 460)">
      <path d="M60 0 L120 30 L120 82 C120 127 60 157 60 157 C60 157 0 127 0 82 L0 30 Z" fill="none" stroke="${COLORS.green}" stroke-width="4"/>
      <path d="M38 78 L55 95 L88 58" fill="none" stroke="${COLORS.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="${W / 2}" y="700" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${p}">Privacy First</text>
    <text x="${W / 2}" y="770" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${COLORS.gray}" text-anchor="middle" opacity="${p}">Your data stays on your device</text>
    ${items}
  </svg>`;
}

/** Scene 8: Outro / CTA (810-929, 4s) */
function scene8(fi) {
  const lf = fi - 810;
  const p = easeOut(lf / 40);
  const ctaOp = Math.max(0, (lf - 30) / 30);
  const freeOp = Math.max(0, (lf - 50) / 30);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${bgGradient()}</defs>
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
    ${decorCircles()}
    <circle cx="${W / 2}" cy="680" r="220" fill="${COLORS.green}" opacity="0.06"/>
    ${appIcon((W - 150) / 2, 560, 150)}
    <text x="${W / 2}" y="800" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="bold" fill="${COLORS.white}" text-anchor="middle" opacity="${p}">SubTrack</text>
    <text x="${W / 2}" y="880" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${COLORS.green}" text-anchor="middle" opacity="${p}">Expense &amp; Subscription Tracker</text>
    <g opacity="${ctaOp}">
      <rect x="${W / 2 - 250}" y="1000" width="500" height="90" rx="45" fill="${COLORS.green}"/>
      <text x="${W / 2}" y="1058" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="${COLORS.white}" text-anchor="middle">Download Free</text>
    </g>
    <text x="${W / 2}" y="1170" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${COLORS.gray}" text-anchor="middle" opacity="${freeOp}">Available on Google Play</text>
    <text x="${W / 2}" y="1340" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${COLORS.gray}" text-anchor="middle" opacity="${freeOp}">Budget Planning  ·  Smart Tips  ·  Charts</text>
    <text x="${W / 2}" y="1390" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${COLORS.gray}" text-anchor="middle" opacity="${freeOp}">Dark Mode  ·  8 Languages  ·  Privacy First</text>
  </svg>`;
}

// ----- MAIN -----

function getFrame(fi) {
  if (fi < 90) return scene1(fi);
  if (fi < 210) return scene2(fi);
  if (fi < 330) return scene3(fi);
  if (fi < 450) return scene4(fi);
  if (fi < 570) return scene5(fi);
  if (fi < 690) return scene6(fi);
  if (fi < 810) return scene7(fi);
  return scene8(fi);
}

async function main() {
  const TOTAL = 930;
  const FPS = 30;

  console.log(`\nSubTrack Promo Video (Vertical)`);
  console.log(`  ${W}x${H} | ${FPS}fps | ${(TOTAL / FPS).toFixed(1)}s | ${TOTAL} frames\n`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

  console.log("Generating frames...");
  const batch = 20;
  for (let i = 0; i < TOTAL; i += batch) {
    const jobs = [];
    for (let j = i; j < Math.min(i + batch, TOTAL); j++) {
      const svg = getFrame(j);
      const out = path.join(FRAMES_DIR, `frame_${String(j).padStart(5, "0")}.png`);
      jobs.push(sharp(Buffer.from(svg)).resize(W, H).png({ quality: 90 }).toFile(out));
    }
    await Promise.all(jobs);
    process.stdout.write(`\r  Progress: ${Math.min(Math.round(((i + batch) / TOTAL) * 100), 100)}%`);
  }
  console.log("\n  Done!\n");

  // Encode both versions
  const audioPath = path.join(OUTPUT_DIR, "subtrack-bgm.wav");
  const hasAudio = fs.existsSync(audioPath);

  // Vertical (Shorts)
  const shortOut = path.join(OUTPUT_DIR, "subtrack-short.mp4");
  const audioArgs = hasAudio ? `-i "${audioPath}" -c:a aac -b:a 192k -shortest` : "";
  const cmd = `ffmpeg -y -framerate ${FPS} -i "${path.join(FRAMES_DIR, "frame_%05d.png")}" ${audioArgs} -c:v libx264 -pix_fmt yuv420p -preset slow -crf 18 -movflags +faststart "${shortOut}"`;
  console.log("Encoding vertical video...");
  execSync(cmd, { stdio: "inherit" });

  // Also make horizontal version (scale to fit in 1920x1080 with dark bg)
  const horizOut = path.join(OUTPUT_DIR, "subtrack-promo-with-music.mp4");
  const hCmd = `ffmpeg -y -i "${shortOut}" -vf "split[original][blur];[blur]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=30:5[bg];[original]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0" -c:v libx264 -crf 18 -preset slow -c:a copy -movflags +faststart "${horizOut}"`;
  console.log("\nEncoding horizontal version...");
  execSync(hCmd, { stdio: "inherit" });

  // Cleanup
  console.log("\nCleaning up frames...");
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });

  const sStats = fs.statSync(shortOut);
  const hStats = fs.statSync(horizOut);
  console.log(`\n  Vertical (Shorts): ${shortOut} (${(sStats.size / 1048576).toFixed(1)} MB)`);
  console.log(`  Horizontal:        ${horizOut} (${(hStats.size / 1048576).toFixed(1)} MB)`);
  console.log(`\nDone!`);
}

main().catch((err) => { console.error("Error:", err); process.exit(1); });
