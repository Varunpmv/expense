import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getUserDashboardData() {
  const session = await getSession();
  if (!session?.user) return null;
  const userId = (session.user as any).id;

  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { submission: true },
    orderBy: { date: 'desc' },
  });

  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: { expenses: true },
    orderBy: { submittedAt: 'desc' },
  });

  const drafts = expenses.filter((e) => e.status === 'DRAFT' && !e.submissionId);
  const draftTotal = drafts.reduce((acc, curr) => acc + curr.amount, 0);
  
  const draftProjects = submissions.filter(s => s.status === 'DRAFT');
  const submittedProjects = submissions.filter(s => s.status !== 'DRAFT');
  
  const totalSpent = submissions
    .filter(s => s.status !== 'REJECTED' && s.status !== 'DRAFT')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { advanceAmount: true }
  });

  return {
    expenses,
    drafts, // these are unassigned drafts
    submissions: submittedProjects,
    draftProjects,
    draftTotal,
    advanceAmount: user?.advanceAmount || 0,
    totalSpent,
  };
}

export async function getDropdownConfigs() {
  const configs = await prisma.dropdownConfig.findMany({
    where: { isActive: true },
  });

  const customFields = await prisma.customFieldDefinition.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    accounts: configs.filter(c => c.type === 'ACCOUNT'),
    expenseHeads: configs.filter(c => c.type === 'EXPENSE_HEAD'),
    expenseTypes: configs.filter(c => c.type === 'EXPENSE_TYPE'),
    customFields,
  };
}

export async function getAllSubmissions() {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'MANAGER') return [];

  const managerEmail = session.user.email!;

  // Find all heads this manager is responsible for
  const authorizedHeads = await prisma.dropdownConfig.findMany({
    where: { type: 'EXPENSE_HEAD', approverEmail: managerEmail },
    select: { value: true }
  });

  const headValues = authorizedHeads.map(h => h.value);

  const submissions = await prisma.submission.findMany({
    where: {
      expenseHead: { in: headValues }
    },
    include: {
      user: { select: { name: true, email: true } },
      expenses: true,
    },
    orderBy: { submittedAt: 'desc' },
  });

  return submissions;
}
export async function getFinanceDashboardData() {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'FINANCE') return null;

  const submissions = await prisma.submission.findMany({
    include: {
      user: true,
      expenses: true,
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Manual lookup for approvedBy to bypass Prisma validation cache issues
  const managerIds = Array.from(new Set(submissions.map(s => s.approvedById).filter(Boolean))) as string[];
  const managers = await prisma.user.findMany({
    where: { id: { in: managerIds } },
    select: { id: true, name: true }
  });

  const managersMap = Object.fromEntries(managers.map(m => [m.id, m]));
  
  const enrichedSubmissions = submissions.map(s => ({
    ...s,
    approvedBy: s.approvedById ? managersMap[s.approvedById] : null
  }));

  const stats = {
    totalPaid: enrichedSubmissions.filter(s => s.status === 'PAID').reduce((acc, curr) => acc + curr.totalAmount, 0),
    totalApproved: enrichedSubmissions.filter(s => s.status === 'APPROVED').reduce((acc, curr) => acc + curr.totalAmount, 0),
    pendingApproval: enrichedSubmissions.filter(s => s.status === 'SUBMITTED').reduce((acc, curr) => acc + curr.totalAmount, 0),
    countPaid: enrichedSubmissions.filter(s => s.status === 'PAID').length,
    countApproved: enrichedSubmissions.filter(s => s.status === 'APPROVED').length,
    countPending: enrichedSubmissions.filter(s => s.status === 'SUBMITTED').length,
    totalCount: enrichedSubmissions.length,
    avgApprovalTime: 0,
  };

  const approvedOrPaid = enrichedSubmissions.filter(s => ['APPROVED', 'PAID'].includes(s.status));
  if (approvedOrPaid.length > 0) {
    const totalTime = approvedOrPaid.reduce((acc, curr) => {
      const submitted = new Date(curr.submittedAt).getTime();
      const approved = new Date(curr.updatedAt).getTime();
      return acc + (approved - submitted);
    }, 0);
    stats.avgApprovalTime = totalTime / approvedOrPaid.length / (1000 * 60 * 60 * 24); // in days
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, department: true, advanceAmount: true }
  });

  const departments = Array.from(new Set(enrichedSubmissions.map(s => s.user.department).filter(Boolean)));
  const employees = Array.from(new Set(enrichedSubmissions.map(s => JSON.stringify({ name: s.user.name, email: s.user.email }))));

  return {
    submissions: enrichedSubmissions,
    departments,
    employees: employees.map(e => JSON.parse(e)),
    stats,
    allUsers,
  };
}
