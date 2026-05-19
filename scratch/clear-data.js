const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Starting fresh: Clearing all expense data...');

  try {
    // Delete in order of dependency
    const expenseCount = await prisma.expense.deleteMany({});
    console.log(`✅ Deleted ${expenseCount.count} expenses.`);

    const submissionCount = await prisma.submission.deleteMany({});
    console.log(`✅ Deleted ${submissionCount.count} submissions (projects).`);

    const advanceCount = await prisma.advanceHistory.deleteMany({});
    console.log(`✅ Deleted ${advanceCount.count} advance history records.`);

    const userUpdateCount = await prisma.user.updateMany({
      data: { advanceAmount: 0 }
    });
    console.log(`✅ Reset advance balance for ${userUpdateCount.count} users.`);

    console.log('✨ System is now clean and ready for fresh entries.');
  } catch (err) {
    console.error('❌ Failed to clear data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
