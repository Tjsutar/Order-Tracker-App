import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, props: { params: Promise<{ token: string }> | { token: string } }) {
  try {
    const params = await props.params
    const demo = await prisma.demoDevice.findUnique({
      where: { linkToken: params.token }
    })

    if (!demo) {
      return NextResponse.json({ error: 'Demo link not found or expired' }, { status: 404 })
    }

    // Update status to VIEWED if it was just SENT
    if (demo.status === 'SENT') {
      await prisma.demoDevice.update({
        where: { id: demo.id },
        data: { status: 'VIEWED' }
      })
    }

    return NextResponse.json(demo)
  } catch (error) {
    console.error('Error fetching public demo:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
