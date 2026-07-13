const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.delete({ 
    where: { id: 'mock-customer-id-1' } 
  });
  console.log('Successfully deleted mock customer');
}

main().finally(() => prisma.$disconnect());
