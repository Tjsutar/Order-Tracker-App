import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const customerId = searchParams.get('customerId')

  try {
    let pos
    if (role === 'CUSTOMER' && customerId) {
      pos = await prisma.purchaseOrder.findMany({
        where: { customerId },
        include: { shipments: true },
        orderBy: { uploadDate: 'desc' }
      })
    } else {
      // VENDOR or ADMIN can see all POs
      pos = await prisma.purchaseOrder.findMany({
        include: { 
          shipments: true,
          customer: true
        },
        orderBy: { uploadDate: 'desc' }
      })
    }
    return NextResponse.json(pos)
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
    
    // Auto-create mock customer for MVP if they don't exist
    let customer = await prisma.user.findUnique({ where: { id: customerId } })
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          id: customerId,
          name: 'Mock Customer',
          email: 'customer@example.com',
          role: 'CUSTOMER'
        }
      })
    }

    // Prepare OneDrive path (defaults to a 'Shared_POs' folder in the user's home directory if OneDrive isn't found)
    const homeDir = os.homedir()
    const onedrivePath = process.env.ONEDRIVE_PATH || path.join(homeDir, 'OneDrive', 'Shared_POs')
    
    try {
      await mkdir(onedrivePath, { recursive: true })
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

    const filePath = path.join(onedrivePath, filename)
    
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
