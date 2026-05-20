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
          to: 'davidnmwige@gmail.com',
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

  return (
    <main style={{background: 'var(--ep-bg-secondary)', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden'}}>
      <style>{`
        @media (max-width: 640px) {
          .dash-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .dash-header-actions { flex-wrap: wrap; }
          .dash-content { padding: 16px !important; }
          .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      <div className="dash-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>{school.name}</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>{school.currentTerm}</p>
        </div>
        <div className="dash-header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <span style={{background: '#c8a84b', color: 'var(--ep-text-primary)', fontSize: '11px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700}}>{collectionRate}% collected</span>
          {(ctx.role === 'admin' || ctx.role === 'accountant') && (
            <Link href="/students" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
              Students
            </Link>
          )}
          {(ctx.role === 'admin' || ctx.role === 'accountant') && (
            <Link href="/upload" style={{background: '#c8a84b', color: 'var(--ep-text-primary)', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, textDecoration: 'none'}}>
              Upload Statement
            </Link>
          )}
        </div>
      </div>

      <div className="dash-content" style={{padding: '24px 32px'}}>
        <OnboardingChecklist />
        <div className="dash-stats" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px'}}>
          {[
            {label: 'Expected', value: 'KES ' + totalExpected.toLocaleString(), color: 'var(--ep-text-primary)'},
            {label: 'Collected', value: 'KES ' + totalCollected.toLocaleString(), color: 'var(--ep-text-primary)'},
            {label: 'Outstanding', value: 'KES ' + outstanding.toLocaleString(), color: '#c8a84b'},
            {label: 'Zero payment', value: String(zeroPayment), color: '#e24b4a'},
          ].map(card => (
            <div key={card.label} style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '16px'}}>
              <p style={{fontSize: '10px', color: 'var(--ep-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'}}>{card.label}</p>
              <p style={{fontSize: '22px', fontWeight: 700, color: card.color}}>{card.value}</p>
            </div>
          ))}
        </div>

        <LivePaymentsFeed />
      </div>
    </main>
  )
}