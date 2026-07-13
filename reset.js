const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping database...');
  await prisma.auditLog.deleteMany();
  await prisma.trashItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Seeding default Admin user...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@ddapl.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Database reset complete. Default Admin: admin@ddapl.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
