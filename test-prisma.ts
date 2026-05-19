import { PrismaClient } from '@prisma/client';

async function test() {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: "mysql://root:root@localhost:3306/expense_db"
    } as any);
    await prisma.$connect();
    console.log("Connected to Prisma directly!");
    await prisma.$disconnect();
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
