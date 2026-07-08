import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
          orderBy: { shipmentNo: 'asc' }
        },
        customer: true
      }
    })

    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    }

    return NextResponse.json(po)
  } catch (error) {
    console.error('Error fetching PO:', error)
    return NextResponse.json({ error: 'Failed to fetch PO' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params
    // Delete shipments first to avoid foreign key constraints if cascade is not set
    await prisma.shipment.deleteMany({
      where: { poId: params.id }
    })

    await prisma.purchaseOrder.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting PO:', error)
    return NextResponse.json({ error: 'Failed to delete PO', details: error.message }, { status: 500 })
  }
}
