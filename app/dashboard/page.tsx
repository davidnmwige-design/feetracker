import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function Dashboard() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true }
  })

  if (!user) redirect('/login')
  if (user.isAdmin) redirect('/admin/dashboard')
  if (!user.school) redirect('/signup')

  const school = user.school

  const students = await prisma.student.findMany({
    where: { schoolId: school.id },
    include: { payments: true }
  })

  const totalExpected = students.reduce((sum, s) => sum + s.feeRequired, 0)
  const totalCollected = students.reduce((sum, s) =>
    sum + s.payments.reduce((p, pay) => p + pay.amount, 0), 0)
  const outstanding = totalExpected - totalCollected
  const zeroPayment = students.filter(s => s.payments.length === 0).length

  const recentPayments = await prisma.payment.findMany({
    where: { student: { schoolId: school.id } },
    take: 10,
    orderBy: { paidAt: 'desc' },
    include: { student: true }
  })

  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>

      <div style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>{school.name}</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>{school.currentTerm}</p>
        </div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <span style={{background: '#c8a84b', color: '#0a1f4e', fontSize: '11px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700}}>{collectionRate}% collected</span>
          <Link href="/students" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
            Students
          </Link>
          <Link href="/upload" style={{background: '#c8a84b', color: '#0a1f4e', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, textDecoration: 'none'}}>
            Upload MPESA
          </Link>
        </div>
      </div>

      <div style={{padding: '24px 32px'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px'}}>
          {[
            {label: 'Expected', value: 'KES ' + totalExpected.toLocaleString(), color: '#0f172a'},
            {label: 'Collected', value: 'KES ' + totalCollected.toLocaleString(), color: '#0a1f4e'},
            {label: 'Outstanding', value: 'KES ' + outstanding.toLocaleString(), color: '#c8a84b'},
            {label: 'Zero payment', value: String(zeroPayment), color: '#e24b4a'},
          ].map(card => (
            <div key={card.label} style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px'}}>
              <p style={{fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'}}>{card.label}</p>
              <p style={{fontSize: '22px', fontWeight: 700, color: card.color}}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
          <div style={{padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a'}}>Recent payments</h2>
          </div>
          <table style={{width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px'}}>
            <thead>
              <tr style={{textAlign: 'left' as const, borderBottom: '1px solid #f1f5f9'}}>
                {['Time', 'From', 'Amount', 'Matched to', 'Status'].map(h => (
                  <th key={h} style={{padding: '10px 14px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 && (
                <tr><td colSpan={5} style={{padding: '20px', textAlign: 'center' as const, color: '#94a3b8'}}>No payments yet. Upload an MPESA statement to get started.</td></tr>
              )}
              {recentPayments.map(payment => (
                <tr key={payment.id} style={{borderBottom: '1px solid #f8fafc'}}>
                  <td style={{padding: '10px 14px', color: '#64748b'}}>{new Date(payment.paidAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{padding: '10px 14px'}}>{payment.senderName || '—'}</td>
                  <td style={{padding: '10px 14px', fontWeight: 600}}>KES {payment.amount.toLocaleString()}</td>
                  <td style={{padding: '10px 14px', color: '#64748b'}}>{payment.student ? payment.student.name + ' · ' + payment.student.class : '—'}</td>
                  <td style={{padding: '10px 14px'}}>
                    <span style={{background: payment.matched ? '#e1f5ee' : '#fcebeb', color: payment.matched ? '#0a1f4e' : '#a32d2d', fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600}}>
                      {payment.matched ? 'Matched' : 'Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}