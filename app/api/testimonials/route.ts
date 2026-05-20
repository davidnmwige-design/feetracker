import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const testimonials = await prisma.testimonial.findMany({
    where: { approved: true },
    select: { id: true, quote: true, authorName: true, authorTitle: true, schoolName: true, rating: true, submittedAt: true },
    orderBy: { submittedAt: 'desc' },
  })
  return NextResponse.json(testimonials)
}
