# Elimu Pay / FeeTracker — Front-End Stress Test & UX Report

**Prepared by:** Datacare Limited · info@datacare.co.ke · 0722 155 752
**Date:** 11 June 2026
**Scope:** Empirical stress test of the entire front-end (school-staff + admin) under heavy data, plus
edge-input and bulk-action behaviour, with prioritized improvement recommendations.

> **No front-end code has been changed.** This report is recommendations only — implementation awaits
> written approval, per instruction.

---

## 1. Method

A throwaway local dataset was seeded into the dev database and the live UI was driven with a headless
browser (Playwright via Edge), recording per page: DOM node count, rendered table rows, JS heap, console
errors, interaction latency, and a screenshot (`docs/stress-shots/*.png`).

**Seeded volume:** 1 staff school with **5,003 students**, **3,000 payments** (1,000 unmatched),
**2,000 invoices**, 12 terms (incl. duplicates), 7 academic years (one with end-before-start), bursaries
+ discounts, 2,000 audit logs; plus **601 schools** for the admin side. Edge rows included a
**10,000-character student name**, a **formula string** (`=cmd|'/c calc'!A1`), and a **negative fee**.

> **Timing caveat:** the dev server compiles each page on first visit, so `goto` times below are inflated
> and are **not** the headline metric. The hard evidence is **DOM node count, heap, rendered rows, and
> interaction latency**, which reflect real client-side cost regardless of build mode.

## 2. Results (measured)

| Page | DOM nodes | Rows rendered | JS heap | Search/interaction | Verdict |
|---|---:|---:|---:|---|---|
| staff /dashboard | 221 | 10 | 25 MB | — | OK |
| **staff /students** | **70,169** | **5,003** | 59 MB | type→filter **1,043 ms** | 🔴 |
| staff /students/[id] | 223 | 1 | 14 MB | — | OK |
| staff /upload | 102 | 0 | 23 MB | — | OK |
| **staff /unmatched** | **13,093** | (cards) | 23 MB | type→filter **13,922 ms** | 🔴 |
| **staff /invoices** | **95,157** | **5,003** | **93 MB** | type→filter **6,989 ms** | 🔴 |
| **staff /reports** | **40,323** | **5,003** | 81 MB | — | 🔴 |
| **staff /reminders** | **65,155** | (cards) | 85 MB | — | 🔴 |
| staff /settings | 395 | 0 | 17 MB | settle 8.4 s | 🟡 |
| staff /setup | 101 | 0 | 24 MB | — | OK |
| **admin /admin/schools** | **21,758** | (601 cards) | 46 MB | — | 🔴 |
| **admin /admin/billing** | **10,786** | 631 | 68 MB | — | 🟡 |
| admin /admin/dashboard | 8,099 | 601 | 38 MB | — | 🟡 |
| admin /admin/onboarding | 8,544 | 0 | 34 MB | — | 🟡 |
| admin /admin/activity | 6,135 | 601 | 25 MB | — | 🟡 |
| admin /admin/analytics | 5,894 | 10 | 46 MB | — | 🟡 |
| admin /admin/flags | 4,942 | 800 | 50 MB | — | 🟡 |
| **admin /admin/audit** | **603** | **50** | 28 MB | — | ✅ paginated |
| admin (others: school-detail, communications, settings, forecast, testimonials) | 112–256 | — | — | — | OK |

For reference, a healthy page renders a few hundred to ~1,500 DOM nodes. **70k–95k nodes is 50–100×
that**, on a single screen.

## 3. Cross-cutting findings

### F1 — No pagination: every list renders all rows at once 🔴 CRITICAL
The students, invoices, reports, reminders, unmatched, admin-schools, admin-billing, admin-dashboard and
admin-activity views render the **entire** dataset on one page. Measured: **70,169 nodes (students),
95,157 (invoices), 65,155 (reminders)**, with 80–93 MB heap. On a mid-range school laptop this means
multi-second freezes, scroll jank, and risk of tab crashes well before a real Enterprise school's data
size. The one correctly-built page is **admin /audit** (server-side pagination, 50/page → 603 nodes) —
**use it as the template.**
- *Repro:* log in as the seeded staff user → open /students or /invoices.
- *Fix:* server-side pagination + search (page size 25–50) or list virtualization. Backend support for
  this is being prepared in parallel in a backward-compatible way.

### F2 — Client-side search with no debounce 🔴 HIGH
Search filters the full in-memory array on every keystroke. Measured filter time: **1.0 s (students),
7.0 s (invoices), 13.9 s (unmatched)** for a single query. The UI is unusable during that window.
- *Fix:* debounce input (~300 ms) and move filtering server-side (pairs with F1).

### F3 — Unbounded text inputs everywhere 🟠 HIGH
Almost no form field has a `maxLength` (student name/admNo/parent fields, school name/paybill, settings,
terms, exam fees, discounts, login/signup). The seeded **10,000-character name renders into the table**,
inflating the DOM and breaking layout/PDF pagination. (Server-side zod caps exist for some routes but the
UI gives no feedback and not every endpoint is covered.)
- *Fix:* add `maxLength` + inline validation on inputs; complete server-side caps (backend groundwork).

### F4 — Client-side PDF / export blocks the main thread 🟠 HIGH
Reports and invoices generate PDFs in-browser with jsPDF over all students; the full Excel export builds
the whole workbook in memory. With thousands of rows this freezes the tab for seconds with no progress
indicator or cancel.
- *Fix:* server-side PDF/Excel generation (stream to client) or a web worker + progress UI.

### F5 — `LivePaymentsFeed` unbounded growth + polling 🟡 MEDIUM
Polls every 30 s and keeps an ever-growing `knownIds` Set + per-row highlight animations; memory grows the
longer the dashboard is left open.
- *Fix:* cap retained IDs (e.g. last 100), date-bound the fetch, batch animations.

### F6 — Sequential bulk actions 🟡 MEDIUM
Bulk reminders/invoices send one request at a time with `await`+sleep (≈25 min for 1,000 recipients), and
the WhatsApp path calls `window.open()` in a loop (browser-crash risk).
- *Fix:* batched concurrency (e.g. 10 at a time) with a progress bar; never loop `window.open()`.

### F7 — Weak data validation 🟡 MEDIUM
Hardcoded term options; academic-year **end-before-start accepted** (seeded year 2099 with reversed
dates); duplicate term names allowed; negative/huge fee amounts accepted client-side.
- *Fix:* validate date order, ranges, and duplicates on both client and server.

### F8 — Accessibility & correctness defects 🟡 MEDIUM
Modals lack `role="dialog"`/focus traps; tables lack header semantics; many controls lack labels. Two
console issues appear site-wide: a **CSP typo** — `connect-src` contains the invalid source
`https://o*.ingest.sentry.io` (silently ignored, so Sentry's connect may be blocked) — and a **React
hydration mismatch** on every page.
- *Fix:* fix the CSP source (`https://*.ingest.sentry.io`), resolve the hydration mismatch, add ARIA
  roles/labels and modal focus management (WCAG 2.2 AA).

### F9 — No design system 🟢 LOW–MED
Colours/spacing/typography are inline-duplicated across 80+ files; `components/ui/*` (button, input,
table, card) exist but are largely unused; mobile breakpoints are inconsistent.
- *Fix:* adopt design tokens + the shared UI components; consolidate buttons/cards/tables.

## 4. Prioritized roadmap (for your approval)

1. **Pagination + server-side search** on students, invoices, unmatched, reports, admin-schools,
   admin-billing (F1, F2). *Highest impact.*
2. **Input limits + validation** across forms incl. date-order/range/duplicate checks (F3, F7).
3. **Server-side / worker exports** with progress (F4).
4. **Bulk-action concurrency + progress** (F6).
5. **`LivePaymentsFeed` memory fix** (F5).
6. **CSP fix + hydration fix + accessibility pass** (F8).
7. **Design-system consolidation + mobile** (F9).

## 5. Market-readiness licences (Kenya) — informational, not legal advice

- **Business & tax:** company registration (BRS), KRA PIN, county Single Business Permit, VAT (if turnover
  ≥ KES 5M), **eTIMS** onboarding for compliant invoices.
- **Data protection:** **ODPC** registration as Data Controller + Processor under the Data Protection Act
  2019 (you process minors' data), DPO + privacy policy.
- **Payments — decisive:** M-Pesa/Daraja via Safaricom; **if you hold/aggregate fees, you need CBK PSP
  authorisation (or to operate under a licensed PSP)** — if schools use their own paybills and you only
  reconcile, you likely don't. **Confirm this first.** PCI-DSS only if you add card payments.
- **SMS (Phase 3):** branded **Sender ID** via a Communications Authority–licensed bulk-SMS aggregator.
- **IP (recommended):** trademark the brand with **KIPI**.

Validate all of the above — especially the CBK question — with a Kenyan fintech lawyer + tax advisor.

## 6. Evidence

Screenshots and the raw metrics are in `docs/stress-shots/` (`metrics.json` + 23 PNGs). The seed and
profiler scripts are `scripts/stress-seed.mjs` and `scripts/stress-profile.mjs` (local-only; safe to
delete after review).
