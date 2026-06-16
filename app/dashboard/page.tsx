import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email'
import LivePaymentsFeed from '@/components/LivePaymentsFeed'
import { require2FA } from '@/lib/check2fa'
import { resolveSchool } from '@/lib/schoolContext'
import { getEffectiveFee } from '@/lib/feeCalculations'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import type { ReactNode } from 'react'

export const revalidate = 0

export default async function Dashboard() {
  await require2FA()
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  // Quick check for admin redirect before full query
  const baseUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isAdmin: true },
  })
  if (!baseUser) redirect('/login')
  if (baseUser.isAdmin) redirect('/admin/dashboard')

  // Resolve school for both owners and invited team members
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) redirect('/signup')

  const { school } = ctx

  if (school.trialEndsAt) {
    const now = new Date()
    const msUntilEnd = school.trialEndsAt.getTime() - now.getTime()
    if (msUntilEnd <= 0) {
      redirect('/trial-expired')
    }
    if (msUntilEnd <= 2 * 24 * 60 * 60 * 1000 && !school.trialExpiryNotified) {
      const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } }).catch(() => null)
      if (settings?.notifyTrialExpiry !== false) {
        const trialEnd = school.trialEndsAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
        sendEmail({
          to: process.env.ADMIN_NOTIFICATION_EMAIL || 'davidnmwige@gmail.com',
          subject: `Trial expiring soon: ${school.name}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
            <div style="background:#050f2c;padding:20px 24px">
              <h1 style="color:#c8a84b;font-size:16px;margin:0;font-weight:700;letter-spacing:1px">ELIMU PAY</h1>
              <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase">Trial expiry alert</p>
            </div>
            <div style="padding:24px;background:#fff;border:1px solid #e2e8f0">
              <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 8px">A school's trial is expiring soon.</p>
              <p style="color:#64748b;font-size:13px;margin:0 0 16px">This school has not upgraded and their trial expires on <strong>${trialEnd}</strong>.</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">School</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${school.name}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Admin email</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${session.user.email}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b">Trial ends</td><td style="padding:8px 0;font-weight:700;color:#e24b4a;text-align:right">${trialEnd}</td></tr>
              </table>
            </div>
            <div style="padding:14px 24px;background:#f8f9fc;text-align:center">
              <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay Platform &middot; Admin notification</p>
            </div>
          </div>`
        }).catch(err => console.error('trial expiry notification error:', err))
      }
      await prisma.school.update({ where: { id: school.id }, data: { trialExpiryNotified: true } })
    }
  }

  const students = await prisma.student.findMany({
    where: { schoolId: school.id },
    include: { payments: true, bursary: true, studentDiscounts: { include: { discount: true } } }
  })

  const totalExpected = students.reduce((sum, s) => sum + getEffectiveFee(s.feeRequired, s.bursary, s.studentDiscounts), 0)
  const totalCollected = students.reduce((sum, s) =>
    sum + s.payments.reduce((p, pay) => p + pay.amount, 0), 0)
  const outstanding = totalExpected - totalCollected
  const zeroPayment = students.filter(s => s.payments.length === 0).length

  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  const icon = (inner: ReactNode) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{inner}</svg>
  )
  const cards = [
    { label: 'Expected', value: 'KES ' + totalExpected.toLocaleString(), valueColor: 'var(--ep-text-primary)', color: '#c8a84b', tint: 'rgba(200,168,75,0.14)', sub: `${students.length} student${students.length !== 1 ? 's' : ''}`, icon: icon(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 4v16" /></>) },
    { label: 'Collected', value: 'KES ' + totalCollected.toLocaleString(), valueColor: 'var(--ep-text-primary)', color: '#16a34a', tint: 'rgba(22,163,74,0.12)', sub: `${collectionRate}% of expected`, icon: icon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10.01-3-3" /></>) },
    { label: 'Outstanding', value: 'KES ' + outstanding.toLocaleString(), valueColor: '#d97706', color: '#d97706', tint: 'rgba(217,119,6,0.12)', sub: 'still to collect', icon: icon(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>) },
    { label: 'Zero payment', value: String(zeroPayment), valueColor: '#dc2626', color: '#dc2626', tint: 'rgba(220,38,38,0.12)', sub: 'no payment yet', icon: icon(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4M12 17h.01" /></>) },
  ]

  return (
    <main style={{background: 'var(--ep-bg-secondary)', minHeight: '100vh', overflowX: 'hidden'}}>
      <style>{`
        .dash-link { transition: background 200ms ease, border-color 200ms ease, opacity 200ms ease; }
        .dash-link:hover { opacity: 0.9; }
        .dash-link:focus-visible { outline: 2px solid #c8a84b; outline-offset: 2px; }
        .progress-track { background: rgba(148,163,184,0.25); border-radius: 999px; height: 8px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #0a7c3e, #16a34a); transition: width 600ms ease; }
        @media (prefers-reduced-motion: reduce) { .dash-link, .progress-fill { transition: none !important; } }
        @media (max-width: 640px) {
          .dash-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .dash-header-actions { flex-wrap: wrap; }
          .dash-content { padding: 16px !important; }
          .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      <header className="dash-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: '0 0 3px'}}>{school.name}</h1>
          <p style={{fontSize: '12px', color: '#94a3c8', margin: 0}}>{school.currentTerm}</p>
        </div>
        <div className="dash-header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <span aria-label={`${collectionRate} percent of fees collected`} style={{background: '#c8a84b', color: '#0a1f4e', fontSize: '11px', padding: '5px 12px', borderRadius: '999px', fontWeight: 700}}>{collectionRate}% collected</span>
          {(ctx.role === 'admin' || ctx.role === 'accountant') && (
            <Link href="/students" className="dash-link" style={{border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600}}>
              Students
            </Link>
          )}
          {(ctx.role === 'admin' || ctx.role === 'accountant') && (
            <Link href="/upload" className="dash-link" style={{background: '#c8a84b', color: '#0a1f4e', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none'}}>
              Upload statement
            </Link>
          )}
        </div>
      </header>

      <div className="dash-content" style={{padding: '24px 32px'}}>
        <OnboardingChecklist />

        <section aria-label="Fee collection progress" style={{background: 'var(--ep-card-bg)', borderRadius: '12px', border: '1px solid var(--ep-border)', padding: '18px 20px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(10,31,78,0.04)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', flexWrap: 'wrap', gap: '6px'}}>
            <p style={{fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0}}>Fee collection</p>
            <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: 0}}>KES {totalCollected.toLocaleString()} of {totalExpected.toLocaleString()}</p>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={collectionRate} aria-valuemin={0} aria-valuemax={100} aria-label="Percentage of fees collected">
            <div className="progress-fill" style={{width: `${Math.min(100, collectionRate)}%`}} />
          </div>
          <p style={{margin: '10px 0 0', color: 'var(--ep-text-primary)'}}>
            <span style={{fontSize: '22px', fontWeight: 700}}>{collectionRate}%</span>
            <span style={{fontSize: '12px', fontWeight: 500, color: 'var(--ep-text-tertiary)', marginLeft: '6px'}}>collected this term</span>
          </p>
        </section>

        <div className="dash-stats" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px'}}>
          {cards.map(card => (
            <div key={card.label} role="group" aria-label={`${card.label}: ${card.value}`} style={{background: 'var(--ep-card-bg)', borderRadius: '12px', border: '1px solid var(--ep-border)', padding: '16px', boxShadow: '0 1px 2px rgba(10,31,78,0.04)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
                <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', background: card.tint, color: card.color, flexShrink: 0}}>{card.icon}</span>
                <p style={{fontSize: '10px', color: 'var(--ep-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0, fontWeight: 600}}>{card.label}</p>
              </div>
              <p style={{fontSize: '21px', fontWeight: 700, color: card.valueColor, margin: 0, lineHeight: 1.1, wordBreak: 'break-word'}}>{card.value}</p>
              <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '4px 0 0'}}>{card.sub}</p>
            </div>
          ))}
        </div>

        <LivePaymentsFeed />
      </div>
    </main>
  )
}
