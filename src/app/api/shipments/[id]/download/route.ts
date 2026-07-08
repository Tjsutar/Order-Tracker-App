import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params
    const shipmentId = params.id
    
    // Fetch shipment
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { purchaseOrder: true }
    })
    
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }
    
    const zip = new AdmZip()
    let hasFiles = false
    
    // Helper to safely add local files
    const addFileToZip = (filePath: string | null, typeName: string) => {
      if (!filePath) return
      
      try {
        if (fs.existsSync(filePath)) {
          const extension = path.extname(filePath) || '.pdf'
          const filename = `${typeName}${extension}`
          zip.addLocalFile(filePath, '', filename)
          hasFiles = true
        } else {
           console.warn(`File not found: ${filePath}`)
        }
      } catch (e) {
        console.error(`Failed to add ${typeName} to zip:`, e)
      }
    }
    
    addFileToZip(shipment.invoicePdf, 'Invoice')
    addFileToZip(shipment.podPdf, 'POD')
    
    if (!hasFiles) {
      // Create an empty dummy file if no files exist so we still return a valid zip
      zip.addFile('empty.txt', Buffer.from('No documents uploaded for this shipment yet.'))
    }
    
    const zipBuffer = zip.toBuffer()
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Shipment_${shipment.shipmentNo}.zip"`
      }
    })
    
  } catch (error) {
    console.error('Failed to create shipment zip:', error)
    return NextResponse.json({ error: 'Failed to create zip' }, { status: 500 })
  }
}
