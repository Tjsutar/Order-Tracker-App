const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pos = await prisma.purchaseOrder.findMany({
    include: { shipments: true }
  });
  console.log(JSON.stringify(pos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
