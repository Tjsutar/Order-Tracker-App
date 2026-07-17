import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function clearData() {
  console.log('⚠️  Starting data clearing process...');

  try {
    // 1. Delete all database records (except Users)
    console.log('Clearing database records...');
    
    const deletedShipments = await prisma.shipment.deleteMany({});
    console.log(`- Deleted ${deletedShipments.count} Shipments`);
    
    const deletedPOs = await prisma.purchaseOrder.deleteMany({});
    console.log(`- Deleted ${deletedPOs.count} Purchase Orders`);
    
    const deletedTrash = await prisma.trashItem.deleteMany({});
    console.log(`- Deleted ${deletedTrash.count} Trash Items`);
    
    const deletedLogs = await prisma.auditLog.deleteMany({});
    console.log(`- Deleted ${deletedLogs.count} Audit Logs`);

    // 2. Clear out storage directories
    console.log('Clearing storage files...');
    const storagePaths = [
      path.join(process.cwd(), 'storage', 'uploads'),
      path.join(process.cwd(), 'storage', 'trash')
    ];

    for (const dir of storagePaths) {
      if (fs.existsSync(dir)) {
        // Read all items in the directory
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          // Keep a .gitkeep file if it exists, otherwise delete
          if (item === '.gitkeep') continue;
          
          const itemPath = path.join(dir, item);
          if (fs.statSync(itemPath).isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(itemPath);
          }
        }
        console.log(`- Cleared contents of ${dir}`);
      }
    }

    console.log('✅ Data clearing completed successfully! (User accounts were preserved)');

  } catch (error) {
    console.error('❌ Error during data clearing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
