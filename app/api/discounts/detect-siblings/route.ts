export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const students = await prisma.student.findMany({
    where: { schoolId: ctx.school.id },
    select: { id: true, name: true, class: true, admNo: true, parentPhone: true, parent2Phone: true },
  })

  const phoneMap = new Map<string, typeof students>()

  for (const student of students) {
    for (const phone of [student.parentPhone, student.parent2Phone]) {
      if (!phone || phone.trim() === '') continue
      const normalised = phone.trim().replace(/\s+/g, '')
      if (!phoneMap.has(normalised)) phoneMap.set(normalised, [])
      const existing = phoneMap.get(normalised)!
      if (!existing.find(s => s.id === student.id)) {
        existing.push(student)
      }
    }
  }

  const siblingGroups = []
  for (const [parentPhone, groupStudents] of phoneMap.entries()) {
    if (groupStudents.length >= 2) {
      siblingGroups.push({ parentPhone, students: groupStudents })
    }
  }

  return NextResponse.json({ siblingGroups })
}
