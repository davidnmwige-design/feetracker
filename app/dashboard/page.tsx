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

  if (!user?.school) redirect('/signup')

  const students = await prisma.student.findMany({
    where: { schoolId: user.school.id },
    include: { payments: true }
  })

  const totalExpected = students.reduce((sum, s) => sum + s.feeRequired, 0)
  const totalCollected = students.reduce((sum, s) =>
    sum + s.payments.reduce((p, pay) => p + pay.amount, 0), 0)
  const outstanding = totalExpected - totalCollected
  const zeroPayment = students.filter(s => s.payments.length === 0).length

  const recentPayments = await prisma.payment.findMany({
    where: { student: { schoolId: user.school.id } },
    take: 10,
    orderBy: { paidAt: 'desc' },
    include: { student: true }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{user.school.name}</h1>
            <p className="text-gray-500 text-sm">{user.school.term}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/students" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
              Students
            </Link>
            <Link href="/upload" className="text-white px-4 py-2 rounded-lg text-sm" style={{backgroundColor:'#0a1f4e'}}>
              Upload MPESA
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Expected</p>
            <p className="text-2xl font-semibold">KES {totalExpected.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Collected</p>
            <p className="text-2xl font-semibold text-green-700">KES {totalCollected.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Outstanding</p>
            <p className="text-2xl font-semibold text-amber-600">KES {outstanding.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Zero payment</p>
            <p className="text-2xl font-semibold text-red-600">{zeroPayment}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">Recent Payments</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="p-3">Time</th>
                <th className="p-3">From</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Matched to</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400">No payments yet. Upload an MPESA statement to get started.</td></tr>
              )}
              {recentPayments.map(payment => (
                <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 text-gray-500">{new Date(payment.paidAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-3">{payment.senderName || '—'}</td>
                  <td className="p-3 font-medium">KES {payment.amount.toLocaleString()}</td>
                  <td className="p-3">{payment.student ? payment.student.name + ' · ' + payment.student.class : '—'}</td>
                  <td className="p-3">
                    <span className={'text-xs px-2 py-1 rounded-full font-medium ' + (payment.matched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
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