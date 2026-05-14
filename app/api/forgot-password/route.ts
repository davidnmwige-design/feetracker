import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const email = sanitize(body.email, 200).toLowerCase()

    if (!email) return NextResponse.json({ success: true })

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      await prisma.passwordReset.updateMany({
        where: { email, used: false },
        data: { used: true }
      })

      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordReset.create({
        data: { email, token, expiresAt }
      })

      const appUrl = process.env.NEXTAUTH_URL || 'https://feetracker.co.ke'
      const resetUrl = `${appUrl}/reset-password?token=${token}`

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = createTransporter()
          await transporter.sendMail({
            from: `"Elimu Pay" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset your Elimu Pay password',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
                <div style="background:#0a1f4e;padding:24px;text-align:center">
                  <h1 style="margin:0;font-family:Georgia,serif;font-size:22px"><span style="color:#fff">Elimu</span><span style="color:#c8a84b"> Pay</span></h1>
                </div>
                <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
                  <h2 style="color:#0f172a;font-size:18px;margin-bottom:12px">Reset your password</h2>
                  <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:24px">
                    Click the button below to reset your password. This link expires in 1 hour.
                  </p>
                  <a href="${resetUrl}" style="display:inline-block;background:#0a1f4e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px">
                    Reset password
                  </a>
                  <p style="color:#94a3b8;font-size:12px;margin-top:24px">
                    If you didn't request this, ignore this email. Your password won't change.
                  </p>
                  <p style="color:#94a3b8;font-size:12px">
                    Or copy this link: ${resetUrl}
                  </p>
                </div>
                <div style="padding:16px;background:#f8f9fc;text-align:center">
                  <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay &middot; support@feetracker.co.ke</p>
                </div>
              </div>
            `,
          })
        } catch (emailErr) {
          console.error('Failed to send reset email:', emailErr)
        }
      } else {
        // Email not configured — log reset URL for development
        console.log('[DEV] Password reset URL:', resetUrl)
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ success: true })
  }
}
