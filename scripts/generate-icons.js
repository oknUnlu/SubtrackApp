#!/usr/bin/env node
/**
 * SubTrack App Icon Generator
 * Generates all PNG icon assets from the SVG logo design.
 *
 * The SVG mark design here MUST stay in sync with components/AppLogo.tsx.
 *
 * Usage: node scripts/generate-icons.js
 */

const sharp = require("sharp");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "assets", "images");

/**
 * Build the SVG string for the icon mark.
 * @param {object} opts
 * @param {number} opts.size - Output image size in px
 * @param {number} opts.padding - Padding around the icon (for Android adaptive safe zone)
 * @param {boolean} opts.monochrome - If true, renders black-on-transparent (Android 13+)
 */
function buildSvg({ size, padding = 0, monochrome = false }) {
  const iconSize = size - padding * 2;
  const bgColor = monochrome ? "none" : "#22c55e";
  const fgColor = monochrome ? "#000000" : "#FFFFFF";
  const rx = Math.round(iconSize * 0.22);

  // Scale factor to map the 100x100 viewBox paths to the actual icon size
  const scale = iconSize / 100;
  const tx = padding;
  const ty = padding;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${tx}" y="${ty}" width="${iconSize}" height="${iconSize}" rx="${rx}" ry="${rx}" fill="${bgColor}" />
  <g transform="translate(${tx}, ${ty}) scale(${scale})">
    <path d="M 35 25 C 50 25, 68 28, 68 42 C 68 52, 55 55, 45 55" fill="none" stroke="${fgColor}" stroke-width="7" stroke-linecap="round" />
    <path d="M 50 48 L 43 55 L 50 62" fill="none" stroke="${fgColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 65 75 C 50 75, 32 72, 32 58 C 32 48, 45 45, 55 45" fill="none" stroke="${fgColor}" stroke-width="7" stroke-linecap="round" />
    <path d="M 50 38 L 57 45 L 50 52" fill="none" stroke="${fgColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`;
}

const ICONS = [
  { name: "icon.png", size: 1024, padding: 0 },
  { name: "splash-icon.png", size: 200, padding: 0 },
  { name: "android-icon-foreground.png", size: 432, padding: 72 },
  { name: "android-icon-monochrome.png", size: 432, padding: 72, monochrome: true },
  { name: "favicon.png", size: 48, padding: 0 },
];

async function generate() {
  for (const icon of ICONS) {
    const svg = buildSvg(icon);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(path.join(OUTPUT_DIR, icon.name));

    console.log(`  ✓ ${icon.name} (${icon.size}×${icon.size})`);
  }

  // Also generate solid green background for Android adaptive icon
  const bgSize = 432;
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bgSize}" height="${bgSize}"><rect width="${bgSize}" height="${bgSize}" fill="#22c55e" /></svg>`;
  await sharp(Buffer.from(bgSvg))
    .resize(bgSize, bgSize)
    .png()
    .toFile(path.join(OUTPUT_DIR, "android-icon-background.png"));
  console.log(`  ✓ android-icon-background.png (${bgSize}×${bgSize})`);

  console.log("\nDone! All icons generated in assets/images/");
}

generate().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
