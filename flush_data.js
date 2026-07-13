const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log(" 🧹 FLUSHING ALL TRANSACTIONAL DATA...");
  console.log("==========================================");

  try {
    // We delete in order to avoid foreign key constraints
    console.log("1. Deleting all Shipments...");
    const shipments = await prisma.shipment.deleteMany({});
    console.log(`   -> Deleted ${shipments.count} shipments.`);

    console.log("2. Deleting all Purchase Orders...");
    const pos = await prisma.purchaseOrder.deleteMany({});
    console.log(`   -> Deleted ${pos.count} purchase orders.`);

    console.log("3. Deleting all Trash Items...");
    const trash = await prisma.trashItem.deleteMany({});
    console.log(`   -> Deleted ${trash.count} trash items.`);

    console.log("4. Deleting all Audit Logs...");
    const logs = await prisma.auditLog.deleteMany({});
    console.log(`   -> Deleted ${logs.count} audit logs.`);

    console.log("==========================================");
    console.log(" ✅ SUCCESS: All test data has been flushed!");
    console.log(" 👤 NOTE: User accounts were NOT deleted.");
    console.log("==========================================");
  } catch (error) {
    console.error("❌ ERROR FLUSHING DATA:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
