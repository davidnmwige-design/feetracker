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

export interface EmailOptions {
  to: string
  subject: string
  html: string
  pdfBase64?: string
  pdfFilename?: string
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[DEV] Email not configured. Would send to:', opts.to, '| Subject:', opts.subject)
    return
  }
  const transporter = createTransporter()
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"FeeTracker" <${process.env.EMAIL_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  }
  if (opts.pdfBase64) {
    mailOptions.attachments = [{
      filename: opts.pdfFilename || 'certificate.pdf',
      content: Buffer.from(opts.pdfBase64, 'base64'),
      contentType: 'application/pdf',
    }]
  }
  await transporter.sendMail(mailOptions)
}

export function paymentConfirmationHtml({
  schoolName,
  parentName,
  studentName,
  studentClass,
  amount,
  balance,
}: {
  schoolName: string
  parentName: string
  studentName: string
  studentClass: string
  amount: number
  balance: number
}): string {
  const balanceColor = balance > 0 ? '#e24b4a' : '#0a7c3e'
  const balanceText = balance <= 0
    ? 'KES 0 — Fully Cleared'
    : `KES ${balance.toLocaleString()}`

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${schoolName}</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin-bottom:8px">Payment Received</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px">
          Dear ${parentName},<br>we have received a fee payment for ${studentName} (${studentClass}).
        </p>
        <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:13px">Student</td>
              <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${studentName}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Amount Paid</td>
              <td style="text-align:right;font-weight:700;color:#0a1f4e;font-size:15px">KES ${amount.toLocaleString()}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Outstanding Balance</td>
              <td style="text-align:right;font-weight:700;color:${balanceColor};font-size:13px">${balanceText}</td>
            </tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">
          Thank you for your payment. Please retain this message for your records.
        </p>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
      </div>
    </div>
  `
}
