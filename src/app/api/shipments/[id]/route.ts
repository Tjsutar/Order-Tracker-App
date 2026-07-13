import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POStatus } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

async function moveToTrash(entityType: string, entityName: string, filePaths: string[]) {
  const validPaths = filePaths.filter(Boolean);
  if (validPaths.length === 0) return;
  
  try {
    await prisma.trashItem.create({
      data: {
        entityType,
        entityName,
        filePaths: JSON.stringify(validPaths)
      }
    });
  } catch (err) {
    console.error('Failed to move to trash:', err);
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params
    const contentType = request.headers.get('content-type') || ''


    // Handle JSON (for status updates, visibility toggles, etc)
    if (contentType.includes('application/json')) {
      const data = await request.json()

      const currentShipment = await prisma.shipment.findUnique({ where: { id: params.id } })
      if (currentShipment) {
        if (data.invoicePdf === null && currentShipment.invoicePdf) {
          await moveToTrash('DOCUMENT', `Invoice for Shipment ${currentShipment.shipmentNo}`, [currentShipment.invoicePdf])
        }
        if (data.podPdf === null && currentShipment.podPdf) {
          await moveToTrash('DOCUMENT', `POD for Shipment ${currentShipment.shipmentNo}`, [currentShipment.podPdf])
        }
      }

      const shipment = await prisma.shipment.update({
        where: { id: params.id },
        data: {
          status: data.status,
          customerRemarks: data.customerRemarks,
          visibleToCustomer: data.visibleToCustomer,
          invoicePdf: data.invoicePdf,
          podPdf: data.podPdf
        }
      })

      await updatePOOverallStatus(shipment.poId)
      return NextResponse.json(shipment)
    }

    // Handle multipart/form-data (for file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const type = formData.get('type') as string // 'invoicePdf' or 'podPdf'
      const files = formData.getAll('files') as File[]

      if (!type || files.length === 0) {
        return NextResponse.json({ error: 'Type and files are required' }, { status: 400 })
      }

      // Sort files by sequence number at the end of the filename
      const getTrailingSequence = (name: string) => {
        const base = name.replace(/\.[^/.]+$/, "")
        const match = base.match(/(\d+)$/)
        return match ? parseInt(match[1], 10) : Infinity
      }
      
      const sortedFiles = [...files].sort((a, b) => getTrailingSequence(a.name) - getTrailingSequence(b.name))

      // Determine final filename based on the FIRST sorted file in sequence
      const firstFile = sortedFiles[0]
      const originalName = firstFile.name
      let baseName = originalName.replace(/\.[^/.]+$/, "") // strip extension

      const currentShipment = await prisma.shipment.findUnique({ 
        where: { id: params.id },
        include: { purchaseOrder: true }
      })
      
      if (!currentShipment) {
        return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
      }
      
      // If uploading a POD, include the invoice name in the POD filename for clarity
      if (type === 'podPdf' && currentShipment.invoicePdf) {
        const invoiceFilename = path.basename(currentShipment.invoicePdf)
        const invoiceBase = invoiceFilename.replace(/_invoicePdf\.pdf$/, "")
        baseName = `${invoiceBase}_POD_for_${baseName}`
      }

      const finalFilename = `${baseName}_${type}.pdf` // e.g. INV-123_invoicePdf.pdf

      const poNumber = currentShipment.purchaseOrder?.poNumber || 'Unknown_PO'

      // Prepare private storage path specific to this PO
      const storagePath = path.join(process.cwd(), 'storage', 'uploads', poNumber)

      try {
        await mkdir(storagePath, { recursive: true })
      } catch (err) {
        console.error('Could not create directory:', err)
      }

      const filePath = path.join(storagePath, finalFilename)

      // Merge PDFs
      const mergedPdf = await PDFDocument.create()

      for (const file of sortedFiles) {
        const arrayBuffer = await file.arrayBuffer()

        try {
          if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
            const image = await mergedPdf.embedJpg(arrayBuffer)
            const page = mergedPdf.addPage([image.width, image.height])
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
          } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
            const image = await mergedPdf.embedPng(arrayBuffer)
            const page = mergedPdf.addPage([image.width, image.height])
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
          } else {
            // Attempt to load as PDF
            const pdfDoc = await PDFDocument.load(arrayBuffer)
            const seqNumber = getTrailingSequence(file.name)
            
            // If sequence number is exactly 1, only keep the first page
            const pageIndices = seqNumber === 1 ? [0] : pdfDoc.getPageIndices()
            
            // Ensure we don't try to copy an out-of-bounds page (e.g., if the PDF is empty)
            if (pdfDoc.getPageCount() > 0) {
              const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices)
              copiedPages.forEach((page) => mergedPdf.addPage(page))
            }
          }
        } catch (err) {
          console.error(`Failed to parse file ${file.name}:`, err)
          return NextResponse.json({ error: `File ${file.name} is not a valid PDF or Image` }, { status: 400 })
        }
      }

      const mergedPdfBytes = await mergedPdf.save()

      // Save file locally to OneDrive folder
      await writeFile(filePath, Buffer.from(mergedPdfBytes))

      // Update database
      const updateData: any = {}
      updateData[type] = filePath

      // currentShipment is already fetched above
      
      const hasInvoice = type === 'invoicePdf' ? true : !!currentShipment?.invoicePdf
      const hasPod = type === 'podPdf' ? true : !!currentShipment?.podPdf

      if (hasInvoice && hasPod) {
        updateData.visibleToCustomer = true
        updateData.status = 'WAITING_APPROVAL'
      } else if (hasInvoice) {
        updateData.status = 'INVOICE_UPLOADED'
      } else if (hasPod) {
        updateData.status = 'POD_UPLOADED'
      }

      const shipment = await prisma.shipment.update({
        where: { id: params.id },
        data: updateData
      })

      await updatePOOverallStatus(shipment.poId)
      return NextResponse.json(shipment)
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 })

  } catch (error: any) {
    console.error('Error updating shipment:', error)
    return NextResponse.json({ error: 'Failed to update shipment', details: error.message, stack: error.stack }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params
    const shipmentToDelete = await prisma.shipment.findUnique({ 
      where: { id: params.id },
      include: { purchaseOrder: true }
    })
    
    if (shipmentToDelete) {
       const poNumber = shipmentToDelete.purchaseOrder?.poNumber || 'Unknown PO';
       await moveToTrash('SHIPMENT', `Shipment ${shipmentToDelete.shipmentNo} from ${poNumber}`, [
         shipmentToDelete.invoicePdf as string,
         shipmentToDelete.podPdf as string
       ])
    }

    const shipment = await prisma.shipment.delete({
      where: { id: params.id }
    })
    await updatePOOverallStatus(shipment.poId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json({ error: 'Failed to delete shipment', details: error.message }, { status: 500 })
  }
}

async function updatePOOverallStatus(poId: string) {
  const shipments = await prisma.shipment.findMany({
    where: { poId, visibleToCustomer: true }
  })

  if (shipments.length === 0) return

  const allAccepted = shipments.every(s => s.status === 'ACCEPTED')
  const anyRejected = shipments.some(s => s.status === 'REJECTED')
  const someAccepted = shipments.some(s => s.status === 'ACCEPTED')

  let newStatus: POStatus = 'NEW'
  if (anyRejected) {
    newStatus = 'ACTION_REQUIRED'
  } else if (allAccepted) {
    newStatus = 'COMPLETED'
  } else if (someAccepted) {
    newStatus = 'PARTIALLY_COMPLETED'
  }

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { overallStatus: newStatus }
  })
}
