import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import AdmZip from 'adm-zip'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        shipments: {
          where: { visibleToCustomer: true },
          orderBy: { createdDate: 'asc' } // chronological order
        }
      }
    })

    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    }

    const zip = new AdmZip()
    
    // Add PO File to root of zip
    if (po.poFile) {
      try {
        const poFileContent = await readFile(po.poFile)
        zip.addFile(`01_PO_${path.basename(po.poFile)}`, poFileContent)
      } catch (err) {
        console.error(`Failed to add PO file: ${po.poFile}`, err)
      }
    }

    // Add Shipments in chronological order
    for (let i = 0; i < po.shipments.length; i++) {
      const shipment = po.shipments[i]
      
      // Invoice
      if (shipment.invoicePdf) {
        try {
          const content = await readFile(shipment.invoicePdf)
          zip.addFile(`02_Invoice_${path.basename(shipment.invoicePdf)}`, content)
        } catch (err) {
          console.error(`Failed to add Invoice file: ${shipment.invoicePdf}`, err)
        }
      }
      
      // POD
      if (shipment.podPdf) {
        try {
          const content = await readFile(shipment.podPdf)
          const invoiceName = shipment.invoicePdf ? `${path.parse(shipment.invoicePdf).name}_` : ''
          zip.addFile(`03_POD_${invoiceName}${path.basename(shipment.podPdf)}`, content)
        } catch (err) {
          console.error(`Failed to add POD file: ${shipment.podPdf}`, err)
        }
      }
    }

    const zipBuffer = zip.toBuffer()

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${po.poNumber}.zip"`
      }
    })
    
  } catch (error: any) {
    console.error('Error generating zip:', error)
    return NextResponse.json({ error: 'Failed to generate ZIP', details: error.message }, { status: 500 })
  }
}
