const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.trashItem.deleteMany();
  await prisma.demoDevice.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  console.log('All shipments, POs, and related data have been cleared.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
