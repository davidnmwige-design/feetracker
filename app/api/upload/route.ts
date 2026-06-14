import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sendEmail, paymentConfirmationHtml } from '@/lib/email'
import { decrypt } from '@/lib/encrypt'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import * as XLSX from 'xlsx'
import { parseJsonRows, parseTextStatement, matchTransactions } from '@/lib/statementParser'
import { normalizePhoneForWhatsApp } from '@/lib/phoneUtils'
import { buildReceiptWhatsAppUrl } from '@/lib/whatsappMessages'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    if (!hasPermission(ctx.role, 'upload', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const schoolId = ctx.school.id
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file || !/\.(xlsx|xls|csv|pdf)$/i.test(file.name)) {
      return NextResponse.json({ error: 'Only .xlsx, .xls, .csv, and .pdf files are accepted' }, { status: 400 })
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 4MB. Please split your statement into smaller date ranges.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 4MB.' }, { status: 400 })
    }
    const buffer = Buffer.from(arrayBuffer)
    const students = await prisma.student.findMany({
      where: { schoolId },
      select: { id: true, name: true, admNo: true, parentName: true, parent2Name: true, parentPhone: true },
    })

    // -- Parse the file (with 25s timeout) ---------------------------------
    let parseResult
    try {
      const parsePromise = (async () => {
        if (/\.pdf$/i.test(file.name)) {
          const pdfModule = await import('pdf-parse')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pdfParse = (pdfModule as any).default ?? pdfModule
          const pdfData = await pdfParse(buffer)
          const result = parseTextStatement(pdfData.text)
          if (!result.formatDetected.includes('Bank')) result.formatDetected = 'Bank Statement (PDF)'
          return result
        } else {
          // NOTE: xlsx has known CVEs. File size is limited to 4MB and content is
          // validated before processing. cellFormula/cellHTML disabled to reduce attack surface.
          const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: false, cellHTML: false })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
          return parseJsonRows(rows)
        }
      })()
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Processing timeout')), 25000)
      )
      parseResult = await Promise.race([parsePromise, timeout])
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message === 'Processing timeout') {
        return NextResponse.json({ error: 'Processing took too long. Please try a smaller file or shorter date range.' }, { status: 408 })
      }
      return NextResponse.json({ error: 'Unrecognized file format. Please upload a valid bank or MPESA statement.' }, { status: 400 })
    }

    // -- Match transactions to students ------------------------------------
    const matched = matchTransactions(parseResult.transactions, students)

    // -- Persist payments --------------------------------------------------
    const confidenceCounts = { high: 0, medium: 0, low: 0 }
    let unmatchedCount = 0
    let multipleStudentsCount = 0
    let activityPaymentsCount = 0
    const notifications: { msg: string; phone: string }[] = []

    for (const tx of matched) {
      // Dedup by reference
      if (tx.reference) {
        const existing = await prisma.payment.findFirst({ where: { mpesaRef: tx.reference, schoolId } })
        if (existing) continue
      }

      const isAutoMatched = tx.confidence === 'high' || tx.confidence === 'medium'
      const studentId = isAutoMatched ? tx.matchedStudentId : undefined

      // Build WhatsApp receipt link for matched payments
      let whatsappReceiptLink: string | null = null
      if (isAutoMatched && studentId) {
        const matchedStudent = students.find(s => s.id === studentId)
        if (matchedStudent?.parentPhone) {
          const totalPaidSoFar = await prisma.payment.aggregate({
            where: { studentId, matched: true },
            _sum: { amount: true },
          })
          const paidBefore = totalPaidSoFar._sum.amount ?? 0
          const fullStudent = await prisma.student.findUnique({ where: { id: studentId } })
          const balance = Math.max(0, (fullStudent?.feeRequired ?? 0) - paidBefore - tx.amount)
          whatsappReceiptLink = buildReceiptWhatsAppUrl(matchedStudent.parentPhone, {
            parentName: matchedStudent.parentName || 'Parent',
            studentName: fullStudent?.name || matchedStudent.name,
            studentClass: `${fullStudent?.class || ''} ${fullStudent?.stream || ''}`.trim(),
            amount: tx.amount,
            balance,
            schoolName: ctx.school.name,
            paybill: ctx.school.paybill,
            accountNumberFormat: ctx.school.accountNumberFormat,
            term: ctx.school.currentTerm,
          })
        }
      }

      await prisma.payment.create({
        data: {
          mpesaRef: tx.reference || null,
          amount: tx.amount,
          senderName: tx.senderName || tx.rawDescription || '',
          senderPhone: '',
          matched: isAutoMatched && !!studentId,
          studentId: studentId ?? null,
          schoolId,
          source: 'upload',
          matchConfidence: tx.confidence,
          paymentType: tx.analysis.type,
          originalDescription: tx.rawDescription || null,
          suggestedStudents: tx.suggestedStudents ? JSON.stringify(tx.suggestedStudents) : null,
          notes: tx.notes || null,
          whatsappReceiptLink,
        },
      })

      const type = tx.analysis.type
      if (type === 'multiple_students') {
        multipleStudentsCount++
      } else if (type === 'kits_activity') {
        activityPaymentsCount++
      } else if (tx.confidence === 'high') {
        confidenceCounts.high++
      } else if (tx.confidence === 'medium') {
        confidenceCounts.medium++
      } else if (tx.confidence === 'low') {
        confidenceCounts.low++
      } else {
        unmatchedCount++
      }

      // Send email/WhatsApp notification for auto-matched payments
      if (isAutoMatched && studentId) {
        const student = students.find(s => s.id === studentId)
        if (student) {
          const totalPaid = await prisma.payment.aggregate({
            where: { studentId },
            _sum: { amount: true },
          })
          const paid = (totalPaid._sum.amount || 0) + tx.amount
          const fullStudent = await prisma.student.findUnique({ where: { id: studentId } })
          const balance = (fullStudent?.feeRequired || 0) - paid

          const msg = `Dear ${student.parentName || 'Parent'}, we have received KES ${tx.amount.toLocaleString()} for ${fullStudent?.name || ''}, ${fullStudent?.class || ''}. Outstanding balance: KES ${Math.max(0, balance).toLocaleString()}. Thank you. - ${ctx.school.name}`
          const phone = student.parentPhone
            ? normalizePhoneForWhatsApp(student.parentPhone)
            : ''
          notifications.push({ msg, phone })

          if (fullStudent) {
            const parentEmail = fullStudent.parentEmail ? decrypt(fullStudent.parentEmail) : null
            if (parentEmail) {
              const hasFeeBreakdown = fullStudent.tuitionFee > 0 || fullStudent.sportsFee > 0 || fullStudent.clubsFee > 0 || fullStudent.otherFee > 0
              sendEmail({
                to: parentEmail,
                subject: `Payment received for ${fullStudent.name} — ${ctx.school.name}`,
                fromName: `${ctx.school.name} via Elimu Pay`,
                replyTo: ctx.school.replyToEmail || undefined,
                html: paymentConfirmationHtml({
                  schoolName: ctx.school.name,
                  parentName: student.parentName || 'Parent',
                  studentName: fullStudent.name,
                  studentClass: `${fullStudent.class} ${fullStudent.stream || ''}`.trim(),
                  amount: tx.amount,
                  balance: Math.max(0, balance),
                  breakdown: hasFeeBreakdown ? {
                    tuitionFee: fullStudent.tuitionFee,
                    sportsFee: fullStudent.sportsFee,
                    clubsFee: fullStudent.clubsFee,
                    otherFee: fullStudent.otherFee,
                    totalFee: fullStudent.feeRequired,
                  } : undefined,
                  paybill: ctx.school.paybill,
                  accountNumberFormat: ctx.school.accountNumberFormat,
                }),
              }).catch(err => console.error('Payment email failed:', err))
            }
          }
        }
      }
    }

    const needsReview = confidenceCounts.low + unmatchedCount

    await logAudit({
      userId: ctx.userId, schoolId, action: 'MPESA_UPLOAD',
      details: `${parseResult.formatDetected} | ${confidenceCounts.high} high, ${confidenceCounts.medium} medium, ${needsReview} need review, ${multipleStudentsCount} multi-student, ${activityPaymentsCount} activity`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      formatDetected: parseResult.formatDetected,
      totalRows: parseResult.totalRows,
      skippedRows: parseResult.skippedRows,
      processedRows: parseResult.processedRows,
      matched: confidenceCounts.high + confidenceCounts.medium,
      unmatched: needsReview,
      multipleStudents: multipleStudentsCount,
      activityPayments: activityPaymentsCount,
      confidence: confidenceCounts,
      total: parseResult.processedRows,
      notifications,
    })
  } catch (err) {
    console.error('upload error:', err)
    return NextResponse.json({ error: 'Something went wrong processing your file.' }, { status: 500 })
  }
}
