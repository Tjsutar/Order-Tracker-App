import { prisma } from '@/lib/prisma'
import { UsersClient } from '@/components/admin/UsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  // Fetch users directly on the server
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
  
  // Serialize dates
  const serializedUsers = JSON.parse(JSON.stringify(users))

  return (
    <UsersClient initialUsers={serializedUsers} />
  )
}
