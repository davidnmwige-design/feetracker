import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const students = await prisma.student.findMany({
    include: { payments: true },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(students)
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const schoolId = Number(formData.get('schoolId'))

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as any[]

  const created = []
  for (const row of rows) {
    const student = await prisma.student.upsert({
      where: { admNo: String(row['Adm No'] || row['admNo'] || row['ADM NO']) },
      update: {},
      create: {
        name: row['Name'] || row['name'] || row['NAME'],
        admNo: String(row['Adm No'] || row['admNo'] || row['ADM NO']),
        class: row['Class'] || row['class'] || row['CLASS'],
        stream: row['Stream'] || row['stream'] || '',
        parentName: row['Parent Name'] || row['parentName'] || '',
        parentPhone: String(row['Parent Phone'] || row['parentPhone'] || ''),
        feeRequired: Number(row['Fee Required'] || row['feeRequired'] || 0),
        schoolId: schoolId
      }
    })
    created.push(student)
  }

  return NextResponse.json({ count: created.length })
}