const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log(" Testing Database Connection...");
  console.log("==========================================\n");
  
  try {
    // Attempt to connect and run a simple query
    await prisma.$connect();
    console.log("✅ SUCCESS: Successfully connected to PostgreSQL!");
    
    // Try to count users just to prove we can read data
    const userCount = await prisma.user.count();
    console.log(`✅ SUCCESS: Found ${userCount} users in the database.\n`);
    
    console.log("Your .env connection string is perfectly correct!");

  } catch (error) {
    console.log("❌ FAILED: Could not connect to the database.\n");
    console.log("Please check your .env file. The error from Prisma is:");
    console.error("--------------------------------------------------");
    console.error(error.message);
    console.error("--------------------------------------------------");
  } finally {
    await prisma.$disconnect();
  }
}

main();
