# SubTrack App UI Kit

Interactive hi-fi prototype of the SubTrack mobile app — 5 core screens with click-through navigation.

## Screens
1. **Home** — Dashboard with hero card, stat chips, category donut chart, weekly bar chart, recent transactions
2. **Subscriptions** — List with monthly/yearly totals, add modal
3. **Add Expense** — Full form with category grid, payment method, tags
4. **Smart Tips** — AI insights with hero card, insight cards by type
5. **Settings** — Control Center with options rows, color theme picker

## Usage
Open `index.html` in a browser. Navigate between screens using the bottom tab bar.
The center `+` button opens the Add Expense screen.

## Components
- `TabBar.jsx` — bottom navigation
- `HomeScreen.jsx` — dashboard
- `SubscriptionsScreen.jsx` — subscriptions manager
- `AddExpenseScreen.jsx` — expense entry form
- `AIScreen.jsx` — smart analysis
- `SettingsScreen.jsx` — settings

## Design width
390px (iPhone 15 Pro) — displayed in a centered phone frame.

## Notes
- All data is mocked (no real database)
- Uses Ionicons from CDN for icon fidelity
- System font stack (SF Pro on iOS, system-ui elsewhere)
- Dark mode default (matches app default)
