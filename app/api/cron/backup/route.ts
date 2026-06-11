import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedCron } from '@/lib/cronAuth'

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = {
      timestamp: new Date().toISOString(),
      schools: await prisma.school.count(),
      users: await prisma.user.count(),
      students: await prisma.student.count(),
      payments: await prisma.payment.count(),
      invoices: await prisma.invoice.count(),
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elimupay.co.ke'
    const emailBody = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#050f2c;padding:20px 24px">
          <h1 style="font-size:16px;margin:0;font-weight:700;letter-spacing:1px;color:#fff">ELIMU PAY</h1>
          <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase">Daily Backup Report</p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e2e8f0">
          <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 16px">Database Health Check — ${new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Schools</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${stats.schools}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Users</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${stats.users}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Students</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${stats.students}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Payments</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${stats.payments}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Invoices</td><td style="padding:8px 0;font-weight:600;color:#0a1f4e;text-align:right">${stats.invoices}</td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#64748b">Database is healthy. Neon automatic backups are active. For manual export, log in to neon.tech.</p>
        </div>
        <div style="padding:14px 24px;background:#f8f9fc;text-align:center">
          <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay Platform · Admin notification</p>
        </div>
      </div>
    `

    await fetch(`${appUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.ADMIN_NOTIFICATION_EMAIL || 'davidnmwige@gmail.com',
        subject: `Elimu Pay Daily Backup Report — ${new Date().toLocaleDateString('en-KE')}`,
        html: emailBody,
      }),
    })

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('backup cron error:', error)
    return NextResponse.json({ error: 'Backup failed', details: String(error) }, { status: 500 })
  }
}
