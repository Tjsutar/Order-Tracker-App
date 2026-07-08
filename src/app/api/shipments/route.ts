import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Calculate the next shipment number for this PO
    const existingShipments = await prisma.shipment.count({
      where: { poId: data.poId }
    })
    
    const shipment = await prisma.shipment.create({
      data: {
        poId: data.poId,
        shipmentNo: existingShipments + 1,
        invoiceNo: data.invoiceNo,
        invoicePdf: data.invoicePdf,
        podPdf: data.podPdf,
        status: data.status || 'DRAFT',
        visibleToCustomer: data.visibleToCustomer || false
      }
    })
    
    await updatePOOverallStatus(data.poId)
    
    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
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
  
  let newStatus = 'NEW'
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
