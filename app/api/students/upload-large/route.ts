import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sanitizeName } from '@/lib/sanitize'
import { encrypt } from '@/lib/encrypt'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { hashPhone } from '@/lib/phoneHash'
import * as XLSX from 'xlsx'

// NOTE: xlsx has known CVEs but is kept for reading uploaded files only.
// File size is limited to 10MB and content is validated before processing.

function send(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(payload))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })
  if (!hasPermission(ctx.role, 'students', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file || !/\.(xlsx|xls|csv)$/i.test(file.name)) {
    return NextResponse.json({ error: 'Only .xlsx, .xls, and .csv files are accepted' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()

  let workbook: ReturnType<typeof XLSX.read>
  try {
    workbook = XLSX.read(buffer, { type: 'array', cellFormula: false, cellHTML: false })
  } catch {
    return NextResponse.json({ error: 'Could not read file. Please check the format.' }, { status: 400 })
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as any[]

  const schoolId = ctx.school.id
  const [schoolWithCount, userRecord] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { trialEndsAt: true, _count: { select: { students: true } } },
    }),
    prisma.user.findUnique({ where: { email: session.user.email }, select: { isAdmin: true } }),
  ])
  const currentCount = schoolWithCount?._count?.students ?? 0
  const TRIAL_LIMIT = 50
  const isOnTrial = !!schoolWithCount?.trialEndsAt

  if (!userRecord?.isAdmin && isOnTrial && currentCount + rows.length > TRIAL_LIMIT) {
    return NextResponse.json({
      error: 'trial_limit_reached',
      message: `Your free trial supports up to ${TRIAL_LIMIT} students. You currently have ${currentCount} students and this file contains ${rows.length} rows, which would exceed your trial limit. Contact us at support@elimupay.co.ke or WhatsApp +254 746 353 411 to activate your paid account.`,
      currentCount,
      trialLimit: TRIAL_LIMIT,
    }, { status: 403 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      send(controller, 'start', { total: rows.length })

      let created = 0
      let failed = 0

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
          const admNo = String(row['Adm No'] || row['admNo'] || row['ADM NO'] || '')
          const tuitionFee = Number(row['Tuition Fee'] || row['tuitionFee'] || row['Tuition'] || 0)
          const sportsFee = Number(row['Sports Fee'] || row['sportsFee'] || row['Sports'] || 0)
          const clubsFee = Number(row['Clubs Fee'] || row['clubsFee'] || row['Clubs'] || 0)
          const otherFee = Number(row['Other Fee'] || row['otherFee'] || row['Other'] || 0)
          const feeBreakdownTotal = tuitionFee + sportsFee + clubsFee + otherFee
          const feeRequired = feeBreakdownTotal > 0
            ? feeBreakdownTotal
            : Number(row['Fee Required'] || row['feeRequired'] || 0)

          const parentEmail = String(row['Parent Email'] || row['parentEmail'] || row['parent_email'] || '')
          const parent2Email = String(row['Parent 2 Email'] || row['parent2Email'] || '')
          const encryptedEmail = parentEmail ? encrypt(parentEmail) : null
          const encryptedEmail2 = parent2Email ? encrypt(parent2Email) : null
          const rawPhone = String(row['Parent Phone'] || row['parentPhone'] || '')
          const rawPhone2 = String(row['Parent 2 Phone'] || row['parent2Phone'] || '') || null

          await prisma.student.upsert({
            where: { admNo_schoolId: { admNo, schoolId } },
            update: {
              tuitionFee, sportsFee, clubsFee, otherFee, feeRequired,
              ...(encryptedEmail ? { parentEmail: encryptedEmail } : {}),
              parent2Name: sanitizeName(String(row['Parent 2 Name'] || row['parent2Name'] || '')) || null,
              parent2Phone: rawPhone2,
              parent2PhoneHash: hashPhone(rawPhone2),
              ...(encryptedEmail2 ? { parent2Email: encryptedEmail2 } : {}),
            },
            create: {
              name: sanitizeName(String(row['Name'] || row['name'] || row['NAME'] || '')),
              admNo,
              class: sanitizeName(String(row['Class'] || row['class'] || row['CLASS'] || '')),
              stream: sanitizeName(String(row['Stream'] || row['stream'] || '')),
              parentName: sanitizeName(String(row['Parent Name'] || row['parentName'] || '')),
              parentPhone: rawPhone,
              parentPhoneHash: hashPhone(rawPhone),
              parentEmail: encryptedEmail,
              parent2Name: sanitizeName(String(row['Parent 2 Name'] || row['parent2Name'] || '')) || null,
              parent2Phone: rawPhone2,
              parent2PhoneHash: hashPhone(rawPhone2),
              parent2Email: encryptedEmail2,
              feeRequired, tuitionFee, sportsFee, clubsFee, otherFee, schoolId,
            }
          })
          created++
        } catch {
          failed++
        }

        // Emit progress every 10 rows
        if ((i + 1) % 10 === 0 || i === rows.length - 1) {
          send(controller, 'progress', { done: i + 1, total: rows.length, created, failed })
        }
      }

      await logAudit({
        userId: ctx.userId, schoolId, action: 'STUDENT_IMPORT',
        details: `${created} students imported via SSE (${failed} failed)`,
      })

      send(controller, 'done', { created, failed, total: rows.length })
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
