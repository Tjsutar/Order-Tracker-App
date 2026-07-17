import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CustomerDashboardClient } from '@/components/customer/CustomerDashboardClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/')
  }
  
  const customerId = (session.user as any).id

  const limit = 10
  const pos = await prisma.purchaseOrder.findMany({
    take: limit,
    where: { 
      customerId,
      overallStatus: { not: 'COMPLETED' }
    },
    include: { shipments: true },
    orderBy: { uploadDate: 'desc' }
  })
  
  const [activeCount, actionRequiredCount, completedCount] = await Promise.all([
    prisma.purchaseOrder.count({ where: { customerId, overallStatus: { not: 'COMPLETED' } } }),
    Promise.resolve(0),
    prisma.purchaseOrder.count({ where: { customerId, overallStatus: 'COMPLETED' } })
  ])
  
  let nextCursor = null
  if (pos.length === limit) {
    nextCursor = pos[pos.length - 1].id
  }

  // Serialize dates
  const serializedPOs = JSON.parse(JSON.stringify(pos))

  return (
    <CustomerDashboardClient initialData={{ 
      pos: serializedPOs, 
      nextCursor,
      counts: {
        ACTIVE: activeCount,
        ACTION_REQUIRED: actionRequiredCount,
        COMPLETED: completedCount
      }
    }} customerId={customerId} />
  )
}
