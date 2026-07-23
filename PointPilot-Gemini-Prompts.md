# PointPilot — Gemini Prompt Pack (Hackathon)

> **How to use:** Paste prompts into Gemini in order. Wait for complete code before moving to the next prompt.  
> **Stack:** Vite + React + TypeScript + Tailwind CSS + React Router  
> **Constraints:** No backend · No SQL · No API calls · localStorage only · Hardcoded data

---

## Quick Reference

| Item | Value |
|------|-------|
| App name | PointPilot |
| Demo email | `demo@pointpilot.com` |
| Demo password | `demo123` |
| Part 1 | Auth + Dashboard (required) |
| Part 2 | Bottom nav + Book a Flight page (optional extension) |

---

# PART 1 — Core App (Required)

Build this first. Do not start Part 2 until Part 1 passes QA.

---

## PROMPT 0 — Master Context

> Paste this first. Re-paste before any follow-up if Gemini loses context.

```
PROJECT: PointPilot (90-minute hackathon demo)

YOU ARE BUILDING:
A self-contained frontend web app for tracking travel reward points.

YOU ARE NOT BUILDING:
- No backend server
- No SQL / database
- No API calls (no fetch, no axios to external URLs except avatar images)
- No OAuth / Google login
- No password encryption
- No flight optimization algorithm

TECH STACK (do not change):
- Vite + React + TypeScript
- Tailwind CSS
- React Router DOM
- localStorage for all persistence

APP PAGES:
- "/"         → Landing page
- "/login"    → Login
- "/register" → Register
- "/dashboard" → Protected dashboard (requires login)

DASHBOARD MUST SHOW:
1. Profile picture (circle avatar)
2. Username
3. Email
4. Amex points balance card
5. Aeroplan points balance card
6. Form to edit and save both balances

DATA STRATEGY:
- Default users hardcoded in src/data/defaultUsers.ts
- New registrations saved to localStorage key "pp_users_extra"
- Active session saved to localStorage key "pp_session"
- Point balance edits persist in localStorage

DESIGN SYSTEM:
- Theme: dark premium fintech / travel
- Background gradient: #0B1220 → #111827
- Cards: glassmorphism — bg-white/5, border border-white/10, backdrop-blur
- Amex accent: #006FCF
- Aeroplan accent: #F01428
- Font: Inter (import from Google Fonts)
- Rounded corners: rounded-xl / rounded-2xl
- Responsive: mobile-first, works on phone and desktop

OUTPUT RULES (every response):
1. Shell commands to create/run the project
2. Complete file tree
3. Full code for every file — NO placeholders, NO "...", NO "add rest yourself"
4. Demo credentials
5. Manual test checklist
```

---

## PROMPT 1 — Project Scaffold

```
Create the PointPilot app scaffold.

ROUTES:
- "/"           → LandingPage
- "/login"      → LoginPage
- "/register"   → RegisterPage
- "/dashboard"  → DashboardPage (protected — redirect to /login if no session)

FILE STRUCTURE (create all of these):
src/
  main.tsx
  App.tsx
  index.css
  types/
    user.ts
  data/
    defaultUsers.ts        (empty export for now)
  lib/
    auth.ts                (empty stubs for now)
    storage.ts
  components/
    Navbar.tsx
    Button.tsx
    Input.tsx
    Card.tsx
    StatCard.tsx
    ProtectedRoute.tsx
  pages/
    LandingPage.tsx
    LoginPage.tsx
    RegisterPage.tsx
    DashboardPage.tsx

TYPE (put in src/types/user.ts):
export type User = {
  id: string;
  email: string;
  password: string;
  username: string;
  avatarUrl: string;
  amexPoints: number;
  aeroplanPoints: number;
  updatedAt: string; // ISO 8601 string
};

WHAT TO IMPLEMENT NOW:
- Project setup with Vite + React + TypeScript + Tailwind + React Router
- Global dark gradient background and Inter font
- Reusable Button, Input, Card, StatCard components (glass style)
- Navbar with "PointPilot" logo text and nav links
- ProtectedRoute wrapper that checks session and redirects to /login
- Placeholder content on each page (page title only)
- Routing wired up in App.tsx

WHAT NOT TO IMPLEMENT YET:
- Auth logic
- Hardcoded users
- Dashboard data

Return: setup commands, file tree, and full code for every file.
```

---

## PROMPT 2 — Auth + Hardcoded Users

```
Implement client-side authentication for PointPilot.

FILE: src/data/defaultUsers.ts
Export this exact array:

import { User } from "../types/user";

export const defaultUsers: User[] = [
  {
    id: "u1",
    email: "demo@pointpilot.com",
    password: "demo123",
    username: "Demo User",
    avatarUrl: "https://i.pravatar.cc/150?u=demo",
    amexPoints: 128450,
    aeroplanPoints: 95200,
    updatedAt: "2026-07-23T12:00:00.000Z"
  },
  {
    id: "u2",
    email: "jane@pointpilot.com",
    password: "password",
    username: "Jane Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=jane",
    amexPoints: 85000,
    aeroplanPoints: 120300,
    updatedAt: "2026-07-23T12:00:00.000Z"
  }
];

LOCALSTORAGE KEYS (use exactly these strings):
- "pp_users_extra"  → User[] (users registered at runtime)
- "pp_session"      → User   (currently logged-in user)

FILE: src/lib/storage.ts
Helper functions: getItem<T>(key), setItem<T>(key, value), removeItem(key)
Handle JSON parse errors gracefully (return null).

FILE: src/lib/auth.ts
Implement these functions:

getAllUsers(): User[]
  → returns defaultUsers + pp_users_extra merged

registerUser(input: { email, password, username }): { ok: true, user: User } | { ok: false, error: string }
  → validate, check duplicate email (case-insensitive), create user:
    id: "u" + Date.now()
    avatarUrl: "https://i.pravatar.cc/150?u=" + email
    amexPoints: 0
    aeroplanPoints: 0
    updatedAt: new Date().toISOString()
  → save to pp_users_extra

loginUser(input: { email, password }): User | null
  → find match in getAllUsers(), return user or null

saveSession(user: User): void
getSession(): User | null
logout(): void

updateUserPoints(userId: string, amexPoints: number, aeroplanPoints: number): User | null
  → update in defaultUsers copy OR pp_users_extra
  → update pp_session if same user
  → set updatedAt to now
  → return updated user

VALIDATION RULES:
- email: required, must contain "@"
- password: min 6 characters
- username: min 2 characters
- confirm password must match password (register only)
- email must be unique across all users

LOGIN PAGE (/login):
- Fields: email, password
- Button: "Login"
- Button: "Use Demo Account" → auto-fills demo@pointpilot.com / demo123 and logs in
- Small hint box showing demo credentials
- On success: navigate to /dashboard
- On failure: show red error message below form

REGISTER PAGE (/register):
- Fields: username, email, password, confirm password
- Button: "Create Account"
- On success: auto-login and navigate to /dashboard
- On failure: show red error message

Return full code for all auth files and both auth pages.
```

---

## PROMPT 3 — Dashboard Page

```
Build the Dashboard page for PointPilot at /dashboard.

READ USER FROM SESSION:
Use getSession() from auth.ts. If null, ProtectedRoute already redirects.

LAYOUT (top to bottom):

─── NAVBAR ───
- Left: "PointPilot" text
- Right: "Logout" button → calls logout(), navigates to /login

─── PROFILE CARD ───
- Left: circular avatar, 96×96px
  - If image fails to load, show fallback circle with first letter of username
- Right:
  - Username — text-2xl, font-bold, white
  - Email — text-sm, text-gray-400

─── POINTS CARDS (grid: 2 cols desktop, 1 col mobile) ───

Card 1 — Amex:
- Title: "Amex Membership Rewards"
- Value: formatted points number (e.g. "128,450")
- Subtitle: "Membership Rewards points"
- Left border or icon accent: #006FCF
- Credit card icon (lucide-react: CreditCard)

Card 2 — Aeroplan:
- Title: "Aeroplan Points"
- Value: formatted points number
- Subtitle: "Air Canada Aeroplan miles"
- Left border or icon accent: #F01428
- Plane icon (lucide-react: Plane)

─── EDIT BALANCES FORM ───
- Label + number input: "Amex Points"
- Label + number input: "Aeroplan Points"
- Button: "Save Balances"
- Validation: integers only, >= 0, no decimals
- On save:
  1. Call updateUserPoints()
  2. Refresh displayed values
  3. Show green success message: "Balances saved!" (auto-hide after 2 seconds)

─── COMING SOON BANNER ───
- Text: "Flight optimizer coming soon"
- Disabled button: "Find Best Redemption" (grayed out, not clickable)

HELPER FUNCTION:
formatPoints(n: number): string
  → n.toLocaleString("en-US")  e.g. 128450 → "128,450"

STYLING:
- All sections in glass Card components
- Generous padding and spacing
- Must look polished on mobile

Return full DashboardPage.tsx and any updated helper files.
```

---

## PROMPT 4 — Landing Page

```
Create the Landing page for PointPilot at "/".

HERO SECTION (centered):
- H1: "Turn your points into better flights"
- Subtitle: "Track your Amex and Aeroplan balances in one premium dashboard."
- Button (primary, blue): "Get Started" → navigates to /register
- Button (secondary, outline): "Login" → navigates to /login

FEATURES SECTION (3 cards in a row, stack on mobile):

Card 1:
- Icon: Shield or Lock
- Title: "Simple Access"
- Text: "Register and login to your personal points wallet."

Card 2:
- Icon: BarChart or Wallet
- Title: "Balance Tracking"
- Text: "View and update your Amex and Aeroplan points instantly."

Card 3:
- Icon: Sparkles or Zap
- Title: "Smart Optimization"
- Text: "Find the lowest-points flight redemptions — coming soon."

FOOTER:
- Centered text: "PointPilot — Hackathon Demo 2026"

VISUAL:
- Same dark gradient background as rest of app
- Subtle animated glow or gradient orb behind hero text (CSS only, no libraries)
- Glass cards for features section
- If user is already logged in, navbar shows "Go to Dashboard" instead of Login/Register

Return full LandingPage.tsx and any style updates.
```

---

## PROMPT 5 — Part 1 QA

```
Run a strict QA pass on PointPilot Part 1 (core app). Fix every failure.

TEST CHECKLIST — all must pass:

[ ] 1. npm run dev starts with no errors
[ ] 2. Landing page loads at /
[ ] 3. "Get Started" goes to /register
[ ] 4. "Login" goes to /login
[ ] 5. "Use Demo Account" logs in as demo@pointpilot.com
[ ] 6. Manual login with demo@pointpilot.com / demo123 works
[ ] 7. Wrong password shows error message
[ ] 8. /dashboard shows avatar, username, email
[ ] 9. /dashboard shows Amex card with 128,450
[ ] 10. /dashboard shows Aeroplan card with 95,200
[ ] 11. Editing and saving balances updates the displayed values
[ ] 12. Refreshing page preserves saved balances
[ ] 13. Register new user → auto-login → dashboard shows 0 points
[ ] 14. Logout → /dashboard redirects to /login
[ ] 15. No console errors in browser
[ ] 16. Layout looks correct on mobile (375px width)

For each failed test:
- State what failed
- Explain the fix
- Return full updated code for every changed file

Also return a final demo script (5 bullet points) for presenting Part 1.
```

---

## PROMPT 1-EMERGENCY — Full Part 1 in One Shot

> Use this only if you are running out of time and haven't started yet.

```
Build the COMPLETE PointPilot Part 1 app in a single response.

Constraints:
- Vite + React + TypeScript + Tailwind + React Router
- No backend, no SQL, no APIs
- Hardcoded users:
    demo@pointpilot.com / demo123 (128,450 Amex, 95,200 Aeroplan)
    jane@pointpilot.com / password (85,000 Amex, 120,300 Aeroplan)
- localStorage for register, session, and point updates
- Pages: /, /login, /register, /dashboard
- Dashboard: avatar, username, email, 2 point cards, edit form, save, logout
- Landing page with hero and 3 feature cards
- "Use Demo Account" button on login page
- Premium dark glass UI (navy gradient, Amex blue #006FCF, Aeroplan red #F01428)
- Mobile responsive

Return:
1. Setup commands
2. Full file tree
3. Full code for every file (no placeholders)
4. 16-step test checklist
5. 5-bullet demo script
```

---

# PART 2 — Book a Flight Extension (Optional)

> Only start Part 2 after Part 1 QA passes.  
> This adds a bottom nav bar and a Google Flights-style search page with hardcoded results priced in points.  
> The optimization algorithm is NOT implemented — all flight data is fake/hardcoded.

---

## PROMPT 6 — Bottom Navigation Bar

```
Extend PointPilot with a persistent bottom navigation bar.

CONTEXT:
- Part 1 is complete and working (auth, dashboard)
- Still no backend, no SQL, no API

ADD ROUTE:
- "/book" → BookFlightPage (placeholder for now)

CREATE: src/components/BottomNav.tsx

BOTTOM NAV SPEC:
- Position: fixed, bottom: 0, full width, z-index: 50
- Height: 64px
- Style: bg-black/60, border-t border-white/10, backdrop-blur-md
- Only visible when user is logged in AND on /dashboard or /book
- Hidden on /, /login, /register

TWO TABS:

Tab 1 (left half):
- Icon: Home (lucide-react)
- Label: "Dashboard"
- Route: /dashboard

Tab 2 (right half):
- Icon: Plane (lucide-react)
- Label: "Book a Flight"
- Route: /book

ACTIVE STATE:
- Active tab: text color #006FCF, font-semibold
- Inactive tab: text-gray-500
- Use useLocation() to detect active route

LAYOUT FIX:
- Add pb-20 (padding-bottom) to dashboard and book page content so nav does not overlap

UPDATE App.tsx:
- Add /book route (protected)
- Wrap /dashboard and /book pages with a layout that includes BottomNav

BookFlightPage placeholder content:
- Title: "Book a Flight"
- Text: "Search coming soon"

Return all new and changed files with full code.
```

---

## PROMPT 7 — Hardcoded Flight Data

```
Create hardcoded flight data for the PointPilot Book a Flight feature.

FILE: src/data/mockFlights.ts

TYPE (define and export):
export type FlightOffer = {
  id: string;
  origin: "YYZ" | "YTZ" | "YHM";
  destination: "JFK" | "LGA" | "EWR";
  date: string;           // "YYYY-MM-DD"
  departTime: string;     // "HH:MM" 24-hour
  arriveTime: string;     // "HH:MM" 24-hour
  duration: string;       // e.g. "1h 35m"
  stops: 0 | 1;
  operatingAirline: string;
  marketedBy: string;
  alliance: "Star Alliance" | "Oneworld" | "SkyTeam";
  cabin: "Economy" | "Premium Economy" | "Business";
  program: "Aeroplan" | "Amex Transfer";
  basePoints: number;     // points for 1 passenger
  bookingPath: string;    // human-readable redemption explanation
  seatsLeft: number;
};

HARDCODE EXACTLY THESE 12 FLIGHTS:

| id | origin | dest | cabin     | operatingAirline   | marketedBy  | program      | basePoints | bookingPath                                              |
|----|--------|------|-----------|--------------------|-------------|--------------|------------|----------------------------------------------------------|
| f01| YYZ    | JFK  | Economy   | Etihad Airways     | Air Canada  | Aeroplan     | 12500      | Book Etihad via Aeroplan (Star Alliance)                 |
| f02| YYZ    | JFK  | Economy   | United Airlines    | Air Canada  | Aeroplan     | 15000      | Book United via Aeroplan (Star Alliance)                 |
| f03| YYZ    | JFK  | Economy   | Air Canada         | Air Canada  | Aeroplan     | 16000      | Book direct on Aeroplan                                  |
| f04| YYZ    | LGA  | Economy   | Air Canada         | Air Canada  | Aeroplan     | 14000      | Book Air Canada direct on Aeroplan                       |
| f05| YYZ    | EWR  | Economy   | LOT Polish Airlines| Air Canada  | Aeroplan     | 13500      | Book LOT via Aeroplan (Star Alliance)                    |
| f06| YTZ    | JFK  | Economy   | Porter Airlines    | Porter      | Amex Transfer| 16800      | Transfer Amex to Aeroplan, book Porter connection        |
| f07| YTZ    | EWR  | Economy   | Porter Airlines    | Porter      | Amex Transfer| 17200      | Transfer Amex to Aeroplan, book Porter via EWR             |
| f08| YHM    | JFK  | Economy   | WestJet            | Air Canada  | Aeroplan     | 18200      | Book WestJet via Aeroplan (1 stop)                       |
| f09| YYZ    | JFK  | Business  | Etihad Airways     | Air Canada  | Aeroplan     | 55000      | Book Etihad Business via Aeroplan (Star Alliance)      |
| f10| YYZ    | JFK  | Business  | Air Canada         | Air Canada  | Aeroplan     | 62000      | Book Air Canada Business direct on Aeroplan              |
| f11| YYZ    | LGA  | Premium Econ | Air Canada      | Air Canada  | Aeroplan     | 28000      | Book Air Canada Premium Economy on Aeroplan              |
| f12| YHM    | EWR  | Economy   | Flair Airlines     | Air Canada  | Aeroplan     | 19500      | Book via Aeroplan partner (1 stop, budget carrier)       |

Fill in realistic departTime, arriveTime, duration, stops, seatsLeft (3–12), and date "2026-07-25" for all.

HELPER FUNCTION (export):
searchFlights(params: {
  origin: string;
  destination: string;
  cabin: string;
  date: string;
  passengers: number;
}): (FlightOffer & { totalPoints: number })[]

LOGIC:
- Filter by origin, destination, cabin (case-insensitive match)
- Ignore date filtering for hackathon (all flights match any date)
- totalPoints = basePoints * passengers
- Sort results by totalPoints ascending (cheapest first)

Return full mockFlights.ts with type, data, and helper.
```

---

## PROMPT 8 — Book a Flight Search Page

```
Build the BookFlightPage at /book for PointPilot.

TOP: Compact wallet strip (read from session):
- Small avatar (32px) + username
- "Amex: {formatted amexPoints}" · "Aeroplan: {formatted aeroplanPoints}"

PAGE TITLE:
- H1: "Search flights with points"
- Subtitle: "We surface the lowest-points redemption path across partner airlines."

─── SEARCH FORM (glass card) ───

Fields:
1. Trip type toggle: "One way" | "Round trip"
   - Round trip is UI-only; show small note "Round trip pricing coming soon" when selected
2. Origin — dropdown:
   - YYZ — Toronto Pearson
   - YTZ — Toronto Billy Bishop
   - YHM — Hamilton
3. Destination — dropdown:
   - JFK — New York JFK
   - LGA — New York LaGuardia
   - EWR — Newark
4. Departure date — date input (default: 2026-07-25)
5. Passengers — dropdown: 1, 2, 3
6. Cabin class — dropdown: Economy, Premium Economy, Business
7. Button: "Search Flights" (primary, full width on mobile)

Validation:
- Origin ≠ destination → show error
- All fields required

─── RESULTS SECTION (hidden until search) ───

On "Search Flights" click:
1. Show loading skeleton for 600ms
2. Call searchFlights() from mockFlights.ts
3. Display results

Results header bar:
- "{count} flights found"
- "Sorted by lowest points"
- "Prices shown in points, not cash"

If no results: empty state with plane icon + "No flights found for this route." + "Try different airports" text

IMPORTANT: Never show dollar signs ($). Points only.

Return full BookFlightPage.tsx and any sub-components created.
```

---

## PROMPT 9 — Flight Result Cards

```
Build the flight results list for BookFlightPage.

CREATE: src/components/FlightResultCard.tsx

Each result card shows:

LEFT COLUMN:
- departTime (large, bold) e.g. "08:35"
- origin → destination e.g. "YYZ → JFK"
- arriveTime e.g. "10:10"
- duration + stops e.g. "1h 35m · Nonstop" or "3h 10m · 1 stop"

MIDDLE COLUMN:
- operatingAirline (bold) e.g. "Etihad Airways"
- marketedBy (small, muted) e.g. "Marketed by Air Canada"
- alliance badge e.g. "Star Alliance"
- cabin badge e.g. "Economy"

RIGHT COLUMN (highlighted):
- totalPoints formatted with commas e.g. "12,500"
- "pts" label below
- program name e.g. "Aeroplan"

BOTTOM ROW (full width, below the columns):
- bookingPath text e.g. "Lowest redemption: Book Etihad via Aeroplan (Star Alliance)"
- Style: text-xs, text-gray-400, italic

BADGES:
- Cheapest result (first in sorted list): green "Best value" badge top-right of card
- seatsLeft: "{n} seats left" in orange if n <= 5

BUTTON:
- "Select" button on each card
- On click: show toast "Flight selected for demo"

EXPAND (optional chevron):
- Click card to expand and show:
  - Passengers × base points = total calculation
  - e.g. "1 passenger × 12,500 pts = 12,500 pts"

STYLING:
- Glass card, hover:border-white/20 transition
- Best value card: subtle green border glow
- Mobile: stack columns vertically

INTEGRATE into BookFlightPage.tsx results section.

Return FlightResultCard.tsx and updated BookFlightPage.tsx.
```

---

## PROMPT 10 — Connect Dashboard to Book Flow

```
Connect the Dashboard and Book a Flight pages for a cohesive demo.

DASHBOARD CHANGES:

1. Replace the "coming soon" disabled button with an ENABLED button:
   - Text: "Book a Flight"
   - Style: primary button, Aeroplan red accent (#F01428)
   - onClick: navigate to /book

2. Add a mini insight line below the points cards:
   - Compute: Math.floor(user.aeroplanPoints / 12500)
   - Display: "Your Aeroplan balance covers approximately {n} Economy flight(s) from Toronto to New York"
   - Use 12500 as the cheapest hardcoded Economy fare (f01 from mockFlights)

BOOK PAGE:
- Already has wallet strip from Prompt 8 — verify it reads live session data

BOTTOM NAV:
- Verify Dashboard ↔ Book navigation works in both directions
- Verify bottom nav does not show on login/register/landing

Return only changed files with full code.
```

---

## PROMPT 11 — Part 2 QA

```
Run a strict QA pass on PointPilot Part 2 (Book a Flight). Fix every failure.

TEST CHECKLIST — all must pass:

[ ] 1. Bottom nav visible on /dashboard and /book when logged in
[ ] 2. Bottom nav hidden on /, /login, /register
[ ] 3. Dashboard tab navigates to /dashboard
[ ] 4. Book a Flight tab navigates to /book
[ ] 5. Active tab is highlighted correctly
[ ] 6. "Book a Flight" button on dashboard navigates to /book
[ ] 7. /book shows wallet strip with correct user points
[ ] 8. Search form has Toronto airports (YYZ, YTZ, YHM) and NYC airports (JFK, LGA, EWR)
[ ] 9. Default search: YYZ → JFK, Economy, 1 passenger returns results
[ ] 10. Results sorted by lowest points first
[ ] 11. Cheapest result (12,500 pts) has "Best value" badge
[ ] 12. All prices shown in points — no dollar signs anywhere
[ ] 13. bookingPath text visible on each card
[ ] 14. Changing passengers to 2 doubles the points total
[ ] 15. Invalid route (same origin/destination) shows validation error
[ ] 16. No-match cabin class shows empty state
[ ] 17. "Select" button shows toast message
[ ] 18. Content not hidden behind bottom nav on mobile
[ ] 19. No console errors

For each failed test: state failure, explain fix, return full updated code.

Also return a final 60-second demo script covering Part 1 + Part 2.
```

---

## PROMPT 2-EMERGENCY — Full Part 2 in One Shot

> Use only if Part 1 works and you need Part 2 fast.

```
Add the Book a Flight feature to the existing PointPilot app.

Requirements:
- Bottom nav: Dashboard (left) + Book a Flight (right), visible when logged in
- Route /book (protected)
- Google Flights-style search form: origin, destination, date, passengers, cabin
- Toronto airports: YYZ, YTZ, YHM
- NYC airports: JFK, LGA, EWR
- 12 hardcoded flights from mock data (YYZ→JFK cheapest: 12,500 Aeroplan pts via Etihad/Star Alliance)
- Results sorted by lowest points, "Best value" badge on cheapest
- Points only — no dollar signs
- bookingPath text on each card
- Wallet strip at top showing user's Amex + Aeroplan balances
- Dashboard "Book a Flight" button navigates to /book
- Loading skeleton on search, empty state if no match
- No backend, no API, no algorithm

Return all new and changed files with full code, no placeholders.
```

---

# Bug-Fix Prompt (Reuse Anytime)

```
You are a senior frontend engineer reviewing PointPilot code.

Find and fix ALL issues in the code below:
- TypeScript errors
- React runtime errors
- Auth session bugs (stale session, logout not clearing)
- localStorage read/write bugs
- Route guard failures
- Mobile layout overflow or bottom nav overlap
- Form validation edge cases
- Missing loading/error states

Rules:
- Return ONLY the files you changed
- Return the COMPLETE updated file content (not diffs)
- List what you fixed in bullet points

[paste error message or file code here]
```

---

# Demo Scripts

## Part 1 only (30 seconds)

1. Open app → "PointPilot helps travel hackers track reward balances."
2. Click "Use Demo Account" → instant login.
3. Dashboard shows avatar, name, Amex 128,450 and Aeroplan 95,200.
4. Edit Aeroplan to 100,000 → Save → values update.
5. "Secure login, live balance tracking, ready for our optimizer integration."

## Part 1 + Part 2 (60 seconds)

1. Login with demo account.
2. Dashboard → show both point balances.
3. "Your balance covers approximately 7 Economy flights to New York."
4. Click "Book a Flight" → search form appears.
5. Keep defaults: YYZ → JFK, Economy, 1 passenger → Search.
6. Results appear in points — cheapest is 12,500 Aeroplan via Etihad.
7. "Same route, different airlines and programs — we surface the lowest-points redemption path."

---

# Execution Order

```
Part 1 (required):
  Prompt 0 → 1 → 2 → 3 → 4 → 5
  (or Prompt 1-EMERGENCY if out of time)

Part 2 (optional):
  Prompt 6 → 7 → 8 → 9 → 10 → 11
  (or Prompt 2-EMERGENCY if out of time)

Anytime:
  Bug-Fix Prompt
```

---

# Time Budget (90 min)

| Time | Task |
|------|------|
| 0–5 min | Paste Prompt 0 + Prompt 1, run scaffold |
| 5–20 min | Prompt 2 (auth) + Prompt 3 (dashboard) |
| 20–30 min | Prompt 4 (landing) + Prompt 5 (QA) |
| 30–35 min | Rehearse Part 1 demo |
| 35–45 min | Prompt 6 + 7 (bottom nav + flight data) |
| 45–60 min | Prompt 8 + 9 (search page + result cards) |
| 60–70 min | Prompt 10 + 11 (connect + QA) |
| 70–90 min | Rehearse full demo, fix bugs with Bug-Fix Prompt |

> If behind at minute 30, skip Part 2 and polish Part 1 demo instead.
