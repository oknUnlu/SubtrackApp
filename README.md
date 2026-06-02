# SubTrack Design System

**SubTrack** is a cross-platform personal finance tracking mobile app built with React Native (Expo). It helps users track daily expenses, manage subscriptions, set budgets, and receive AI-powered spending insights — all stored locally on device.

---

## Product Overview

**Single product:** SubTrack mobile app (iOS & Android, Expo)

- **Bundle ID:** `com.okanu.subtrack`
- **Codebase:** `SubtrackApp/` (React Native / Expo Router)
- **GitHub repo:** https://github.com/oknUnlu/SubtrackApp

### Core Screens (5 tabs)
| Tab | Key Feature |
|-----|-------------|
| **Home** | Dashboard: monthly total, donut chart, weekly bar chart, recent transactions, quick actions |
| **Subscriptions** | Manage recurring subscriptions, auto-detect recurring expenses |
| **Add** (FAB) | Add expenses with category, payment method, tags, receipt photo, installment tracking |
| **Smart Tips** | Local AI analysis: spending insights, anomaly detection, budget suggestions |
| **Settings** | Currency, color theme, dark mode, biometric lock, language (8 languages), CSV export |

### Additional Screens
- Budget (set monthly + per-category limits)
- History (searchable, filterable transaction log)
- Monthly Report, Yearly Summary, Bank/Credit Card Report, Category Trend
- Installments (installment payment tracker)
- Spending Goals
- Onboarding

---

## Sources
- **Codebase:** Mounted at `SubtrackApp/` (read via File System Access API)
- **GitHub:** https://github.com/oknUnlu/SubtrackApp (branch: main)
- **Screenshots:** `assets/screenshots/` (6 phone screenshots)
- No Figma source was provided

---

## CONTENT FUNDAMENTALS

### Tone & Voice
- **Friendly, direct, encouraging** — never condescending or alarming
- **First-person framing for data** ("Your spending", "You spent"), second-person for actions ("Add Expense", "Save")
- **Sentence case** for UI labels and section titles (e.g. "Total Spending This Month", not "TOTAL SPENDING")
- **Title case** only for screen names (e.g. "Smart Tips", "Control Center")
- **No filler copy** — labels are terse and scannable. Subtitles are 3–5 words ("Smart spending suggestions", "at a glance")
- **Emoji used purposefully:** category icons (🍔🚗🎮) and celebratory moments ("Rate Now ⭐", "Saving Streak! 🎉")
- **Positive reinforcement:** achievements framed as wins ("Great Savings!", "You spent X% less than last month")
- **Warnings are factual, not scary:** "Budget Alert — You've used 85% of your monthly budget"
- **Numbers always formatted** with currency symbol and 2 decimal places: `₺1,245.00`
- **Multi-language:** Turkish (primary market), English, Spanish, Portuguese, Hindi, Indonesian, Japanese, Korean

### Example Copy Patterns
- Section header: `"Total Spending This Month"` · subtext: `"Including subscriptions"`
- Empty state: `"No subscriptions yet"` + tip `"Add your subscriptions to track your expenses"`
- Success toast: `"Expense saved"` (brief, no exclamation)
- Warning: `"⚠️ Monthly budget exceeded! (103%)"` 
- Settings screen title: `"Control Center"` (brand-flavored, not generic)

---

## VISUAL FOUNDATIONS

### Colors
- **Primary (default green):** `#22c55e` — used for buttons, active tabs, progress fills, CTAs
- **Primary Dark:** `#16a34a` — gradient end, hover/pressed state
- **Background (dark):** `#111827` · **Background (light):** `#f6f7f9`
- **Surface (dark):** `#1f2937` · **Surface (light):** `#ffffff`
- **Surface Secondary:** `#374151` / `#f3f4f6`
- **Text:** `#f9fafb` / `#222222`
- **Text Secondary:** `#9ca3af` / `#6b7280`
- **Danger:** `#ef4444` / `#f87171`
- **Purple (AI/installments):** `#7c3aed` / `#a78bfa`
- **Warning:** `#f59e0b` / `#fbbf24`
- **6 color themes:** Default (green), Ocean (blue), Sunset (orange), Rose (pink), Lavender (purple), Teal

### Typography
- **Font stack:** System fonts only — `-apple-system, BlinkMacSystemFont, 'SF Pro', system-ui, sans-serif`
- No custom web fonts are loaded. iOS uses SF Pro (rounded variant for certain UI), Android uses Roboto
- **Scale:**
  - App name / screen header: 22–24px, weight 700
  - Large amount display: 36px, weight 800
  - Card title: 18px, weight 700
  - Body / list item title: 15–16px, weight 500–600
  - Secondary / label: 12–14px, weight 400–500
  - Micro / badge: 10–12px, weight 500–600

### Spacing & Layout
- Screen padding: 16px horizontal
- Card internal padding: 14–20px
- Gap between cards: 10–16px
- Bottom tab bar height: ~60px + safe area inset

### Cards
- **Border radius:** 14–20px (cards: 16–20px, chips/tags: 8–12px, modal: 16–24px)
- **Background:** `surface` color (white in light, `#1f2937` in dark)
- **No border** in default state; `1px border` only on inputs and modal overlays
- **No card shadow** — elevation comes from color contrast alone
- **Inner surface for nested items:** `surfaceTertiary` (`#f9fafb` / `#1f2937`)

### Gradients
- **Hero card (monthly total):** Linear horizontal `primary → primaryDark` (e.g. `#22c55e → #16a34a`)
- **AI hero card:** Fixed purple gradient `#7c3aed → #9333ea`
- **Splash screen background:** `#22c55e`

### Iconography
- **Ionicons** (outline style by default, filled when active/selected)
- Tab bar: outline → filled on focus
- Category icons: **emoji** (🍔 🚗 🎮 🛍️ 📄 💊 📚 💻 etc.) — not icon font
- Payment method icons: `cash-outline`, `wallet-outline`, `card-outline`
- Action icons: `add` (FAB), `trash-outline`, `pencil-outline`, `chevron-forward`

### Animations & Interactions
- **Modal entry:** `animationType="slide"` (bottom sheet slide up)
- **Review modal:** `animationType="fade"`
- **Tab press:** native tab bar animation
- No custom easing curves or spring animations defined
- **Hover/active states:** none explicit (native React Native press feedback)
- **Toast notification:** appears at bottom of form, disappears after 3–4.5s

### Insight Cards (AI / Analysis)
- Left border accent: 4px solid, color by type
  - `warning` → amber `#f59e0b`
  - `tip` → primary green
  - `info` → blue `#3b82f6`
  - `achievement` → purple `#8b5cf6`
- Background: tinted version of border color (15% opacity)
- Border radius: 14px

### Recurring / Purple Theme
- `purpleBg` / `purpleBorder` used for "detected recurring" and installment features
- Purple is the secondary accent (AI, installments, review modal star icon)

### Empty States
- Centered, with large emoji (32px) + secondary text
- No illustrations — just emoji + short text

---

## ICONOGRAPHY

SubTrack uses **Ionicons** (from `@expo/vector-icons`) as its icon system.

- **Delivery:** Loaded via Expo's bundled `@expo/vector-icons` package (not a CDN font)
- **Style:** Outline by default; filled (`-outline` suffix removed) for active/selected state
- **Size:** 14–22px in UI; 36px for hero/feature icons
- **Color:** Inherits from `colors.primary`, `colors.icon`, `colors.iconSecondary`, or white on colored backgrounds
- **Category icons:** Emoji strings (not Ionicons) — displayed at 20–32px font size
- **No custom SVG icons** or PNG icon sprites — entirely Ionicons + emoji
- For web/HTML reproduction, use the [Ionicons CDN](https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js)

### Key Icon Mappings
| Feature | Icon name |
|---------|-----------|
| Home tab | `home-outline` / `home` |
| Subscriptions tab | `card-outline` / `card` |
| Add (FAB) | `add` |
| Smart Tips tab | `analytics-outline` / `analytics` |
| Settings tab | `settings-outline` / `settings` |
| Budget | `wallet-outline` |
| Cash payment | `cash-outline` |
| Credit card | `card-outline` |
| Debit card | `wallet-outline` |
| Trash/delete | `trash-outline` |
| Edit | `pencil-outline` |
| AI / sparkles | `sparkles-outline` |
| Receipt | `receipt-outline` |
| Notification | `notifications-outline` |
| Tag | `bookmark-outline` |

---

## File Index

```
README.md                     ← This file
SKILL.md                      ← Agent skill definition
colors_and_type.css           ← CSS custom properties (colors, type, spacing)
assets/
  icon.png                    ← App icon (1024×1024, green rounded square + S mark)
  splash-icon.png             ← Splash screen icon
  play-store-icon.png         ← Play Store icon
  screenshots/                ← 6 phone screenshots (dark mode)
    1-dashboard.png
    2-subscriptions.png
    3-add-expense.png
    4-budget.png
    5-ai-analysis.png
    6-settings.png
preview/
  colors-base.html            ← Base color palette swatches
  colors-semantic.html        ← Semantic color tokens
  colors-themes.html          ← 6 color themes
  type-scale.html             ← Typography scale specimen
  spacing-tokens.html         ← Spacing, radius, elevation tokens
  components-buttons.html     ← Button variants
  components-cards.html       ← Card variants
  components-inputs.html      ← Input fields + selectors
  components-tags-badges.html ← Tags, chips, badges
  components-insight-cards.html ← AI insight card types
  components-tab-bar.html     ← Bottom tab bar
  components-toast.html       ← Toast notification
  brand-logo.html             ← Logo variants
  brand-category-icons.html   ← Category emoji system
ui_kits/
  subtrack-app/
    README.md
    index.html                ← Interactive app prototype (5 screens)
    components/
      TabBar.jsx
      HomeScreen.jsx
      SubscriptionsScreen.jsx
      AddExpenseScreen.jsx
      AIScreen.jsx
      SettingsScreen.jsx
```
