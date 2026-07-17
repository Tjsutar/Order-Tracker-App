import { DdaplDashboardClient } from '@/components/ddapl/DdaplDashboardClient'
import { prisma } from '@/lib/prisma'

// This makes the page dynamically rendered on the server at request time
export const dynamic = 'force-dynamic'

export default async function DdaplDashboard() {
  // Fetch POs directly on the server!
  const limit = 10
  const pos = await prisma.purchaseOrder.findMany({
    take: limit,
    where: {
      overallStatus: { not: 'COMPLETED' }
    },
    include: { 
      shipments: true,
      customer: true
    },
    orderBy: { uploadDate: 'desc' }
  })
  
  const [activeCount, actionRequiredCount, completedCount] = await Promise.all([
    Promise.resolve(0),
    prisma.purchaseOrder.count({ where: { overallStatus: { not: 'COMPLETED' } } }),
    prisma.purchaseOrder.count({ where: { overallStatus: 'COMPLETED' } })
  ])
  
  let nextCursor = null
  if (pos.length === limit) {
    nextCursor = pos[pos.length - 1].id
  }

  // We need to serialize the dates before passing to Client Component
  const serializedPOs = JSON.parse(JSON.stringify(pos))

  return (
    <DdaplDashboardClient initialData={{ 
      pos: serializedPOs, 
      nextCursor,
      counts: {
        ACTIVE: activeCount,
        ACTION_REQUIRED: actionRequiredCount,
        COMPLETED: completedCount
      }
    }} />
  )
}
