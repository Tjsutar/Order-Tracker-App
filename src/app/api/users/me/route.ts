import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  companyName: z.string().max(100).optional().nullable(),
  emailNotifications: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
    }

    const { name, companyName, emailNotifications } = parsed.data

    const userId = (session.user as any).id

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        companyName,
        emailNotifications
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        emailNotifications: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
