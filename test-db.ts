import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const pos = await prisma.purchaseOrder.findMany()
    console.log('Success:', pos)
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
