import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schools = await prisma.school.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { students: true, invoices: true, payments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = schools.map(s => {
    const steps = {
      accountCreated: true,
      studentsUploaded: s._count.students > 0,
      paybillConfigured: !!s.paybill,
      invoiceSent: s._count.invoices > 0,
      statementUploaded: s._count.payments > 0,
    }
    const completedSteps = Object.values(steps).filter(Boolean).length
    return { ...s, steps, completedSteps, totalSteps: 5 }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  // Send onboarding reminder to a specific school
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await req.json()
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { students: true, invoices: true, payments: true } },
    },
  })
  if (!school?.user?.email) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const steps: { label: string; done: boolean; tip: string }[] = [
    { label: 'Upload your student list', done: school._count.students > 0, tip: 'Go to Students → Upload a CSV with your student names and admission numbers.' },
    { label: 'Add your MPESA Paybill number', done: !!school.paybill, tip: 'Go to Settings → School Details → add your paybill number so parents know where to pay.' },
    { label: 'Send your first invoice', done: school._count.invoices > 0, tip: 'Go to Invoices → select a student → click Send Invoice to email it to parents.' },
    { label: 'Upload a bank statement', done: school._count.payments > 0, tip: 'Go to Upload → upload your latest MPESA statement to automatically match payments.' },
  ]
  const missing = steps.filter(s => !s.done)
  if (missing.length === 0) {
    return NextResponse.json({ error: 'School is fully set up' }, { status: 400 })
  }

  const missingList = missing.map(s => `<li style="margin-bottom:10px"><strong>${s.label}</strong><br><span style="color:#64748b;font-size:13px">${s.tip}</span></li>`).join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#0a1f4e;padding:20px 24px">
        <h1 style="color:#c8a84b;font-size:18px;margin:0;font-family:Georgia,serif"><span style="color:#fff">Elimu</span> Pay</h1>
        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px">Setup reminder</p>
      </div>
      <div style="padding:28px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:16px;margin:0 0 10px">Hi ${school.user.name}, you're almost ready!</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
          You've created your Elimu Pay account — great start! Here's what's left to complete your setup so you can start collecting fees efficiently:
        </p>
        <ul style="padding-left:20px;margin:0 0 20px">${missingList}</ul>
        <a href="https://elimupay.co.ke/dashboard" style="display:inline-block;background:#c8a84b;color:#0a1f4e;padding:12px 24px;border-radius:6px;font-weight:700;text-decoration:none;font-size:14px">
          Complete your setup →
        </a>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay &middot; support@elimupay.co.ke</p>
      </div>
    </div>
  `

  await sendEmail({ to: school.user.email, subject: `${school.user.name}, complete your Elimu Pay setup`, html })
  return NextResponse.json({ success: true })
}
