#!/usr/bin/env node
/**
 * SubTrack – App Store Screenshot Generator
 * Generates promotional screenshots for Phone, 7" Tablet, 10" Tablet
 *
 * Usage: node scripts/generate-screenshots.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "..", "assets", "screenshots");

// Google Play dimensions
const DEVICES = {
  phone:    { w: 1080, h: 1920, label: "Phone",       dir: "phone" },
  tablet7:  { w: 1200, h: 1920, label: "7\" Tablet",  dir: "tablet-7" },
  tablet10: { w: 1920, h: 1200, label: "10\" Tablet",  dir: "tablet-10" },
};

// ─── Colors ───
const C = {
  bg: "#0d1321",
  bgCard: "#1a2332",
  surface: "#1f2937",
  green: "#22c55e",
  greenDark: "#16a34a",
  white: "#ffffff",
  text: "#f9fafb",
  textSec: "#9ca3af",
  textMuted: "#6b7280",
  border: "#2d3748",
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  orange: "#f97316",
  blue: "#3b82f6",
  pink: "#ec4899",
  indigo: "#6366f1",
  red: "#ef4444",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  yellow: "#f59e0b",
};

const CATS = [
  { name: "Food", icon: "F", color: C.orange },
  { name: "Transport", icon: "T", color: C.blue },
  { name: "Fun", icon: "G", color: C.purpleLight },
  { name: "Shopping", icon: "S", color: C.pink },
  { name: "Bills", icon: "B", color: C.indigo },
  { name: "Health", icon: "H", color: C.red },
  { name: "Education", icon: "E", color: C.teal },
  { name: "Tech", icon: "C", color: C.cyan },
  { name: "Other", icon: "O", color: C.textMuted },
];

// ─── SVG helpers ───
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function bgGrad(w, h) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#0a0f1a"/>
      <stop offset="100%" stop-color="${C.bg}"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.green}"/>
      <stop offset="100%" stop-color="${C.greenDark}"/>
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.purple}"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w * 0.85}" cy="${h * 0.15}" r="${Math.min(w, h) * 0.18}" fill="${C.green}" opacity="0.04"/>
  <circle cx="${w * 0.1}" cy="${h * 0.85}" r="${Math.min(w, h) * 0.15}" fill="${C.purple}" opacity="0.03"/>`;
}

function card(x, y, w, h, rx = 20) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${C.bgCard}" stroke="${C.border}" stroke-width="1"/>`;
}

function progressBar(x, y, w, h, pct, color = C.green) {
  const col = pct > 0.9 ? C.red : pct > 0.75 ? C.yellow : color;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="#374151"/>
    <rect x="${x}" y="${y}" width="${Math.round(w * pct)}" height="${h}" rx="${h/2}" fill="${col}"/>`;
}

function statusBar(w, s) {
  const h = Math.round(36 * s);
  return `<rect x="0" y="0" width="${w}" height="${h}" fill="rgba(0,0,0,0.3)"/>
    <text x="${Math.round(24*s)}" y="${Math.round(24*s)}" font-family="Arial" font-size="${Math.round(14*s)}" fill="${C.white}">9:41</text>
    <text x="${w - Math.round(24*s)}" y="${Math.round(24*s)}" font-family="Arial" font-size="${Math.round(14*s)}" fill="${C.white}" text-anchor="end">100%</text>`;
}

function navBar(w, h, s, active = "home") {
  const barH = Math.round(70 * s);
  const y = h - barH;
  const tabs = [
    { id: "home", icon: "⌂", label: "Home" },
    { id: "subs", icon: "↻", label: "Subs" },
    { id: "add", icon: "+", label: "Add" },
    { id: "ai", icon: "✦", label: "AI" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];
  const tw = w / tabs.length;
  let items = `<rect x="0" y="${y}" width="${w}" height="${barH}" fill="${C.surface}"/>
    <line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${C.border}" stroke-width="1"/>`;
  tabs.forEach((t, i) => {
    const cx = Math.round(tw * i + tw / 2);
    const col = t.id === active ? C.green : C.textMuted;
    const fs1 = Math.round(22 * s);
    const fs2 = Math.round(11 * s);
    items += `<text x="${cx}" y="${y + Math.round(30*s)}" font-family="Arial" font-size="${fs1}" fill="${col}" text-anchor="middle">${t.icon}</text>`;
    items += `<text x="${cx}" y="${y + Math.round(50*s)}" font-family="Arial" font-size="${fs2}" fill="${col}" text-anchor="middle">${t.label}</text>`;
  });
  return items;
}

// Header with caption at top
function promoHeader(w, s, title, subtitle) {
  const ty = Math.round(80 * s);
  const sy = Math.round(120 * s);
  return `<text x="${w/2}" y="${ty}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(32*s)}" font-weight="bold" fill="${C.white}" text-anchor="middle">${esc(title)}</text>
    <text x="${w/2}" y="${sy}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(18*s)}" fill="${C.green}" text-anchor="middle">${esc(subtitle)}</text>`;
}

// Phone frame (rounded rect with screen inside)
function phoneFrame(w, h, s, screenContent) {
  const pad = Math.round(30 * s);
  const fw = w - pad * 2;
  const fh = h - Math.round(160 * s) - pad;
  const fy = Math.round(150 * s);
  const rx = Math.round(28 * s);
  return `<rect x="${pad}" y="${fy}" width="${fw}" height="${fh}" rx="${rx}" fill="#000" stroke="#444" stroke-width="${Math.round(3*s)}"/>
    <clipPath id="screenClip"><rect x="${pad + Math.round(4*s)}" y="${fy + Math.round(4*s)}" width="${fw - Math.round(8*s)}" height="${fh - Math.round(8*s)}" rx="${rx - 2}"/></clipPath>
    <g clip-path="url(#screenClip)">
      <g transform="translate(${pad + Math.round(4*s)}, ${fy + Math.round(4*s)})">
        ${screenContent(fw - Math.round(8*s), fh - Math.round(8*s), s)}
      </g>
    </g>`;
}

// ─── SCREEN RENDERERS ───
// Each returns inner SVG content for the "screen" area

function screenHome(sw, sh, s) {
  const p = Math.round(20 * s);
  const fs = (n) => Math.round(n * s);
  let y = p;

  // Status bar area
  let svg = `<rect width="${sw}" height="${sh}" fill="${C.bg}"/>`;
  y += fs(20);

  // Title
  svg += `<text x="${p}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(26)}" font-weight="bold" fill="${C.white}">Dashboard</text>`;
  y += fs(50);

  // Total spending card with gradient
  const cardH = fs(130);
  svg += `<rect x="${p}" y="${y}" width="${sw - p*2}" height="${cardH}" rx="${fs(16)}" fill="url(#greenGrad)"/>`;
  svg += `<text x="${p + fs(20)}" y="${y + fs(35)}" font-family="Arial" font-size="${fs(14)}" fill="rgba(255,255,255,0.8)">This Month</text>`;
  svg += `<text x="${p + fs(20)}" y="${y + fs(75)}" font-family="Arial" font-size="${fs(38)}" font-weight="bold" fill="${C.white}">$1,245.00</text>`;
  svg += `<text x="${p + fs(20)}" y="${y + fs(105)}" font-family="Arial" font-size="${fs(13)}" fill="rgba(255,255,255,0.7)">-12% vs last month</text>`;
  y += cardH + fs(16);

  // Stats row
  const statW = (sw - p * 3) / 2;
  svg += card(p, y, statW, fs(80), fs(14));
  svg += `<text x="${p + fs(14)}" y="${y + fs(30)}" font-family="Arial" font-size="${fs(12)}" fill="${C.textSec}">Active Subs</text>`;
  svg += `<text x="${p + fs(14)}" y="${y + fs(58)}" font-family="Arial" font-size="${fs(24)}" font-weight="bold" fill="${C.white}">7</text>`;
  svg += card(p * 2 + statW, y, statW, fs(80), fs(14));
  svg += `<text x="${p * 2 + statW + fs(14)}" y="${y + fs(30)}" font-family="Arial" font-size="${fs(12)}" fill="${C.textSec}">Daily Avg</text>`;
  svg += `<text x="${p * 2 + statW + fs(14)}" y="${y + fs(58)}" font-family="Arial" font-size="${fs(24)}" font-weight="bold" fill="${C.white}">$41.50</text>`;
  y += fs(100);

  // Donut chart section
  svg += `<text x="${p}" y="${y + fs(22)}" font-family="Arial" font-size="${fs(18)}" font-weight="bold" fill="${C.white}">Categories</text>`;
  y += fs(38);

  const cx = sw / 2, cy = y + fs(90), r = fs(70);
  const segs = [
    { pct: 0.30, color: C.orange },
    { pct: 0.20, color: C.blue },
    { pct: 0.15, color: C.purpleLight },
    { pct: 0.25, color: C.pink },
    { pct: 0.10, color: C.indigo },
  ];
  const circ = 2 * Math.PI * r;
  let off = 0;
  segs.forEach((seg) => {
    const len = circ * seg.pct;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${fs(28)}" stroke-dasharray="${len} ${circ}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;
    off += len;
  });
  svg += `<circle cx="${cx}" cy="${cy}" r="${r - fs(20)}" fill="${C.bg}"/>`;
  svg += `<text x="${cx}" y="${cy - fs(5)}" font-family="Arial" font-size="${fs(20)}" font-weight="bold" fill="${C.white}" text-anchor="middle">$1,245</text>`;
  svg += `<text x="${cx}" y="${cy + fs(14)}" font-family="Arial" font-size="${fs(11)}" fill="${C.textSec}" text-anchor="middle">Total</text>`;
  y += fs(200);

  // Weekly bar chart
  svg += `<text x="${p}" y="${y + fs(22)}" font-family="Arial" font-size="${fs(18)}" font-weight="bold" fill="${C.white}">Weekly Trend</text>`;
  y += fs(40);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const vals = [0.4, 0.6, 0.3, 0.8, 0.5, 0.9, 0.7];
  const barW = Math.round((sw - p * 2) / days.length * 0.6);
  const barGap = Math.round((sw - p * 2) / days.length);
  const maxBarH = fs(80);
  days.forEach((d, i) => {
    const bx = p + i * barGap + (barGap - barW) / 2;
    const bh = Math.round(maxBarH * vals[i]);
    svg += `<rect x="${bx}" y="${y + maxBarH - bh}" width="${barW}" height="${bh}" rx="${fs(4)}" fill="${C.green}" opacity="0.8"/>`;
    svg += `<text x="${bx + barW/2}" y="${y + maxBarH + fs(16)}" font-family="Arial" font-size="${fs(10)}" fill="${C.textMuted}" text-anchor="middle">${d}</text>`;
  });

  return svg;
}

function screenSubscriptions(sw, sh, s) {
  const p = Math.round(20 * s);
  const fs = (n) => Math.round(n * s);
  let y = p;

  let svg = `<rect width="${sw}" height="${sh}" fill="${C.bg}"/>`;
  y += fs(20);

  svg += `<text x="${p}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(26)}" font-weight="bold" fill="${C.white}">Subscriptions</text>`;
  y += fs(55);

  // Total card
  svg += card(p, y, sw - p*2, fs(70), fs(14));
  svg += `<text x="${p + fs(16)}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(13)}" fill="${C.textSec}">Monthly Total</text>`;
  svg += `<text x="${p + fs(16)}" y="${y + fs(52)}" font-family="Arial" font-size="${fs(22)}" font-weight="bold" fill="${C.green}">$62.96/mo</text>`;
  svg += `<text x="${sw - p - fs(16)}" y="${y + fs(42)}" font-family="Arial" font-size="${fs(13)}" fill="${C.textSec}" text-anchor="end">7 active</text>`;
  y += fs(90);

  const subs = [
    { name: "Netflix", price: "$15.99", color: "#e50914", letter: "N", next: "Renews Mar 22" },
    { name: "Spotify", price: "$9.99", color: "#1db954", letter: "S", next: "Renews Mar 28" },
    { name: "iCloud+", price: "$2.99", color: C.blue, letter: "i", next: "Renews Apr 1" },
    { name: "YouTube Premium", price: "$13.99", color: "#ff0000", letter: "Y", next: "Renews Mar 15" },
    { name: "ChatGPT Plus", price: "$20.00", color: "#10a37f", letter: "G", next: "Renews Apr 5" },
    { name: "Amazon Prime", price: "$14.99", color: "#ff9900", letter: "A", next: "Renews Jun 12" },
    { name: "Adobe CC", price: "$54.99", color: "#ff0000", letter: "A", next: "Renews Apr 20" },
  ];

  subs.forEach((sub, i) => {
    if (y + fs(80) > sh - fs(20)) return;
    const ch = fs(70);
    svg += card(p, y, sw - p*2, ch, fs(14));
    // Icon
    const iconS = fs(42);
    svg += `<rect x="${p + fs(14)}" y="${y + (ch - iconS)/2}" width="${iconS}" height="${iconS}" rx="${fs(10)}" fill="${sub.color}"/>`;
    svg += `<text x="${p + fs(14) + iconS/2}" y="${y + (ch - iconS)/2 + iconS/2 + fs(6)}" font-family="Arial" font-size="${fs(18)}" font-weight="bold" fill="#fff" text-anchor="middle">${sub.letter}</text>`;
    // Name & next
    const tx = p + fs(68);
    svg += `<text x="${tx}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(16)}" fill="${C.white}">${sub.name}</text>`;
    svg += `<text x="${tx}" y="${y + fs(48)}" font-family="Arial" font-size="${fs(11)}" fill="${C.textMuted}">${sub.next}</text>`;
    // Price
    svg += `<text x="${sw - p - fs(14)}" y="${y + fs(35)}" font-family="Arial" font-size="${fs(16)}" fill="${C.green}" text-anchor="end" font-weight="bold">${sub.price}</text>`;
    svg += `<text x="${sw - p - fs(14)}" y="${y + fs(52)}" font-family="Arial" font-size="${fs(11)}" fill="${C.textMuted}" text-anchor="end">/month</text>`;
    y += ch + fs(10);
  });

  return svg;
}

function screenAddExpense(sw, sh, s) {
  const p = Math.round(20 * s);
  const fs = (n) => Math.round(n * s);
  let y = p;

  let svg = `<rect width="${sw}" height="${sh}" fill="${C.bg}"/>`;
  y += fs(20);

  svg += `<text x="${p}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(26)}" font-weight="bold" fill="${C.white}">Add Expense</text>`;
  y += fs(60);

  // Amount field
  svg += card(p, y, sw - p*2, fs(90), fs(14));
  svg += `<text x="${p + fs(16)}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(13)}" fill="${C.textSec}">Amount</text>`;
  svg += `<text x="${p + fs(16)}" y="${y + fs(65)}" font-family="Arial" font-size="${fs(36)}" font-weight="bold" fill="${C.green}">$45.00</text>`;
  y += fs(110);

  // Title field
  svg += card(p, y, sw - p*2, fs(55), fs(14));
  svg += `<text x="${p + fs(16)}" y="${y + fs(20)}" font-family="Arial" font-size="${fs(12)}" fill="${C.textSec}">Title</text>`;
  svg += `<text x="${p + fs(16)}" y="${y + fs(42)}" font-family="Arial" font-size="${fs(16)}" fill="${C.white}">Grocery shopping</text>`;
  y += fs(75);

  // Category grid
  svg += `<text x="${p}" y="${y + fs(20)}" font-family="Arial" font-size="${fs(16)}" font-weight="bold" fill="${C.white}">Category</text>`;
  y += fs(36);

  const cols = 3;
  const gap = fs(10);
  const catW = Math.round((sw - p * 2 - gap * (cols - 1)) / cols);
  const catH = fs(70);
  CATS.forEach((cat, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = p + col * (catW + gap);
    const cy = y + row * (catH + gap);
    const selected = i === 0;
    svg += `<rect x="${cx}" y="${cy}" width="${catW}" height="${catH}" rx="${fs(12)}" fill="${selected ? cat.color + '22' : C.surface}" stroke="${selected ? cat.color : C.border}" stroke-width="${selected ? 2 : 1}"/>`;
    svg += `<circle cx="${cx + catW/2}" cy="${cy + fs(24)}" r="${fs(12)}" fill="${cat.color}" opacity="0.8"/>`;
    svg += `<text x="${cx + catW/2}" y="${cy + fs(28)}" font-family="Arial" font-size="${fs(13)}" font-weight="bold" fill="#fff" text-anchor="middle">${cat.icon}</text>`;
    svg += `<text x="${cx + catW/2}" y="${cy + fs(52)}" font-family="Arial" font-size="${fs(12)}" fill="${selected ? cat.color : C.textSec}" text-anchor="middle">${cat.name}</text>`;
  });
  y += Math.ceil(CATS.length / cols) * (catH + gap) + fs(10);

  // Tags
  if (y + fs(80) < sh - fs(30)) {
    svg += `<text x="${p}" y="${y + fs(18)}" font-family="Arial" font-size="${fs(16)}" font-weight="bold" fill="${C.white}">Tags</text>`;
    y += fs(34);
    const tags = [
      { name: "Essentials", color: C.green },
      { name: "Weekend", color: C.blue },
      { name: "Family", color: C.pink },
    ];
    let tx = p;
    tags.forEach((t) => {
      const tw = fs(12) * t.name.length + fs(24);
      svg += `<rect x="${tx}" y="${y}" width="${tw}" height="${fs(30)}" rx="${fs(15)}" fill="${t.color}22" stroke="${t.color}" stroke-width="1"/>`;
      svg += `<text x="${tx + tw/2}" y="${y + fs(20)}" font-family="Arial" font-size="${fs(12)}" fill="${t.color}" text-anchor="middle">${t.name}</text>`;
      tx += tw + fs(8);
    });
    y += fs(50);
  }

  // Save button
  if (y + fs(50) < sh - fs(20)) {
    svg += `<rect x="${p}" y="${y}" width="${sw - p*2}" height="${fs(48)}" rx="${fs(24)}" fill="${C.green}"/>`;
    svg += `<text x="${sw/2}" y="${y + fs(32)}" font-family="Arial" font-size="${fs(18)}" font-weight="bold" fill="${C.white}" text-anchor="middle">Save Expense</text>`;
  }

  return svg;
}

function screenBudget(sw, sh, s) {
  const p = Math.round(20 * s);
  const fs = (n) => Math.round(n * s);
  let y = p;

  let svg = `<rect width="${sw}" height="${sh}" fill="${C.bg}"/>`;
  y += fs(20);

  svg += `<text x="${p}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(26)}" font-weight="bold" fill="${C.white}">Budget</text>`;
  y += fs(55);

  // Overall budget
  const totalPct = 0.62;
  svg += card(p, y, sw - p*2, fs(130), fs(16));
  svg += `<text x="${p + fs(16)}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(13)}" fill="${C.textSec}">Overall Budget</text>`;
  svg += `<text x="${p + fs(16)}" y="${y + fs(62)}" font-family="Arial" font-size="${fs(30)}" font-weight="bold" fill="${C.white}">$1,245 <tspan font-size="${fs(16)}" fill="${C.textSec}">/ $2,000</tspan></text>`;
  svg += progressBar(p + fs(16), y + fs(82), sw - p*2 - fs(32), fs(16), totalPct, C.green);
  svg += `<text x="${sw - p - fs(16)}" y="${y + fs(115)}" font-family="Arial" font-size="${fs(12)}" fill="${C.green}" text-anchor="end">${Math.round(totalPct * 100)}% used</text>`;
  y += fs(155);

  // Category budgets
  svg += `<text x="${p}" y="${y + fs(22)}" font-family="Arial" font-size="${fs(18)}" font-weight="bold" fill="${C.white}">By Category</text>`;
  y += fs(40);

  const budgets = [
    { name: "Food", spent: 245, total: 300, color: C.orange },
    { name: "Transport", spent: 120, total: 150, color: C.blue },
    { name: "Shopping", spent: 190, total: 200, color: C.pink },
    { name: "Entertainment", spent: 85, total: 100, color: C.purpleLight },
    { name: "Bills", spent: 310, total: 400, color: C.indigo },
    { name: "Health", spent: 45, total: 100, color: C.red },
  ];

  budgets.forEach((b) => {
    if (y + fs(85) > sh - fs(20)) return;
    const ch = fs(75);
    svg += card(p, y, sw - p*2, ch, fs(14));
    const pct = b.spent / b.total;
    svg += `<circle cx="${p + fs(24)}" cy="${y + fs(15)}" r="${fs(6)}" fill="${b.color}"/>`;
    svg += `<text x="${p + fs(38)}" y="${y + fs(20)}" font-family="Arial" font-size="${fs(16)}" fill="${C.white}">${b.name}</text>`;
    svg += `<text x="${sw - p - fs(16)}" y="${y + fs(20)}" font-family="Arial" font-size="${fs(13)}" fill="${pct > 0.9 ? C.red : C.textSec}" text-anchor="end">$${b.spent} / $${b.total}</text>`;
    svg += progressBar(p + fs(16), y + fs(38), sw - p*2 - fs(32), fs(14), pct, b.color);
    svg += `<text x="${sw - p - fs(16)}" y="${y + fs(68)}" font-family="Arial" font-size="${fs(11)}" fill="${pct > 0.9 ? C.red : C.textMuted}" text-anchor="end">${Math.round(pct * 100)}%</text>`;
    y += ch + fs(10);
  });

  return svg;
}

function screenAI(sw, sh, s) {
  const p = Math.round(20 * s);
  const fs = (n) => Math.round(n * s);
  let y = p;

  let svg = `<rect width="${sw}" height="${sh}" fill="${C.bg}"/>`;
  y += fs(20);

  svg += `<text x="${p}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(26)}" font-weight="bold" fill="${C.white}">Smart Analysis</text>`;
  y += fs(55);

  // Purple hero card
  svg += `<rect x="${p}" y="${y}" width="${sw - p*2}" height="${fs(100)}" rx="${fs(16)}" fill="url(#purpleGrad)"/>`;
  svg += `<text x="${p + fs(20)}" y="${y + fs(35)}" font-family="Arial" font-size="${fs(18)}" font-weight="bold" fill="#fff">AI-Powered Insights</text>`;
  svg += `<text x="${p + fs(20)}" y="${y + fs(60)}" font-family="Arial" font-size="${fs(13)}" fill="rgba(255,255,255,0.8)">Personalized tips based on your spending</text>`;
  svg += `<text x="${p + fs(20)}" y="${y + fs(80)}" font-family="Arial" font-size="${fs(13)}" fill="rgba(255,255,255,0.8)">patterns and financial habits</text>`;
  y += fs(120);

  const insights = [
    { type: "warning", color: C.yellow, title: "High Food Spending", desc: "Your food expenses are 40% above your monthly average. Consider meal planning to reduce costs." },
    { type: "tip", color: C.green, title: "Subscription Overlap", desc: "Netflix and YouTube Premium both offer video streaming. You could save $13.99/mo by keeping one." },
    { type: "achievement", color: C.purple, title: "Saving Streak!", desc: "You have spent less than your budget for 3 consecutive months. Great financial discipline!" },
    { type: "info", color: C.blue, title: "Weekend Pattern", desc: "62% of your shopping expenses happen on weekends. Setting a weekend budget could help." },
  ];

  insights.forEach((ins) => {
    if (y + fs(110) > sh - fs(20)) return;
    const ch = fs(100);
    svg += `<rect x="${p}" y="${y}" width="${sw - p*2}" height="${ch}" rx="${fs(14)}" fill="${C.bgCard}" stroke="${ins.color}44" stroke-width="1"/>`;
    svg += `<rect x="${p}" y="${y}" width="${fs(4)}" height="${ch}" rx="${fs(2)}" fill="${ins.color}"/>`;
    svg += `<text x="${p + fs(20)}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(16)}" font-weight="bold" fill="${C.white}">${ins.title}</text>`;
    // Word wrap desc
    const words = ins.desc.split(" ");
    let line = "", lineY = y + fs(50);
    const maxW = sw - p * 2 - fs(40);
    const charW = fs(7);
    words.forEach((w) => {
      if ((line.length + w.length + 1) * charW > maxW) {
        svg += `<text x="${p + fs(20)}" y="${lineY}" font-family="Arial" font-size="${fs(12)}" fill="${C.textSec}">${esc(line.trim())}</text>`;
        lineY += fs(16);
        line = w + " ";
      } else {
        line += w + " ";
      }
    });
    if (line.trim()) {
      svg += `<text x="${p + fs(20)}" y="${lineY}" font-family="Arial" font-size="${fs(12)}" fill="${C.textSec}">${esc(line.trim())}</text>`;
    }
    y += ch + fs(12);
  });

  return svg;
}

function screenSettings(sw, sh, s) {
  const p = Math.round(20 * s);
  const fs = (n) => Math.round(n * s);
  let y = p;

  let svg = `<rect width="${sw}" height="${sh}" fill="${C.bg}"/>`;
  y += fs(20);

  svg += `<text x="${p}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(26)}" font-weight="bold" fill="${C.white}">Settings</text>`;
  y += fs(55);

  const groups = [
    {
      title: "General",
      items: [
        { label: "Currency", value: "USD ($)", toggle: false },
        { label: "Language", value: "English", toggle: false },
        { label: "Dark Mode", value: "", toggle: true, on: true },
      ],
    },
    {
      title: "Security",
      items: [
        { label: "Biometric Lock", value: "", toggle: true, on: true },
        { label: "App Lock Timeout", value: "Immediately", toggle: false },
      ],
    },
    {
      title: "Reminders",
      items: [
        { label: "Subscription Alerts", value: "", toggle: true, on: true },
        { label: "Budget Warnings", value: "", toggle: true, on: false },
        { label: "Weekly Summary", value: "", toggle: true, on: true },
      ],
    },
    {
      title: "Data",
      items: [
        { label: "Export CSV", value: "&gt;", toggle: false },
        { label: "Clear All Data", value: "&gt;", toggle: false },
      ],
    },
  ];

  groups.forEach((g) => {
    if (y + fs(30) > sh - fs(30)) return;
    svg += `<text x="${p}" y="${y + fs(18)}" font-family="Arial" font-size="${fs(14)}" font-weight="bold" fill="${C.green}">${g.title}</text>`;
    y += fs(30);

    g.items.forEach((item) => {
      if (y + fs(48) > sh - fs(20)) return;
      svg += card(p, y, sw - p*2, fs(44), fs(12));
      svg += `<text x="${p + fs(16)}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(15)}" fill="${C.white}">${item.label}</text>`;
      if (item.toggle) {
        const tw = fs(44), th = fs(24);
        const tx = sw - p - fs(16) - tw;
        const ty = y + (fs(44) - th) / 2;
        svg += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${th/2}" fill="${item.on ? C.green : '#374151'}"/>`;
        svg += `<circle cx="${item.on ? tx + tw - th/2 : tx + th/2}" cy="${ty + th/2}" r="${th/2 - fs(3)}" fill="${C.white}"/>`;
      } else {
        svg += `<text x="${sw - p - fs(16)}" y="${y + fs(28)}" font-family="Arial" font-size="${fs(13)}" fill="${C.textMuted}" text-anchor="end">${item.value}</text>`;
      }
      y += fs(52);
    });
    y += fs(8);
  });

  return svg;
}

// ─── SCREENSHOT ASSEMBLY ───

const SCREENS = [
  { id: "1-dashboard",     title: "All Your Finances",        subtitle: "at a glance",                render: screenHome,          nav: "home" },
  { id: "2-subscriptions", title: "Track Subscriptions",      subtitle: "never miss a renewal",       render: screenSubscriptions, nav: "subs" },
  { id: "3-add-expense",   title: "Quick Expense Entry",      subtitle: "categorize in seconds",      render: screenAddExpense,    nav: "add" },
  { id: "4-budget",        title: "Smart Budget Planning",    subtitle: "stay on track",              render: screenBudget,        nav: "home" },
  { id: "5-ai-analysis",   title: "AI-Powered Insights",      subtitle: "personalized tips",          render: screenAI,            nav: "ai" },
  { id: "6-settings",      title: "Fully Customizable",       subtitle: "your app, your way",         render: screenSettings,      nav: "settings" },
];

function buildScreenshot(device, screen) {
  const { w, h } = device;
  const isLandscape = w > h;
  // Scale factor relative to phone
  const s = isLandscape ? h / 1920 * 1.1 : w / 1080;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    ${bgGrad(w, h)}`;

  if (isLandscape) {
    // Landscape tablet: phone frame on right, text on left
    const frameW = Math.round(h * 0.5);
    const frameH = Math.round(h * 0.85);
    const frameX = w - frameW - Math.round(60 * s);
    const frameY = (h - frameH) / 2;

    // Text on left
    svg += `<text x="${Math.round(80*s)}" y="${h * 0.35}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(48*s)}" font-weight="bold" fill="${C.white}">${esc(screen.title)}</text>`;
    svg += `<text x="${Math.round(80*s)}" y="${h * 0.35 + Math.round(45*s)}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(26*s)}" fill="${C.green}">${esc(screen.subtitle)}</text>`;

    // App icon small
    const iconS = Math.round(50 * s);
    const iconRx = Math.round(12 * s);
    svg += `<rect x="${Math.round(80*s)}" y="${h * 0.35 + Math.round(70*s)}" width="${iconS}" height="${iconS}" rx="${iconRx}" fill="${C.green}"/>`;
    svg += `<text x="${Math.round(80*s) + iconS + Math.round(12*s)}" y="${h * 0.35 + Math.round(70*s) + iconS * 0.65}" font-family="Arial" font-size="${Math.round(20*s)}" fill="${C.textSec}">SubTrack</text>`;

    // Phone frame
    const rx = Math.round(20 * s);
    const border = Math.round(3 * s);
    const inner = Math.round(4 * s);
    svg += `<rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${rx}" fill="#000" stroke="#444" stroke-width="${border}"/>`;
    svg += `<clipPath id="sc"><rect x="${frameX + inner}" y="${frameY + inner}" width="${frameW - inner*2}" height="${frameH - inner*2}" rx="${rx-2}"/></clipPath>`;
    svg += `<g clip-path="url(#sc)"><g transform="translate(${frameX + inner}, ${frameY + inner})">`;
    svg += screen.render(frameW - inner * 2, frameH - inner * 2, s * 0.85);
    svg += `</g></g>`;
  } else {
    // Portrait: header text + phone frame below
    svg += promoHeader(w, s, screen.title, screen.subtitle);
    svg += phoneFrame(w, h, s, screen.render);
  }

  svg += `</svg>`;
  return svg;
}

async function main() {
  console.log("\nSubTrack Screenshot Generator\n");

  for (const [key, device] of Object.entries(DEVICES)) {
    const dir = path.join(OUT, device.dir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    console.log(`Generating ${device.label} screenshots (${device.w}x${device.h})...`);

    for (const screen of SCREENS) {
      const svg = buildScreenshot(device, screen);
      const outFile = path.join(dir, `${screen.id}.png`);
      await sharp(Buffer.from(svg))
        .resize(device.w, device.h)
        .png({ quality: 95 })
        .toFile(outFile);
      console.log(`  ✓ ${screen.id}.png`);
    }
  }

  console.log(`\nAll screenshots saved to: ${OUT}/`);
  console.log("  phone/      – 1080x1920");
  console.log("  tablet-7/   – 1200x1920");
  console.log("  tablet-10/  – 1920x1200");
  console.log("\nDone!");
}

main().catch((err) => { console.error("Error:", err); process.exit(1); });
