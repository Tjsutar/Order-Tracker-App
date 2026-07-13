import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POStatus, ShipmentStatus } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const customerId = searchParams.get('customerId')

  const cursor = searchParams.get('cursor')
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
  const search = searchParams.get('search')
  const tab = searchParams.get('tab')

  try {
    const queryOptions: any = {
      take: limit,
      skip: cursor ? 1 : 0,
      orderBy: { uploadDate: 'desc' },
      ...(cursor && { cursor: { id: cursor } }),
      include: {
        shipments: true,
        ...(role !== 'CUSTOMER' && { customer: true }),
      },
    }

    if (role === 'CUSTOMER' && customerId) {
      queryOptions.where = { customerId }
    } else {
      queryOptions.where = {}
    }

    if (search) {
      const searchLower = search.toLowerCase()
      const matchingPOStatuses = Object.values(POStatus).filter(s => s.toLowerCase().replace(/_/g, ' ').includes(searchLower)) as POStatus[]
      const matchingShipmentStatuses = Object.values(ShipmentStatus).filter(s => s.toLowerCase().replace(/_/g, ' ').includes(searchLower)) as ShipmentStatus[]

      const orConditions: any[] = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { shipments: { some: { invoicePdf: { contains: search, mode: 'insensitive' } } } },
        { shipments: { some: { podPdf: { contains: search, mode: 'insensitive' } } } }
      ]

      if (!isNaN(parseInt(search))) {
        orConditions.push({ shipments: { some: { shipmentNo: parseInt(search) } } })
      }
      if (matchingPOStatuses.length > 0) {
        orConditions.push({ overallStatus: { in: matchingPOStatuses } })
      }
      if (matchingShipmentStatuses.length > 0) {
        orConditions.push({ shipments: { some: { status: { in: matchingShipmentStatuses } } } })
      }

      queryOptions.where = {
        ...queryOptions.where,
        OR: orConditions
      }
    }

    // Capture base where clause before applying the tab filter for counting
    const baseWhere = { ...queryOptions.where }

    if (tab === 'ACTION_REQUIRED') {
      queryOptions.where.overallStatus = 'ACTION_REQUIRED'
    } else if (tab === 'COMPLETED') {
      queryOptions.where.overallStatus = 'COMPLETED'
    } else if (tab === 'ACTIVE') {
      queryOptions.where.overallStatus = { notIn: ['COMPLETED', 'ACTION_REQUIRED'] }
    }

    const pos = await prisma.purchaseOrder.findMany(queryOptions)
    
    // Fetch counts for tabs
    const [activeCount, actionRequiredCount, completedCount] = await Promise.all([
      prisma.purchaseOrder.count({ where: { ...baseWhere, overallStatus: { notIn: ['COMPLETED', 'ACTION_REQUIRED'] } } }),
      prisma.purchaseOrder.count({ where: { ...baseWhere, overallStatus: 'ACTION_REQUIRED' } }),
      prisma.purchaseOrder.count({ where: { ...baseWhere, overallStatus: 'COMPLETED' } })
    ])
    
    let nextCursor = null
    if (pos.length === limit) {
      nextCursor = pos[pos.length - 1].id
    }

    return NextResponse.json({ 
      pos, 
      nextCursor,
      counts: {
        ACTIVE: activeCount,
        ACTION_REQUIRED: actionRequiredCount,
        COMPLETED: completedCount
      }
    })
  } catch (error) {
    console.error('Error fetching POs:', error)
    return NextResponse.json({ error: 'Failed to fetch POs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const customerId = formData.get('customerId') as string | null

    if (!file || !customerId) {
      return NextResponse.json({ error: 'File and customerId are required' }, { status: 400 })
    }
    // Verify customer exists
    let customer = await prisma.user.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'Selected customer does not exist' }, { status: 400 })
    }

    // Prepare private storage path
    const storagePath = path.join(process.cwd(), 'storage', 'uploads')
    
    try {
      await mkdir(storagePath, { recursive: true })
    } catch (err) {
      console.error('Could not create directory:', err)
      // Fallback to project root if OneDrive folder can't be created due to permissions
    }

    // Process file
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name
    const poNumber = filename.replace(/\.[^/.]+$/, "") // strip extension

    // Check if PO already exists
    const existingPo = await prisma.purchaseOrder.findUnique({
      where: { poNumber }
    })
    
    if (existingPo) {
      return NextResponse.json(
        { error: `Purchase Order '${poNumber}' already exists.` }, 
        { status: 400 }
      )
    }

    const filePath = path.join(storagePath, filename)
    
    // Save file locally to OneDrive folder
    await writeFile(filePath, buffer)

    try {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: poNumber,
          customerId: customerId,
          poFile: filePath,
          overallStatus: 'NEW'
        }
      })
      return NextResponse.json(po, { status: 201 })
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: `Purchase Order '${poNumber}' already exists.` }, 
          { status: 400 }
        )
      }
      throw dbError
    }
  } catch (error) {
    console.error('Error creating PO:', error)
    return NextResponse.json({ error: 'Failed to create PO' }, { status: 500 })
  }
}
