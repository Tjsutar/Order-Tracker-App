import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const items = await prisma.trashItem.findMany({
      orderBy: { deletedAt: 'desc' }
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching trash:', error)
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 })
  }
}
