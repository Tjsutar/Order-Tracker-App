import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const isCustomer = user.role === 'CUSTOMER'
    const customerId = user.id

    const poWhereClause = isCustomer ? { customerId } : {}
    const shipmentWhereClause = isCustomer ? { purchaseOrder: { customerId } } : {}

    // 1. Total Active POs (NEW, PARTIALLY_COMPLETED)
    const activePOs = await prisma.purchaseOrder.count({
      where: { ...poWhereClause, overallStatus: { notIn: ['COMPLETED', 'ACTION_REQUIRED'] } }
    })

    // 2. Shipment Rejection Rate
    const totalShipments = await prisma.shipment.count({ where: shipmentWhereClause })
    const rejectedShipments = await prisma.shipment.count({
      where: { ...shipmentWhereClause, status: 'REJECTED' }
    })
    const rejectionRate = totalShipments > 0 ? ((rejectedShipments / totalShipments) * 100).toFixed(1) : 0

    // 3. Average Completion Time (in days)
    const completedPOs = await prisma.purchaseOrder.findMany({
      where: { ...poWhereClause, overallStatus: 'COMPLETED' },
      select: { uploadDate: true, updatedAt: true }
    })
    
    let avgCompletionDays = 0
    if (completedPOs.length > 0) {
      const totalDays = completedPOs.reduce((acc, po) => {
        const diffTime = Math.abs(po.updatedAt.getTime() - po.uploadDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return acc + diffDays
      }, 0)
      avgCompletionDays = Math.round((totalDays / completedPOs.length) * 10) / 10
    }

    // 4. Action Required POs
    const actionRequiredPOs = await prisma.purchaseOrder.count({
      where: { ...poWhereClause, overallStatus: 'ACTION_REQUIRED' }
    })

    return NextResponse.json({
      activePOs,
      rejectionRate: Number(rejectionRate),
      avgCompletionDays,
      actionRequiredPOs
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
