# Project Details — Gym Management SaaS (Portfolio Project)

> This file is the single source of truth for AI-assisted development (Antigravity + MCP).
> Reference the relevant section by name in every build prompt instead of re-explaining context.
> Update the **Build Log** at the bottom after every verified step.

---

## 1. Product Overview

A gym management dashboard built for gym owners in India, as a personal portfolio project (not a real client build — no pricing/marketing strategy included). The core problem it solves is membership fee tracking and renewal communication: a gym owner adds members with a plan and expiry date, and the system proactively surfaces who's expiring soon, who's an unconverted lead, and who's due a review request — funneling every action into a one-click WhatsApp (`wa.me`) redirect so the owner never manually types a message or looks up a number. It is a single-admin tool (one owner per gym), not a multi-tenant staff platform.

---

## 2. Tech Stack

- **Frontend:** Next.js (React)
- **Styling:** Tailwind CSS
- **Backend / Database:** Supabase (Postgres, relational)
- **Build tool:** Antigravity, connected via MCP to Supabase
- **Build approach:** vertical slices, one tab at a time — schema → backend logic → desktop UI → mobile UI → polish — each step manually verified before moving to the next

---

## 3. Core Loop (MVP Journey)

```
Owner logs in → Adds Member (name, phone, plan, expiry date) →
Dashboard tracks expiry automatically → Owner sends WhatsApp reminder
(one-click) → Owner logs payment received → Member status updates
(Green/Yellow/Red) → Cycle repeats monthly
```

**Service flow / architecture decision:** Single-Page Application. Dashboard live-reads from the Members/Leads tables with no page reload on widget click. WhatsApp opens as an external redirect in a new tab. Any data change (payment logged, lead outcome logged) updates the source table and the Dashboard reflects it without a refresh.

---

## 4. Auth & Permissions

Single role: **Admin (Gym Owner)** — full CRUD access to all tabs and all data. No multi-role, no staff login, no view-only restrictions. One authenticated user owns one gym's data. No RBAC matrix needed.

---

## 5. Database Schema (Entity Relationship Model)

```
users: id, name, email, password_hash, gym_name,
       trial_end_date, subscription_status

plans: id, user_id (FK), plan_name, price, duration_days

members: id, user_id (FK), plan_id (FK), name, phone,
         join_date, expiry_date, status (Active/Expiring/Expired),
         freeze_start, freeze_end

leads: id, user_id (FK), name, phone, promised_date,
       outcome, converted_to_member_id (nullable FK)

payments: id, member_id (FK), amount, method (Cash/UPI/Card), date

expenses: id, user_id (FK), category, amount,
          recurring_flag, receipt_url, date

trainers: id, user_id (FK), name, phone, base_salary, join_date

pt_assignments: id, trainer_id (FK), member_id (FK),
                 commission_percent, assigned_date

salary_advances: id, trainer_id (FK), amount, date,
                   note, deducted_flag
```

**Database architecture decision:** Relational SQL (Postgres/Supabase). Data is highly connected — payments belong to members, leads convert into members, plans are referenced by members, PT assignments link trainers to members — this requires foreign keys and joins, which a NoSQL store handles poorly.

**Note on `trial_end_date` / `subscription_status`:** these fields exist on `users` for future subscription/billing logic. No current feature reads or writes them — do not build billing UI around them in v1.

---

## 6. Business Logic — Locked Rules

**Status dot thresholds** `[ASSUMPTION — confirm/adjust if wrong]`
Applied identically on Dashboard and Members tab:
- 🟢 **Green (Active):** more than 3 days until expiry
- 🟡 **Yellow (Expiring):** 0–3 days until expiry
- 🔴 **Red (Expired):** expiry date has passed — no grace period

**Freeze/Pause engine:** Owner sets a start/end date. The account is suspended for that window, and `expiry_date` is pushed forward by exactly the freeze duration (e.g., a 10-day freeze adds 10 days to expiry).

**30-day anniversary (Google Review trigger):** Calculated from `join_date`, not from last renewal or last payment date.

**Lead → Member conversion:** `leads.converted_to_member_id` links a lead to the resulting member record once they sign up.

---

## 7. MVP Scope

**Build (v1):**
- Auth (single Admin login)
- Members CRUD, including Freeze/Pause and Quick-Edit Payment logging
- Leads CRUD
- Dashboard: 3 widgets — Expiring Members (Action List), Today's Follow-ups, 30-Day Review Prompts
- WhatsApp redirect buttons (member welcome, expiry alert, review request)
- Payments log
- Expenses log (with receipt upload + recurring toggle)
- Profitability Widget (Revenue − Expenses)
- Projected Revenue forecast
- New vs. Renewal Revenue Split
- Payment Method Pie Chart
- Month-over-Month Bar Chart
- Trainers: base salary + PT commission tracker, salary advance/loan ledger

> **Scope revision note:** Phase 1's original MVP cut list excluded Projected Revenue, New vs. Renewal Split, the Payment Method Pie Chart, and the MoM Bar Chart. This was overridden in later discussion — **all four are in scope for v1.**

**Cut (not building in v1):**
- Freeze/Pause audit history (only current freeze state is tracked, not a historical log)

---

## 8. WhatsApp Message Templates

`[Placeholder copy — editable anytime without touching schema or logic]`

**New Member Welcome** (sent on member creation):
```
Hi {member_name}, welcome to {gym_name}! Your membership is now active,
starting {join_date}. Here are our gym rules: {gym_rules_pdf_link}
See you at the gym!
```

**Expiry Reminder** ("Send Alert" button):
```
Hi {member_name}, your {gym_name} membership expires on {expiry_date}.
Renew now to keep your access active without interruption.
```

**Google Review Request** (30-day anniversary prompt):
```
Hi {member_name}, it's been 30 days since you joined {gym_name}!
We'd love your feedback — could you spare a minute to leave us a
Google review? {google_review_link}
```

---

## 9. Design Tokens

**Color Palette**
```
Primary Action:      #2563EB (Blue 600)
Secondary Accent:    #0F172A (Slate 900)
Base Background:     #F8FAFC (Slate 50)
High-Contrast Text:  #0F172A (Slate 900)

Status Colors:
Active/Success:  #16A34A (Green 600)
Expiring/Warning: #EAB308 (Yellow 500)
Expired/Danger:  #DC2626 (Red 600)
```

**Typography**
```
Heading Font: Inter
Body Font: Inter

H1 — Mobile: text-2xl / 24px
H1 — Tablet: text-3xl / 30px
H1 — Desktop: text-4xl / 36px
Body: text-sm / 14px
Table/List Cell Text: text-sm / 14px
```

**Geometry & Elevation**
```
Global Border Radius: rounded-lg (8px)

Base Container Shadow: shadow-sm (Dashboard metric cards, list rows)
Modal/Drawer Elevation: shadow-2xl (Add Member/Lead cards, mobile slide-up sheets)
Dropdown/Popover Shadow: shadow-md (filter dropdowns)

Canvas Background: #F8FAFC (Slate 50)
Card/Row Background: #FFFFFF
Border: 1px solid #E2E8F0 (Slate 200) — hairline row separators
```

**Spacing**
```
Global X-Axis Padding: 16px (mobile) / 32px (desktop)
Data Table Row Padding: 14px vertical
Minimum Touch Target: 48px (all buttons, nav icons, dropdowns)
```

---

## 10. Motion Tokens

```
Micro-Interaction Duration: 120ms — hovers, toggles, tap feedback
Modal/Drawer Entrance: 200ms
Tab Slide Transition: 180ms — translateX + fade between tabs

Tactile Feedback: active:scale-95 on every tappable element
State Transitions: skeleton (grey pulsing) loaders while data fetches — never a blank screen

Toast Notifications:
- Success (Green): auto-dismiss after 3s
- Warning (Yellow): auto-dismiss after 4s
- Error (Red): stays until manually dismissed
```

**Animation rule:** only `transform` (scale, translateX) and `opacity` are ever animated — no layout-shifting animations. No staggered fade-ins or scroll-reveals on data tables; rows render instantly.

---

## 11. Layout Rules

- **Navigation:** Bottom nav bar (mobile, 5 icons: Dashboard, Members, Leads, Trainers, Financials) / persistent left sidebar (desktop)
- **Add actions:** Floating Action Button (FAB), bottom-right, positioned just above the bottom nav bar on mobile — not a top-of-page button
- **Data entry (Add Member/Lead/etc.):** full-screen modal sliding up from bottom (mobile) / centered floating modal (desktop) — Form Inputs → Validation Helpers → Sticky Save/Cancel Footer
- **Members/Leads lists:** single, clean horizontal row per record — flush edge-to-edge, not boxed cards, to maximize density
- **Dashboard cards:** distinct metric cards, 2×2 grid on mobile (not 1×4, to avoid horizontal scroll), 4-box row on desktop
- **Long content handling:** long names use text-truncate with ellipsis or horizontal scroll — row layout must never break

---

## 12. Copy Library

**Navigation Labels:** Dashboard · Members · Leads · Trainers · Financials

**Primary Action Buttons:** Add Member · Add Lead · Add Payment · Add Expense · Send Reminder · Freeze Membership

**Destructive Action Labels:** Remove Member (Cannot be undone) · Delete Lead (Cannot be undone) · Delete Expense (Cannot be undone)

**Empty States:**
```
Members:    "No members yet" / "Click 'Add Member' to start tracking memberships and payments."
Leads:      "No leads yet" / "Click 'Add Lead' when a walk-in visitor shows interest."
Trainers:   "No trainers added yet" / "Click 'Add Trainer' to start tracking salaries and PT commissions."
Financials: "No expenses logged yet" / "Click 'Add Expense' to start tracking rent, salaries, and bills."
Dashboard:  "You're all caught up" / "No members expiring, no pending follow-ups today."
```

**Toast Copy:**
```
Success: "Payment logged successfully"
Warning: "Member expiring in 2 days"
Error:   "Failed to save. Check your connection."
```

---

## 13. Non-Goals

- No dark mode (light mode only)
- No sound effects on interactions (visual tap feedback only)
- No multi-role or staff login in v1
- No Freeze/Pause audit history log
- No hamburger menu on mobile (bottom nav bar instead)

---

## 14. Per-Tab Feature Specs

### Tab 1 — Dashboard (Command Center)
Read-only notification hub, no direct data entry.
1. **Action List:** members expiring in <3 days, with a "Send Alert" WhatsApp button beside each name.
2. **Today's Lead Follow-ups:** leads whose promised join date is today.
3. **Google Review Prompts:** members hitting their 30-day anniversary (from `join_date`) today, with a pre-written WhatsApp review request.

### Tab 2 — Members (Core CRM)
Single horizontal row per member.
1. **Status & Filters:** top-level filter tabs — All / Active / Pending Payment. Green/Yellow/Red dots per thresholds in Section 6.
2. **New Member Welcome:** on creation, generates a `wa.me` link with the welcome message + Gym Rules PDF link.
3. **Quick-Edit Payment:** "+" button beside pending amounts to log a payment inline (amount + method).
4. **Freeze/Pause Engine:** start/end date input; suspends account and pushes `expiry_date` forward by the freeze duration.
5. **One-Click WhatsApp:** global button beside every member's name.

### Tab 3 — Leads & Enquiries (Walk-in CRM)
1. **Enquiry & Lead Management:** logs name, phone, promised join date, outcome. Feeds the Dashboard's Today's Follow-ups widget directly.

### Tab 4 — Trainers (Staff Management)
1. **Base Salary vs. PT Commission Tracker:** base pay + commission percentage per assigned PT client (`pt_assignments`).
2. **Salary Advance/Loans Tracker:** ledger of mid-month advances (`salary_advances`), auto-deducted from end-of-month salary calculation.

### Tab 5 — Financials & Analytics (Wealth Tracker)
1. **Profitability Widget:** Total Revenue − Total Expenses = Net Profit.
2. **Expense Categories & Receipt Logging:** Rent / Electricity / Salaries / Maintenance, with a Recurring Monthly toggle and receipt photo upload.
3. **Projected Revenue:** forecast assuming every currently expiring member renews.
4. **New vs. Renewal Revenue Split:** new walk-in revenue vs. renewal revenue, to show business health.
5. **Payment Method Pie Chart:** Cash / UPI / Card breakdown, for cash register reconciliation.
6. **Month-over-Month Bar Chart:** revenue trend across previous months.

---

## 15. Build Order

Auth + Members (foundation) → Dashboard (reads from Members) → Leads → Financials → Trainers (most isolated feature, built last)

Within each tab: **Schema → Backend logic (no UI) → Desktop UI wired to real backend → Mobile UI (same data layer) → Edge-case/polish pass.**

---

## 16. Build Log

*(Update after every verified step — this is what keeps later tabs consistent with earlier decisions.)*

- [ ] Members — schema created & verified in Supabase
- [ ] Members — backend CRUD functions tested
- [ ] Members — desktop UI wired to real backend
- [ ] Members — mobile UI (same data layer)
- [ ] Members — edge-case/polish pass
- [ ] Dashboard — schema (none needed, reads existing tables)
- [ ] Dashboard — backend logic (widget queries)
- [ ] Dashboard — desktop UI
- [ ] Dashboard — mobile UI
- [ ] Dashboard — edge-case/polish pass
- [ ] Leads — full slice
- [ ] Financials — full slice
- [ ] Trainers — full slice