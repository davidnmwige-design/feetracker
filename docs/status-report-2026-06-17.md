# Elimu Pay — Production-Hardening Progress Report

**Prepared by:** Datacare Limited
**For:** David Njiru, Elimu Pay
**Date:** 17 June 2026
**Contact:** info@datacare.co.ke · www.datacare.co.ke · 0722 155 752

---

## 1. Executive summary

Work to take Elimu Pay from a working build to a launch-ready, production-grade
platform is well advanced and **on track for the agreed launch window**. We now have
full access to the codebase and database, and have completed the security, stability,
and core "market-readiness" work — the items a school and a regulator would expect of a
system that handles real money and the personal data of children.

Every change has been delivered into a single, reviewed change-set, and each piece has
been tested against a large, realistic copy of the data (thousands of students and
payments) before being accepted. The platform is materially more secure, faster under
load, and now supports the payment and communication features that schools asked for.

A small amount of work remains — chiefly a visual/usability refresh and a few items that
depend on information only you or the schools can provide (payment and messaging
account details). These are listed in Sections 5 and 6.

---

## 2. What we have completed

### Security and data protection
- Closed the highest-risk security gaps around **payment integrity and login**, so that
  fake payments cannot be injected and login/2-factor sessions cannot be forged.
- Strengthened how sensitive data is stored and how automated/background jobs are
  authorised, and removed a diagnostic endpoint that should never reach production.
- Independent penetration-test findings supplied earlier were reconciled against the
  live system; the outstanding high-risk items have been addressed.

### Reliability and scale
- Re-engineered the database connection approach so the platform stays responsive as the
  number of schools grows (essential for a multi-school, cloud deployment).
- Added an automated safety net of **38 tests** plus a large-scale stress test that we run
  before accepting any change, so regressions are caught early.

### Fee collection and compliance
- **Tax-compliant invoice numbering.** Invoices now carry unique, sequential numbers
  assigned by the system — a requirement for KRA-compliant record-keeping. This was
  proven correct even when many invoices are produced at the same moment.
- **Instant M-Pesa payment requests (STK Push).** Staff can now prompt a parent's phone
  to pay directly; a confirmed payment is recorded and reconciled to the right student
  automatically, and the parent receives a confirmation.
- **Faster, server-generated invoices.** Invoice PDFs are now produced by the server
  rather than the staff member's browser, so sending invoices — including in bulk — no
  longer slows down or freezes the screen.

### Parent communication
- **Real SMS fee reminders** via a Kenyan bulk-SMS gateway, alongside the existing email
  and WhatsApp options, including an automated scheduled reminder run.

### Performance and pre-launch tidy-up
- Fixed the heaviest screen in the app (the reminders list) so it stays fast even with
  thousands of students.
- Resolved a class of display/console warnings that affected polish and correctness.
- Removed the public "demo" area ahead of the live launch.

---

## 3. Testing performed

Testing was done against a **large, realistic dataset** — roughly **5,000 students across
~600 schools, with 3,000 payments and 2,000 invoices** — to mimic real load rather than a
small sample.

| Area tested | How | Result |
|---|---|---|
| Invoice numbering under pressure | Issued 75 invoices simultaneously | All unique, sequential, none duplicated; re-sending an invoice kept its original number |
| Instant payment (STK) security | Probed the payment endpoints directly | Staff-only access enforced; the payment-confirmation channel safely rejects forged calls without recording anything |
| Server-generated invoices | Issued and downloaded invoices end-to-end | Produced correctly and quickly; a failed email no longer voids an issued invoice |
| SMS and payment features when not yet configured | Triggered them without account details | Fail gracefully with a clear message — never crash |
| Speed under load | Loaded the main screens with the full dataset | Key list screens load in a fraction of a second when paged; the heaviest screen was reduced dramatically |
| Automated regression suite | 38 automated checks on every change | All passing |

---

## 4. Key findings

- **The new fee-collection and compliance features are correct and safe.** The most
  important property — that money and invoice numbers are handled accurately even under
  simultaneous activity — was demonstrated, not assumed.
- **Security posture is strong.** Payment-confirmation channels reject anything they
  cannot verify, and sensitive actions are limited to authorised staff.
- **Performance is good and will be better in production.** The biggest gains came from
  only loading what is shown on screen; one heavy screen has been brought into line with
  the rest. (Measured speeds during testing are slower than the live system will be,
  because the test environment runs in an un-optimised development mode.)
- **A few usability/polish items remain** and are itemised below; none are blockers.

---

## 5. What remains

1. **Visual and usability refresh** — a consistent design pass and accessibility
   improvements across the screens. We have deliberately held back front-end changes
   pending your written go-ahead; this is the main remaining body of work and can begin
   on your word.
2. **Two small front-end additions** already approved — an in-app button to trigger an
   M-Pesa payment request, and a one-click invoice download — to be wired next.
3. **Final compliance items** — a published data-protection/privacy position aligned to
   Kenya's Data Protection Act.

---

## 6. What we need from you / the schools

To switch the new features fully "on" in production, we will need:

- **Bulk-SMS account** (sender name) so SMS reminders can send under the school's identity.
- **M-Pesa details per school** — each school's own paybill/till and the matching M-Pesa
  online passkey. Per your direction, every school uses its **own** M-Pesa number for its
  collections; the platform is built around that model.
- **Email sending credentials** for invoice and payment-confirmation emails.

We can provide a short, plain checklist for each of these.

---

## 7. Outlook

The platform is in a strong, launch-ready position on security, stability, compliance,
and core features. The remaining work is primarily the visual/usability refresh and
switching on the third-party accounts above. We remain confident in the agreed launch
window and will share a final go-live checklist as we approach it.

*This report summarises progress and outcomes. Technical implementation detail is held in
the project's source control and is available to your team on request.*

— **Datacare Limited**
info@datacare.co.ke · www.datacare.co.ke · 0722 155 752
