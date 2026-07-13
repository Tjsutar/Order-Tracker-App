const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log("Checking if admin user exists...");
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@ddapl.com" }
  });

  if (existingAdmin) {
    console.log("Admin user already exists! You can log in with: admin@ddapl.com");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const user = await prisma.user.create({
    data: {
      email: "admin@ddapl.com",
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN"
    }
  });

  console.log("==========================================");
  console.log(" ✅ SUCCESS! Admin user created in Database.");
  console.log("==========================================");
  console.log(" Email: admin@ddapl.com");
  console.log(" Password: admin123");
  console.log("==========================================");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
