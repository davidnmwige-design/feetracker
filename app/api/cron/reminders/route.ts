import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { decrypt } from '@/lib/encrypt'

function buildWaPhone(phone: string) {
  return '254' + phone.replace(/\s/g, '').replace(/^0/, '').replace(/^254/, '')
}

function buildWaMessage(studentName: string, cls: string, balance: number, schoolName: string, paybill?: string | null, acctFmt?: string | null) {
  let msg = `Dear Parent, this is a reminder that ${studentName} (${cls}) has an outstanding fee balance of KES ${balance.toLocaleString()} for this term. Please make payment at your earliest convenience. Thank you. — ${schoolName}`
  if (paybill) {
    msg += `\nPay via MPESA Paybill: ${paybill}${acctFmt ? ` | Account: ${acctFmt}` : ''} | Amount: KES ${balance.toLocaleString()}`
  }
  return msg
}

function reminderHtml({
  schoolName, parentName, studentName, studentClass, balance, paybill, acctFmt,
}: {
  schoolName: string; parentName: string; studentName: string; studentClass: string
  balance: number; paybill?: string | null; acctFmt?: string | null
}) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
    <div style="background:#0a1f4e;padding:20px 24px;text-align:center">
      <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:20px">${schoolName}</h1>
      <p style="color:#94a3c8;margin:6px 0 0;font-size:11px">POWERED BY FEETRACKER</p>
    </div>
    <div style="padding:28px;background:#fff;border:1px solid #e2e8f0">
      <h2 style="color:#0f172a;font-size:17px;margin:0 0 8px">Fee Payment Reminder</h2>
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 16px">Dear ${parentName}, this is a reminder that <strong>${studentName}</strong> (${studentClass}) has an outstanding fee balance.</p>
      <div style="background:#f8f9fc;border-radius:8px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0">
          <span style="color:#64748b;font-size:13px">Student</span><span style="font-weight:700;color:#0f172a;font-size:13px">${studentName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0">
          <span style="color:#64748b;font-size:13px">Outstanding Balance</span><span style="font-weight:700;color:#e24b4a;font-size:15px">KES ${balance.toLocaleString()}</span>
        </div>
      </div>
      ${paybill ? `<div style="background:#0a1f4e;border-radius:8px;padding:14px 16px">
        <p style="color:#c8a84b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px">How to Pay</p>
        <p style="color:#94a3c8;font-size:12px;margin:0 0 4px">MPESA Paybill: <strong style="color:#c8a84b;font-size:14px">${paybill}</strong></p>
        ${acctFmt ? `<p style="color:#94a3c8;font-size:12px;margin:0 0 4px">Account: ${acctFmt}</p>` : ''}
        <p style="color:#fff;font-size:12px;font-weight:700;margin:0">Amount Due: KES ${balance.toLocaleString()}</p>
      </div>` : ''}
    </div>
    <div style="padding:12px;background:#f8f9fc;text-align:center">
      <p style="color:#94a3b8;font-size:11px;margin:0">${schoolName} &middot; Powered by FeeTracker</p>
    </div>
  </div>`
}

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayDow = now.getDay()
  const todayDom = now.getDate()

  const schedules = await prisma.reminderSchedule.findMany({
    where: { enabled: true },
    include: {
      school: {
        include: {
          students: { include: { payments: true } },
          user: true,
        }
      }
    }
  })

  const results: { schoolId: number; schoolName: string; status: string; detail: string }[] = []

  for (const schedule of schedules) {
    const school = schedule.school

    const isDue = schedule.frequency === 'weekly'
      ? todayDow === schedule.dayOfWeek
      : todayDom === schedule.dayOfMonth

    if (!isDue) {
      results.push({ schoolId: school.id, schoolName: school.name, status: 'skipped', detail: 'not due today' })
      continue
    }

    if (schedule.lastSentAt) {
      const hoursSince = (now.getTime() - schedule.lastSentAt.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 20) {
        results.push({ schoolId: school.id, schoolName: school.name, status: 'skipped', detail: 'sent too recently' })
        continue
      }
    }

    const studentsWithBalance = school.students.filter(s => {
      const paid = s.payments.reduce((sum, p) => sum + p.amount, 0)
      return s.feeRequired - paid > 0
    })

    if (studentsWithBalance.length === 0) {
      results.push({ schoolId: school.id, schoolName: school.name, status: 'skipped', detail: 'no outstanding balances' })
      continue
    }

    // Build per-student data
    type StudentRow = {
      name: string; cls: string; balance: number
      phone: string | null; email: string | null; parentName: string
      waPhone: string; waMsg: string; waLink: string
    }
    const rows: StudentRow[] = studentsWithBalance.map(s => {
      const paid = s.payments.reduce((sum, p) => sum + p.amount, 0)
      const balance = s.feeRequired - paid
      const cls = `${s.class}${s.stream ? ' ' + s.stream : ''}`
      const waMsg = buildWaMessage(s.name, cls, balance, school.name, school.paybill, school.accountNumberFormat)
      const waPhone = s.parentPhone ? buildWaPhone(s.parentPhone) : ''
      return {
        name: s.name, cls, balance,
        phone: s.parentPhone || null,
        email: s.parentEmail ? decrypt(s.parentEmail) : null,
        parentName: s.parentName || 'Parent',
        waPhone, waMsg,
        waLink: waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}` : '',
      }
    })

    // 1. Send summary email to school admin with WA links
    const adminEmail = school.user.email
    const adminRows = rows.map((r, i) => `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#0f172a">${r.name}</td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b">${r.cls}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#e24b4a">KES ${r.balance.toLocaleString()}</td>
        <td style="padding:10px 12px">
          ${r.waLink
            ? `<a href="${r.waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:5px 12px;border-radius:5px;font-size:11px;font-weight:700;text-decoration:none">Send WhatsApp</a>`
            : '<span style="font-size:11px;color:#94a3b8">No phone</span>'
          }
        </td>
      </tr>`).join('')

    const adminHtml = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <div style="background:#050f2c;padding:20px 24px">
        <h1 style="color:#c8a84b;font-size:16px;margin:0;font-weight:700">FEETRACKER</h1>
        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase">Scheduled reminder time</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="font-size:16px;color:#0f172a;margin:0 0 6px">Your scheduled reminder time has arrived</h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 20px">${school.name} has <strong>${rows.length} student${rows.length !== 1 ? 's' : ''}</strong> with outstanding balances. Click the WhatsApp links below to send each reminder from your phone. Make sure you are logged into your school WhatsApp account first.</p>
        <div style="background:#fef9ec;border:1px solid #f0d878;border-radius:6px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#92681a">
          <strong>Note:</strong> Messages will be sent from your phone's WhatsApp. Log into your school WhatsApp account before clicking the links.
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:420px">
            <thead>
              <tr style="background:#f8f9fc;border-bottom:2px solid #e2e8f0">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Student</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Class</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Balance</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Action</th>
              </tr>
            </thead>
            <tbody>${adminRows}</tbody>
          </table>
        </div>
      </div>
      <div style="padding:14px 24px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; ${school.name}</p>
      </div>
    </div>`

    let adminEmailSent = false
    try {
      await sendEmail({
        to: adminEmail,
        subject: `Scheduled reminder time — ${rows.length} students need reminders · ${school.name}`,
        html: adminHtml,
        fromName: 'FeeTracker',
      })
      adminEmailSent = true
    } catch (err) {
      console.error(`[cron] Admin email failed for school ${school.id}:`, err)
    }

    // 2. Send bulk email reminders directly to parents who have email addresses
    let parentEmailsSent = 0
    const parentEmailStudents = rows.filter(r => r.email)
    for (const r of parentEmailStudents) {
      try {
        await sendEmail({
          to: r.email!,
          subject: `Fee payment reminder — ${r.name} — ${school.name}`,
          fromName: `${school.name} via FeeTracker`,
          replyTo: (school as any).replyToEmail || undefined,
          html: reminderHtml({
            schoolName: school.name,
            parentName: r.parentName,
            studentName: r.name,
            studentClass: r.cls,
            balance: r.balance,
            paybill: school.paybill,
            acctFmt: school.accountNumberFormat,
          }),
        })
        parentEmailsSent++
      } catch (err) {
        console.error(`[cron] Parent email failed for student ${r.name}:`, err)
      }
    }

    // 3. Update lastSentAt
    await prisma.reminderSchedule.update({
      where: { id: schedule.id },
      data: { lastSentAt: now },
    })

    const detail = `admin email ${adminEmailSent ? 'sent' : 'failed'}, ${parentEmailsSent}/${parentEmailStudents.length} parent emails sent, ${rows.filter(r => r.waLink).length} WA links in admin email`
    results.push({ schoolId: school.id, schoolName: school.name, status: 'processed', detail })
    console.log(`[cron] School ${school.id} (${school.name}): ${detail}`)
  }

  return NextResponse.json({ ok: true, processed: results.length, results, timestamp: now.toISOString() })
}
