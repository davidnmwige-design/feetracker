import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true }
  })

  if (!user?.school) return NextResponse.json([])

  const students = await prisma.student.findMany({
    where: { schoolId: user.school.id },
    include: { payments: true },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(students)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true }
  })

  if (!user?.school) {
    return NextResponse.json({ error: 'No school found' }, { status: 400 })
  }

  const schoolId = user.school.id
  const formData = await req.formData()
  const file = formData.get('file') as File

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as any[]

  const created = []
  for (const row of rows) {
    const admNo = String(row['Adm No'] || row['admNo'] || row['ADM NO'])
    const student = await prisma.student.upsert({
      where: { admNo_schoolId: { admNo, schoolId } },
      update: {},
      create: {
        name: row['Name'] || row['name'] || row['NAME'],
        admNo,
        class: row['Class'] || row['class'] || row['CLASS'],
        stream: row['Stream'] || row['stream'] || '',
        parentName: row['Parent Name'] || row['parentName'] || '',
        parentPhone: String(row['Parent Phone'] || row['parentPhone'] || ''),
        feeRequired: Number(row['Fee Required'] || row['feeRequired'] || 0),
        schoolId
      }
    })
    created.push(student)
  }

  return NextResponse.json({ count: created.length })
}