// Stress-test seed — LOCAL ONLY. Loads large + edge-case data into the dev database.
// Run: DATABASE_URL="postgresql://postgres:feetracker_dev@localhost:5433/feetracker" node scripts/stress-seed.mjs
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const PW = bcrypt.hashSync('StressTest1A', 10)
const future = new Date('2027-06-01')
const now = new Date()
const t0 = Date.now()

async function wipe() {
  // delete in FK-safe order
  for (const m of [
    'studentExamFee','examFee','studentDiscount','feeDiscount','bursary','feeCategory',
    'invoice','payment','academicYear','term','reminderSchedule','billingRecord',
    'planUpgradeRequest','schoolNote','testimonial','contract','student','schoolUser',
    'school','oTPCode','passwordReset','auditLog','adminAnnouncement','user',
  ]) {
    await prisma[m].deleteMany()
  }
}

async function main() {
  console.log('Wiping…'); await wipe()

  // ---- Staff school + owner (login: staff@stress.local / StressTest1A) ----
  const owner = await prisma.user.create({ data: { name: 'Stress Owner', email: 'staff@stress.local', password: PW } })
  const school = await prisma.school.create({ data: {
    name: 'Stress Test Academy', userId: owner.id, paybill: '555001', currentPlan: 'Enterprise',
    currentTerm: 'Term 1 2026', trialEndsAt: future, accountNumberFormat: 'ADM#',
    whatsappNumber: '254700000000', replyToEmail: 'fees@stress.local',
  }})

  // ---- 5,000 students + 3 edge-case rows ----
  const classes = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8']
  const streams = ['A','B','C','D']
  const students = []
  for (let i = 1; i <= 5000; i++) students.push({
    name: `Student ${i} Mwangi`, admNo: `ADM${1000 + i}`,
    class: classes[i % classes.length], stream: streams[i % streams.length],
    parentName: `Parent ${i}`, parentPhone: `2547${String(10000000 + i).slice(-8)}`,
    parentEmail: `parent${i}@example.com`,
    feeRequired: 50000, tuitionFee: 40000, sportsFee: 5000, clubsFee: 3000, otherFee: 2000,
    schoolId: school.id,
  })
  students.push({ name: 'X'.repeat(10000), admNo: 'ADMEDGE1', class: 'Grade 1', stream: 'A', parentName: 'Very Long Name', parentPhone: '254700999001', parentEmail: 'edge1@example.com', feeRequired: 50000, schoolId: school.id })
  students.push({ name: "=cmd|'/c calc'!A1", admNo: 'ADMEDGE2', class: 'Grade 1', stream: 'A', parentName: '=2+5+cmd', parentPhone: '254700999002', parentEmail: 'edge2@example.com', feeRequired: 50000, schoolId: school.id })
  students.push({ name: 'Ctrl Char Name', admNo: 'ADMEDGE3', class: 'Grade 1', stream: 'A', parentName: 'Ctrl Parent', parentPhone: '254700999003', parentEmail: 'edge3@example.com', feeRequired: -99999, schoolId: school.id })
  for (let i = 0; i < students.length; i += 1000) await prisma.student.createMany({ data: students.slice(i, i + 1000) })
  const studs = await prisma.student.findMany({ where: { schoolId: school.id }, select: { id: true }, orderBy: { id: 'asc' }, take: 3000 })

  // ---- Payments: 2,000 matched + 1,000 unmatched ----
  const payments = []
  for (let i = 0; i < 2000; i++) payments.push({ amount: 10000 + (i % 5) * 5000, mpesaRef: `REF${100000 + i}`, senderName: `Parent ${i + 1}`, matched: true, studentId: studs[i].id, schoolId: school.id, source: 'upload' })
  for (let i = 0; i < 1000; i++) payments.push({ amount: 7500, mpesaRef: `UNM${200000 + i}`, senderName: `Unknown Sender ${i}`, matched: false, studentId: null, schoolId: school.id, source: 'daraja' })
  for (let i = 0; i < payments.length; i += 1000) await prisma.payment.createMany({ data: payments.slice(i, i + 1000) })

  // ---- Terms (incl. duplicates) ----
  await prisma.term.createMany({ data: [
    ...Array.from({ length: 10 }, (_, i) => ({ name: `Term ${(i % 3) + 1} ${2024 + Math.floor(i / 3)}`, schoolId: school.id })),
    { name: 'Term 1 2026', schoolId: school.id }, { name: 'Term 1 2026', schoolId: school.id },
  ]})

  // ---- Academic years (incl. invalid date order) ----
  for (let y = 2020; y <= 2025; y++) await prisma.academicYear.create({ data: { schoolId: school.id, year: y, isActive: y === 2025,
    term1Start: new Date(`${y}-01-10`), term1End: new Date(`${y}-04-01`), term2Start: new Date(`${y}-05-01`), term2End: new Date(`${y}-08-01`), term3Start: new Date(`${y}-09-01`), term3End: new Date(`${y}-12-01`) } })
  await prisma.academicYear.create({ data: { schoolId: school.id, year: 2099, term1Start: new Date('2099-12-01'), term1End: new Date('2099-01-01') } })

  // ---- Invoices for first 2,000 students ----
  const invoices = studs.slice(0, 2000).map((s, i) => ({ studentId: s.id, schoolId: school.id, term: 'Term 1 2026', status: ['draft','sent','paid','overdue'][i % 4], amount: 50000, breakdown: { tuitionFee: 40000, sportsFee: 5000, clubsFee: 3000, otherFee: 2000, totalFee: 50000 } }))
  for (let i = 0; i < invoices.length; i += 1000) await prisma.invoice.createMany({ data: invoices.slice(i, i + 1000) })

  // ---- Bursaries + a school discount applied to 200 students ----
  for (let i = 0; i < 50; i++) await prisma.bursary.create({ data: { studentId: studs[i].id, type: 'scholarship', discountType: i % 2 ? 'percentage' : 'fixed', discountValue: i % 2 ? 25 : 10000, active: true } })
  const disc = await prisma.feeDiscount.create({ data: { schoolId: school.id, name: 'Sibling Discount', discountType: 'percentage', discountValue: 10, isSiblingDiscount: true } })
  await prisma.studentDiscount.createMany({ data: studs.slice(100, 300).map(s => ({ studentId: s.id, discountId: disc.id })) })
  await prisma.reminderSchedule.create({ data: { schoolId: school.id, enabled: true, frequency: 'weekly', dayOfWeek: 1, time: '08:00' } })

  // ---- Audit logs (2,000) ----
  const logs = Array.from({ length: 2000 }, (_, i) => ({ schoolId: school.id, userId: owner.id, action: ['LOGIN_SUCCESS','MPESA_UPLOAD','STUDENT_DELETED','INVOICE_SENT'][i % 4], details: `Action ${i}`, ipAddress: '127.0.0.1' }))
  for (let i = 0; i < logs.length; i += 1000) await prisma.auditLog.createMany({ data: logs.slice(i, i + 1000) })

  // ---- Admin user + 600 demo schools (for admin-side stress) ----
  await prisma.user.create({ data: { name: 'Stress Admin', email: 'admin@stress.local', password: PW, isAdmin: true } })
  await prisma.platformSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  const N = 600
  for (let i = 0; i < N; i += 500) await prisma.user.createMany({ data: Array.from({ length: Math.min(500, N - i) }, (_, k) => ({ name: `School Owner ${i + k}`, email: `owner${i + k}@schools.local`, password: PW })) })
  const ownerUsers = await prisma.user.findMany({ where: { email: { startsWith: 'owner' } }, select: { id: true }, orderBy: { id: 'asc' } })
  const plans = ['Starter','Growth','Premium','Enterprise']
  const schoolRows = ownerUsers.map((u, i) => ({ name: `Demo School ${i}`, userId: u.id, currentPlan: plans[i % plans.length], paybill: null, trialEndsAt: i % 3 === 0 ? new Date(now.getTime() - 86400000 * 5) : new Date(now.getTime() + 86400000 * 20) }))
  for (let i = 0; i < schoolRows.length; i += 500) await prisma.school.createMany({ data: schoolRows.slice(i, i + 500) })
  const demoSchools = await prisma.school.findMany({ where: { name: { startsWith: 'Demo School' } }, select: { id: true } })
  await prisma.billingRecord.createMany({ data: demoSchools.map((s, i) => ({ schoolId: s.id, month: 1, year: 2026, amount: 20000, isPaid: i % 2 === 0 })) })
  await prisma.planUpgradeRequest.createMany({ data: demoSchools.slice(0, 30).map(s => ({ schoolId: s.id, currentPlan: 'Starter', requestedPlan: 'Growth', status: 'pending' })) })

  // ---- Summary ----
  const [sc, st, pm, iv, schoolCount] = await Promise.all([
    prisma.student.count({ where: { schoolId: school.id } }), prisma.student.count(),
    prisma.payment.count(), prisma.invoice.count(), prisma.school.count(),
  ])
  console.log(JSON.stringify({ staffSchoolStudents: sc, totalStudents: st, payments: pm, invoices: iv, totalSchools: schoolCount, seconds: Math.round((Date.now() - t0) / 1000) }, null, 2))
  console.log('Staff login: staff@stress.local / StressTest1A   Admin: admin@stress.local / StressTest1A')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
