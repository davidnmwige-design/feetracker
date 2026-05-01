import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const school = await prisma.school.create({
    data: {
      name: body.name,
      paybill: body.paybill,
      term: body.term
    }
  })
  return NextResponse.json(school)
}

export async function GET() {
  const schools = await prisma.school.findMany()
  return NextResponse.json(schools)
}