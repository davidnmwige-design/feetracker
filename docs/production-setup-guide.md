# Elimu Pay — Go-Live Setup Guide

**Prepared by:** Datacare Limited · **For:** David Njiru, Elimu Pay · **Date:** 17 June 2026
**Contact:** info@datacare.co.ke · www.datacare.co.ke · 0722 155 752

This guide walks you through everything that must be set up on your side to move Elimu Pay
into the live (production) environment. Each section says **what to do**, the **rough cost**,
and **exactly what to send back to us** so we can connect it.

> **Prefer us to handle all of it?** If you'd rather not do these steps yourself, Datacare can
> take care of the entire production setup end-to-end — registering and configuring every
> account (domain, hosting, database, email, SMS, M-Pesa), wiring it all up, and deploying —
> for a **one-time setup fee of KES 20,000**. This is a separate, optional service and is **not
> part of the original arrangement**. (Third-party charges above — domain, hosting, SMS units,
> etc. — are billed by those providers and are not included in this fee.)

> **Important — ownership.** Please create each account **in Elimu Pay's name** (your
> business email and your payment card). You own the accounts and the billing; we only need
> the access keys to connect them. Where an account supports it, you can instead add us as a
> team member (we'll give you the email to invite). Never let a vendor account be owned by an
> individual contractor.

> **How to send us credentials — securely.** Do **not** send keys over plain email, SMS, or
> WhatsApp. Use one of these:
> 1. A one-time secret link — go to **onetimesecret.com**, paste the value, send us the link
>    (it self-destructs after we open it), or
> 2. Share via a password manager (we can use a shared 1Password/Bitwarden vault), or
> 3. Read them to us on a call while we enter them.

---

## At a glance — the pieces

| Piece | Provider (recommended) | Purpose | Indicative cost |
|---|---|---|---|
| Domain name | **simbahost.co.ke** (.co.ke) | Your web address | KES 1,500/yr |
| Hosting | Vercel *(already set up)* | Runs the application | Currently free tier; ~$20/mo Pro for production scale |
| Database | Neon — PostgreSQL *(already set up)* | Stores all data | Currently free tier; ~$19/mo for production scale |
| Email | **Resend** | Invoices, reminders, confirmations | Free up to 3,000/mo; ~$20/mo for 50,000 |
| SMS | Celcom Africa | SMS fee reminders | Pay-as-you-go, ~KES 0.30–0.80 per SMS |
| M-Pesa | Safaricom Daraja | Payments & instant pay prompts | Free API; paybill per Safaricom |

**Already in place.** The application is built and **live on Vercel** (currently at
https://feetracker-seven.vercel.app) with its database on **Neon** — so hosting and the
database need nothing from you. The only thing to note is that, for production scale, we may
move both to their **paid tiers** (Vercel Pro ~$20/mo, Neon ~$19/mo) for performance and
reliability as schools come on board; we'll advise when that's worthwhile. Everything else
below can start on a **free tier**.

---

## Step 1 — Buy a domain name

**What to do**
1. Decide the address. We suggest **elimupay.co.ke** (Kenyan, trusted locally).
2. Register it at **simbahost.co.ke** — search for the name and check out (**KES 1,500/year**).
3. After purchase, you'll get a login to the registrar's **DNS / domain management** page.
   We will give you a short list of DNS records to add (for the website, email, etc.), or
   you can add us as a user on the registrar so we configure it.

**What to send us**
- The domain name(s) you bought, and **access to the DNS settings** (invite us, or be
  available to paste in the 4–6 records we provide).

We connect your new domain (Step 1) to the existing Vercel deployment so the app answers at
`https://elimupay.co.ke` instead of the temporary address.

---

## Step 2 — Set up email sending (Resend)

This powers invoice emails, payment confirmations, and email reminders.

**What to do**
1. Go to **resend.com** → **Sign Up** (free tier: 3,000 emails/month, 100/day).
2. In the left menu, open **Domains → Add Domain** and enter your domain (e.g.
   `elimupay.co.ke`). Resend will show you **3–4 DNS records** (SPF, DKIM, and a return-path).
3. Add those records in your domain's DNS page from Step 1 (or send them to us to add). Wait
   for Resend to show the domain as **Verified** (usually minutes, sometimes a few hours).
4. Open **API Keys → Create API Key**, name it "Elimu Pay Production", and copy the key
   (it starts with `re_…`). **You can only see it once** — copy it immediately.

**What to send us (securely)**
- The **Resend API key** (`re_…`).
- Confirmation that your domain shows **Verified** in Resend.
- The **"from" address** you want parents to see (e.g. `fees@elimupay.co.ke` or
  `no-reply@elimupay.co.ke`).

> Note: the app currently emails via a Google account. We will switch it to Resend (a small
> change on our side) so that, once you send the key above, everything sends under your own
> domain with better deliverability.

---

## Step 3 — Set up SMS (Celcom Africa)

**What to do**
1. Visit **celcomafrica.com** and **register for a Bulk SMS account** (or email/call their
   sales team — they often onboard you directly).
2. Ask them to **register a Sender ID** for you — a short text name parents will see as the
   sender, e.g. `ELIMUPAY` or your school brand. (Sender-ID approval goes through the
   Communications Authority and can take **1–2 weeks**, so start this early. There is a small
   one-time registration fee.)
3. **Buy SMS units** to load your account (start small, e.g. KES 2,000–5,000).
4. From your Celcom account dashboard, obtain your **API key**, **Partner ID**, and the
   approved **Sender ID (shortcode)**.

**What to send us (securely)**
- **API key**, **Partner ID**, and the approved **Sender ID**.

Until these arrive, the SMS feature stays safely dormant (it simply does nothing).

---

## Step 4 — Set up M-Pesa (Safaricom Daraja) — per school

Per your direction, **each school collects to its own M-Pesa paybill/till**. There are two parts:
a one-time developer setup (platform level), and a per-school detail.

**A. One-time (platform) — Daraja developer account**
1. Go to **developer.safaricom.co.ke** → **Sign up** with the Elimu Pay email.
2. Create an **App** (it gives you a **Consumer Key** and **Consumer Secret**). These let the
   platform talk to M-Pesa on schools' behalf.

**B. Per school — their M-Pesa details**
For each school joining the platform you (or the school) will need:
1. The school's **Paybill or Till number** (their Lipa na M-Pesa business shortcode).
2. The school's **M-Pesa "online" passkey** for that shortcode (Safaricom issues this when the
   shortcode is enabled for online payments / "Lipa na M-Pesa Online"). This is required for
   the **instant payment prompt (STK Push)** feature.
3. We register the school's paybill inside the app so real-time payment notifications flow in.

**Going live:** Daraja starts in a **sandbox** (test) mode. When you're ready, Safaricom runs a
short **go-live** approval to switch your app to production. We handle the technical side; you
may be asked to confirm business details.

**What to send us (securely)**
- The **Consumer Key** and **Consumer Secret** from your Daraja app.
- For each school: **Paybill/Till** and the **online passkey**.

---

## Behind-the-scenes secrets (we handle these)

A few internal secrets (for encrypting data, securing automated jobs, and authenticating
M-Pesa callbacks) are generated by us and stored only in the hosting environment. **You don't
need to do anything here** — they're already set in the current deployment.

---

## Master checklist — what to send us

| # | Item | From |
|---|---|---|
| 1 | Domain name + DNS access | Step 1 |
| 2 | Resend API key + verified domain + "from" address | Step 2 |
| 3 | Celcom API key + Partner ID + Sender ID | Step 3 |
| 4 | Daraja Consumer Key + Secret; per-school Paybill + passkey | Step 4 |

Send each item via a one-time secret link (see top of this guide). Hosting and the database are
already running, so as soon as we have items 1–2 the live site is on your own domain with email
sending; SMS (3) and M-Pesa (4) switch on as those arrive.

---

## Suggested improvements beyond the current scope

You asked for ideas to improve the application further. These are **optional** and **not part
of the current engagement** — we've ranked them by value and added a rough effort guide so you
can decide what to commission next. We're happy to quote any of them firmly on request.

**Recommended first — protect the live system**

| Improvement | What it gives you | Rough effort |
|---|---|---|
| **Error & uptime monitoring** | Instant alerts the moment something breaks or the site goes down, plus a dashboard of issues — essential peace-of-mind for a system handling real money. | Small (~1–2 days) |
| **Automated backups + tested restore** | Daily off-site backups *and* a proven restore, so school and payment data can never be lost — we verify the restore works, not just that a backup exists. | Small (~1–2 days) |

**High value — grow collections & cut workload**

| Improvement | What it gives you | Rough effort |
|---|---|---|
| **Parent-facing balance & pay page** | A link each parent can open to see their child's balance and pay on the spot — fewer calls to the bursar and faster collections. | Medium (~1–2 weeks) |
| **Payment reconciliation dashboard** | A daily view of collected vs. expected, per class/school, with unmatched payments flagged for action. | Medium (~1 week) |
| **Per-school onboarding wizard** | New schools self-onboard their paybill, students and fees with minimal hand-holding — lets you scale sign-ups without manual setup. | Medium (~1–2 weeks) |

**Nice to have — richer engagement & reporting**

| Improvement | What it gives you | Rough effort |
|---|---|---|
| **Official WhatsApp Business API** | Fully automated WhatsApp reminders (not click-to-send) with delivery receipts. | Medium + WhatsApp approval |
| **Role-based reporting & exports** | Termly collection reports for principals and boards, exportable to Excel/PDF. | Small–Medium |

---

## What happens next on our side

- We switch the email engine to **Resend** so it's ready the moment your key arrives.
- We wire the two approved front-end additions: the **"Request M-Pesa payment"** button and
  **one-click invoice download**.
- On your go-ahead, we begin the **visual/usability refresh** (the main remaining work).
- We point your new domain at the existing Vercel deployment and run a final go-live checklist
  with you (including any move to the paid hosting/database tiers).

We're happy to hop on a short call and do Steps 1–2 together live if that's easier.

— **Datacare Limited**
info@datacare.co.ke · www.datacare.co.ke · 0722 155 752
