import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

export async function GET(request: Request) {
  try {
    const demos = await prisma.demoDevice.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(demos)
  } catch (error) {
    console.error('Error fetching demo devices:', error)
    return NextResponse.json({ error: 'Failed to fetch demo devices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const customerEmail = formData.get('customerEmail') as string | null
    const dcFile = formData.get('dcFile') as File | null
    const podFile = formData.get('podFile') as File | null

    if (!customerEmail || !dcFile || !podFile) {
      return NextResponse.json({ error: 'Email, DC, and POD are required' }, { status: 400 })
    }

    const homeDir = os.homedir()
    const onedrivePath = process.env.ONEDRIVE_PATH || path.join(homeDir, 'OneDrive', 'Shared_POs', 'Demos')
    
    try {
      await mkdir(onedrivePath, { recursive: true })
    } catch (err) {
      console.error('Could not create directory:', err)
    }

    const dcBuffer = Buffer.from(await dcFile.arrayBuffer())
    const podBuffer = Buffer.from(await podFile.arrayBuffer())

    // Ensure unique filenames to avoid collision
    const dcFilename = `DC_${Date.now()}_${dcFile.name}`
    const podFilename = `POD_${Date.now()}_${podFile.name}`
    
    const dcPath = path.join(onedrivePath, dcFilename)
    const podPath = path.join(onedrivePath, podFilename)

    await writeFile(dcPath, dcBuffer)
    await writeFile(podPath, podBuffer)

    const linkToken = crypto.randomUUID()

    const demo = await prisma.demoDevice.create({
      data: {
        ddaplId: 'mock-ddapl-id', // In real app, get from session
        customerEmail,
        dcPdf: dcPath,
        podPdf: podPath,
        status: 'SENT',
        linkToken
      }
    })

    // Simulate sending email (would use nodemailer here in prod)
    console.log(`\n======================================================`)
    console.log(`[EMAIL SIMULATOR] Sent to: ${customerEmail}`)
    console.log(`[EMAIL SIMULATOR] Subject: Your Demo Device Documents`)
    console.log(`[EMAIL SIMULATOR] Body: Please click the secure link to view your Delivery Challan and Proof of Delivery:`)
    console.log(`[EMAIL SIMULATOR] Link: http://localhost:3000/demo/${linkToken}`)
    console.log(`======================================================\n`)

    return NextResponse.json(demo, { status: 201 })
  } catch (error) {
    console.error('Error creating demo device:', error)
    return NextResponse.json({ error: 'Failed to create demo device' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    await prisma.demoDevice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting demo device:', error)
    return NextResponse.json({ error: 'Failed to delete demo device' }, { status: 500 })
  }
}
