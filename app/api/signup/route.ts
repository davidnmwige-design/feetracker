import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const name = sanitize(body.name, 100)
    const email = sanitize(body.email, 200).toLowerCase()
    const password = body.password as string
    const schoolName = sanitize(body.schoolName, 200)
    const paybill = sanitize(body.paybill, 50)
    const term = sanitize(body.term, 100)

    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password does not meet requirements' }, { status: 400 })
    }

    if (!name || !email || !schoolName) {
      return NextResponse.json({ error: 'Name, email, and school name are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        school: {
          create: {
            name: schoolName,
            paybill,
            currentTerm: term || 'Term 1 2026',
            trialEndsAt
          }
        }
      }
    })

    const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } })
    if (settings?.notifyNewSchool !== false) {
      const trialEnd = trialEndsAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      sendEmail({
        to: 'davidnmwige@gmail.com',
        subject: `New school signup: ${schoolName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#050f2c;padding:20px 24px">
            <h1 style="font-size:16px;margin:0;font-weight:700;letter-spacing:1px"><span style="color:#fff">ELIMU</span><span style="color:#c8a84b"> PAY</span></h1>
            <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase">New school signup</p>
          </div>
          <div style="padding:24px;background:#fff;border:1px solid #e2e8f0">
            <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 16px">A new school has joined Elimu Pay.</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">School</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${schoolName}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Admin name</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Email</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Paybill</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${paybill || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Trial ends</td><td style="padding:8px 0;font-weight:600;color:#0a1f4e;text-align:right">${trialEnd}</td></tr>
            </table>
          </div>
          <div style="padding:14px 24px;background:#f8f9fc;text-align:center">
            <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay Platform &middot; Admin notification</p>
          </div>
        </div>`
      }).catch(err => console.error('signup notification email error:', err))
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err) {
    console.error('signup error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
