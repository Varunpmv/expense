import { PrismaClient } from '@prisma/client';

async function checkBills() {
  const prisma = new PrismaClient();
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        billUrl: { not: null }
      },
      select: {
        id: true,
        billUrl: true,
        expenseHead: true,
        amount: true
      }
    });
    console.log(JSON.stringify(expenses, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkBills();
