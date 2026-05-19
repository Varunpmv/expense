'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '@/lib/email';

async function handleFileUpload(file: File | null) {
  if (!file || file.size === 0) return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Robust extension extraction
  const originalName = file.name || 'file';
  const lastDotIndex = originalName.lastIndexOf('.');
  const ext = lastDotIndex !== -1 ? originalName.slice(lastDotIndex + 1).toLowerCase() : 'bin';
  
  // Use original name (sanitized) + short UUID for better recognizability
  const baseName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;
  const sanitizedBase = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
  const filename = `${sanitizedBase}-${uuidv4().slice(0, 8)}.${ext}`;
  
  const path = join(process.cwd(), 'public', 'uploads', filename);
  await writeFile(path, buffer);
  return `/uploads/${filename}`;
}

export async function addExpense(formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const userId = (session.user as any).id;
  const dateStr = formData.get('date') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const account = formData.get('account') as string;
  const expenseHead = formData.get('expenseHead') as string;
  const expenseType = formData.get('expenseType') as string;
  const notes = formData.get('notes') as string | null;
  const file = formData.get('bill') as File | null;

  const billUrl = await handleFileUpload(file);

  const date = new Date(dateStr);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const customFields: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key.startsWith('custom_')) {
      customFields[key.replace('custom_', '')] = value;
    }
  });

  await prisma.expense.create({
    data: {
      userId,
      date,
      amount,
      account,
      expenseHead,
      expenseType,
      notes,
      billUrl,
      month,
      status: 'DRAFT',
      customFields,
    },
  });

  revalidatePath('/');
}

export async function updateExpense(id: string, formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const userId = (session.user as any).id;
  
  const existing = await prisma.expense.findFirst({
    where: { id, userId, status: 'DRAFT' }
  });

  if (!existing) throw new Error('Expense not found or cannot be edited');

  const dateStr = formData.get('date') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const account = formData.get('account') as string;
  const expenseHead = formData.get('expenseHead') as string;
  const expenseType = formData.get('expenseType') as string;
  const notes = formData.get('notes') as string | null;
  const file = formData.get('bill') as File | null;

  let billUrl = existing.billUrl;
  if (file && file.size > 0) {
    billUrl = await handleFileUpload(file);
  }

  const date = new Date(dateStr);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const customFields: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key.startsWith('custom_')) {
      customFields[key.replace('custom_', '')] = value;
    }
  });

  await prisma.expense.update({
    where: { id },
    data: {
      date,
      amount,
      account,
      expenseHead,
      expenseType,
      notes,
      billUrl,
      month,
      customFields,
    },
  });

  revalidatePath('/');
}

export async function deleteExpense(id: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  
  const userId = (session.user as any).id;

  await prisma.expense.deleteMany({
    where: {
      id,
      userId,
      status: 'DRAFT',
    },
  });

  revalidatePath('/');
}

export async function createProject(formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  
  const userId = (session.user as any).id;
  const name = formData.get('name') as string;
  const startDate = new Date(formData.get('startDate') as string);
  const endDate = new Date(formData.get('endDate') as string);
  const month = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

  await prisma.submission.create({
    data: {
      userId,
      name,
      startDate,
      endDate,
      month,
      status: 'DRAFT',
      totalAmount: 0,
    }
  });

  revalidatePath('/');
}

export async function assignExpensesToProject(projectId: string, expenseIds: string[]) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const userId = (session.user as any).id;

  // Verify project belongs to user
  const project = await prisma.submission.findFirst({
    where: { id: projectId, userId, status: 'DRAFT' }
  });

  if (!project) throw new Error('Project not found or already submitted');

  // Update expenses
  await prisma.expense.updateMany({
    where: { 
      id: { in: expenseIds },
      userId,
      status: 'DRAFT'
    },
    data: {
      submissionId: projectId,
      status: 'SUBMITTED' // Mark as submitted within the project context
    }
  });

  // Re-calculate total
  const total = await prisma.expense.aggregate({
    where: { submissionId: projectId },
    _sum: { amount: true }
  });

  await prisma.submission.update({
    where: { id: projectId },
    data: { totalAmount: total._sum.amount || 0 }
  });

  revalidatePath('/');
}

export async function submitProject(projectId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const userId = (session.user as any).id;
  const employeeName = session.user.name || 'An Employee';

  const project = await prisma.submission.findFirst({
    where: { id: projectId, userId, status: 'DRAFT' },
    include: { expenses: true }
  });

  if (!project || project.expenses.length === 0) {
    throw new Error('Project must have expenses to be submitted');
  }

  // Fetch approver mapping for all unique expense heads
  const uniqueHeads = Array.from(new Set(project.expenses.map(e => e.expenseHead)));
  const headConfigs = await prisma.dropdownConfig.findMany({
    where: { type: 'EXPENSE_HEAD', value: { in: uniqueHeads }, isActive: true }
  });

  // Build a map: expenseHead -> approverEmail (fallback to 'NO_APPROVER')
  const headToApprover: Record<string, string> = {};
  for (const cfg of headConfigs) {
    headToApprover[cfg.value] = cfg.approverEmail || 'NO_APPROVER';
  }

  // Group expenses by approver email so same approver gets ONE submission
  const expensesByApprover = project.expenses.reduce((acc, exp) => {
    const approver = headToApprover[exp.expenseHead] || 'NO_APPROVER';
    if (!acc[approver]) acc[approver] = [];
    acc[approver].push(exp);
    return acc;
  }, {} as Record<string, any[]>);

  // Create ONE submission per approver
  for (const [approverEmail, exps] of Object.entries(expensesByApprover)) {
    const total = exps.reduce((sum, e) => sum + e.amount, 0);
    // Collect unique heads in this approver's group for display
    const headsInGroup = Array.from(new Set(exps.map((e: any) => e.expenseHead)));
    // Use first head for the expenseHead field (used for approver routing filter)
    const primaryHead = headsInGroup[0];

    const newSub = await prisma.submission.create({
      data: {
        userId,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        month: project.month,
        expenseHead: primaryHead,
        totalAmount: total,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      }
    });

    // Move all expenses for this approver to the new submission
    await prisma.expense.updateMany({
      where: { id: { in: exps.map((e: any) => e.id) } },
      data: { submissionId: newSub.id, status: 'SUBMITTED' }
    });

    // Notify the approver
    if (approverEmail !== 'NO_APPROVER') {
      try {
        await sendEmail({
          to: approverEmail,
          subject: `Project Submission: ${project.name} by ${employeeName}`,
          text: `Project "${project.name}" has ${exps.length} expense(s) (Total: ₹${total}) for your approval.\nCategories: ${headsInGroup.join(', ')}`
        });
      } catch (err) {
        console.error(`Email failed for ${approverEmail}:`, err);
      }
    }
  }

  // Delete the original DRAFT project container
  await prisma.submission.delete({ where: { id: projectId } });

  revalidatePath('/');
}



export async function updateSubmissionStatus(submissionId: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'MANAGER') {
    throw new Error('Unauthorized');
  }

  const managerId = (session.user as any).id;
  const managerEmail = session.user.email!;
  
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { user: true }
  });

  if (!submission) throw new Error('Submission not found');

  // Check if this manager is the designated approver for the head
  if (submission.expenseHead) {
    const headConfig = await prisma.dropdownConfig.findFirst({
      where: { type: 'EXPENSE_HEAD', value: submission.expenseHead }
    });
    
    if (headConfig?.approverEmail && headConfig.approverEmail !== managerEmail) {
      throw new Error('You are not authorized to approve expenses for this head');
    }
  }
  
  const updatedSubmission = await prisma.submission.update({
    where: { id: submissionId },
    data: { 
      status, 
      comments,
      approvedById: status === 'APPROVED' ? managerId : undefined
    },
    include: { user: true },
  });

  if (status === 'REJECTED') {
    await prisma.expense.updateMany({
      where: { submissionId },
      data: { status: 'DRAFT', submissionId: null }
    });
  }

  // Notify Employee
  await sendEmail({
    to: updatedSubmission.user.email,
    subject: `Expense Submission ${status}`,
    text: `Hello ${updatedSubmission.user.name},\n\nYour expense submission for ${updatedSubmission.month} has been ${status}.\n\nComments: ${comments || 'None'}\n\nRegards,\nExpenseHub System`
  });

  revalidatePath('/');
}

export async function getSubmissionDetails(submissionId: string) {
  const session = await getSession();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'MANAGER' && role !== 'FINANCE')) {
    throw new Error('Unauthorized');
  }

  return await prisma.expense.findMany({
    where: { submissionId },
    orderBy: { date: 'asc' },
  });
}
export async function markAsPaid(submissionId: string) {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'FINANCE') {
    throw new Error('Unauthorized');
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: 'PAID' },
  });

  revalidatePath('/');
}

export async function addEmployeeAdvance(targetUserId: string, amount: number, notes: string = '') {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'FINANCE') {
    throw new Error('Unauthorized');
  }

  // Create history record
  await prisma.advanceHistory.create({
    data: {
      userId: targetUserId,
      amount,
      notes,
    },
  });

  // Update cumulative total on user for faster balance lookup
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      advanceAmount: {
        increment: amount
      }
    },
  });

  revalidatePath('/');
}

export async function getAdvanceHistory(targetUserId: string) {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'FINANCE') {
    throw new Error('Unauthorized');
  }

  return prisma.advanceHistory.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: 'desc' },
  });
}
