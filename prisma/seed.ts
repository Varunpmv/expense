import { prisma } from '../src/lib/prisma';

async function main() {
  // Create mock users
  const users = [
    { email: 'employee@test.com', name: 'John Employee', role: 'EMPLOYEE', department: 'Sales' },
    { email: 'manager@test.com', name: 'Jane Manager', role: 'MANAGER', department: 'Finance' },
    { email: 'approver@test.com', name: 'Mark Approver', role: 'MANAGER', department: 'Operations' },
    { email: 'admin@test.com', name: 'Admin User', role: 'ADMIN', department: 'IT' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role, department: user.department },
      create: user,
    });
  }

  // Create initial dropdown configs
  const dropdowns = [
    // Accounts
    { type: 'ACCOUNT', value: 'India' },
    { type: 'ACCOUNT', value: 'International' },
    { type: 'ACCOUNT', value: 'Bima Sugam' },
    
    // Expense Heads with assigned approvers
    { type: 'EXPENSE_HEAD', value: 'Audit & Compliance', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Cloud Infra', approverEmail: 'approver@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Cloud Infra - Production', approverEmail: 'approver@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Corporate Development', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Cyber Security', approverEmail: 'approver@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Employee Benefits', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Employee Engagement', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'IT Tools', approverEmail: 'approver@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Laptop & Accessories', approverEmail: 'approver@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Leadership Travel', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Marketing Expenses', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Office Admin Expenses', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Others', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Project Delivery', approverEmail: 'approver@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Recruitment Expenses', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Rent', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Sales Expenses', approverEmail: 'manager@test.com' },
    { type: 'EXPENSE_HEAD', value: 'Special Projects', approverEmail: 'manager@test.com' },

    // Expense Types
    { type: 'EXPENSE_TYPE', value: 'Analytics tools' },
    { type: 'EXPENSE_TYPE', value: 'Awards' },
    { type: 'EXPENSE_TYPE', value: 'Business Promotion Exp' },
    { type: 'EXPENSE_TYPE', value: 'Courier Charges' },
    { type: 'EXPENSE_TYPE', value: 'Data Protection tools' },
    { type: 'EXPENSE_TYPE', value: 'Design Tools' },
    { type: 'EXPENSE_TYPE', value: 'Dev Tools' },
    { type: 'EXPENSE_TYPE', value: 'Documentation tools' },
    { type: 'EXPENSE_TYPE', value: 'Electricity Charges' },
    { type: 'EXPENSE_TYPE', value: 'Emp. Eng. - Common' },
    { type: 'EXPENSE_TYPE', value: 'Employee Training' },
    { type: 'EXPENSE_TYPE', value: 'Endpoint Protection tools' },
    { type: 'EXPENSE_TYPE', value: 'GFF' },
    { type: 'EXPENSE_TYPE', value: 'Communication Tools' },
    { type: 'EXPENSE_TYPE', value: 'Laptop Repair' },
    { type: 'EXPENSE_TYPE', value: 'Legal Fee' },
    { type: 'EXPENSE_TYPE', value: 'Monitoring tools' },
    { type: 'EXPENSE_TYPE', value: 'Office Lunch' },
    { type: 'EXPENSE_TYPE', value: 'Office Pantry' },
    { type: 'EXPENSE_TYPE', value: 'Other Devices Repair' },
    { type: 'EXPENSE_TYPE', value: 'Partner Gifting' },
    { type: 'EXPENSE_TYPE', value: 'Professional Fees' },
    { type: 'EXPENSE_TYPE', value: 'Source Control tools' },
    { type: 'EXPENSE_TYPE', value: 'Stamp Duty' },
    { type: 'EXPENSE_TYPE', value: 'Tools Subscription' },
    { type: 'EXPENSE_TYPE', value: 'Travel' },
    { type: 'EXPENSE_TYPE', value: 'Accommodation' },
    { type: 'EXPENSE_TYPE', value: 'Visa Fee' },
    { type: 'EXPENSE_TYPE', value: 'Wi-Fi Charges' },
    { type: 'EXPENSE_TYPE', value: 'Office Stationary' },
    { type: 'EXPENSE_TYPE', value: 'Stamp Paper' },
    { type: 'EXPENSE_TYPE', value: 'Business Meals' },
    { type: 'EXPENSE_TYPE', value: 'Tax Dues' },
    { type: 'EXPENSE_TYPE', value: 'Office supplies' },
    { type: 'EXPENSE_TYPE', value: 'Others' },

    // Departments (Retained from previous setup as they are structural)
    { type: 'DEPARTMENT', value: 'Sales' },
    { type: 'DEPARTMENT', value: 'Marketing' },
    { type: 'DEPARTMENT', value: 'Finance' },
    { type: 'DEPARTMENT', value: 'IT' },
    { type: 'DEPARTMENT', value: 'HR' },
  ];

  for (const config of dropdowns) {
    // Assuming value is unique per type, let's just insert if not exists
    const existing = await prisma.dropdownConfig.findFirst({
      where: { type: config.type, value: config.value },
    });

    if (!existing) {
      await prisma.dropdownConfig.create({ data: config });
    } else if (config.approverEmail) {
      // Update approver email if it has changed or been added
      await prisma.dropdownConfig.update({
        where: { id: existing.id },
        data: { approverEmail: config.approverEmail }
      });
    }
  }

  // Create some initial expenses for the employee
  const employee = await prisma.user.findUnique({ where: { email: 'employee@test.com' } });
  if (employee) {
    // Draft expenses
    const drafts = [
      {
        userId: employee.id,
        date: new Date(),
        amount: 1200.50,
        account: 'Personal Card',
        expenseHead: 'Meals',
        expenseType: 'Lunch',
        notes: 'Team lunch',
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        status: 'DRAFT'
      },
      {
        userId: employee.id,
        date: new Date(),
        amount: 4500.00,
        account: 'Cash',
        expenseHead: 'Travel',
        expenseType: 'Flight',
        notes: 'Client meeting travel',
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        status: 'DRAFT'
      }
    ];

    for (const draft of drafts) {
      await prisma.expense.create({ data: draft });
    }

    // Past submission
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const submission = await prisma.submission.create({
      data: {
        userId: employee.id,
        month: lastMonthStr,
        totalAmount: 8500.00,
        status: 'PAID',
        submittedAt: lastMonth,
        expenses: {
          create: [
            {
              userId: employee.id,
              date: lastMonth,
              amount: 8500.00,
              account: 'Corporate Card',
              expenseHead: 'Software',
              expenseType: 'Subscription',
              notes: 'Monthly AWS bill',
              month: lastMonthStr,
              status: 'SUBMITTED'
            }
          ]
        }
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
