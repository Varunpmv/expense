'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function getAdminData() {
  await checkAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const configs = await prisma.dropdownConfig.findMany({
    orderBy: { type: 'asc' },
  });
  const customFields = await prisma.customFieldDefinition.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'heading_' } }
  });
  return { users, configs, customFields, settings };
}

// ... existing upsertUser and dropdown actions ...

export async function upsertCustomField(formData: FormData) {
  await checkAdmin();
  const id = formData.get('id') as string | null;
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const options = formData.get('options') as string | null;
  const required = formData.get('required') === 'on';

  if (id) {
    await prisma.customFieldDefinition.update({
      where: { id },
      data: { name, type, options, required },
    });
  } else {
    await prisma.customFieldDefinition.create({
      data: { name, type, options, required },
    });
  }
  revalidatePath('/admin');
}

export async function toggleCustomField(id: string, isActive: boolean) {
  await checkAdmin();
  await prisma.customFieldDefinition.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath('/admin');
}


export async function upsertUser(formData: FormData) {
  await checkAdmin();
  const id = formData.get('id') as string | null;
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const department = formData.get('department') as string;

  if (id) {
    await prisma.user.update({
      where: { id },
      data: { email, name, role, department },
    });
  } else {
    await prisma.user.create({
      data: { email, name, role, department },
    });
  }
  revalidatePath('/admin');
}

export async function upsertDropdownConfig(formData: FormData) {
  await checkAdmin();
  const id = formData.get('id') as string | null;
  const type = formData.get('type') as string;
  const value = formData.get('value') as string;
  const approverEmail = formData.get('approverEmail') as string | null;

  if (id) {
    await prisma.dropdownConfig.update({
      where: { id },
      data: { type, value, approverEmail },
    });
  } else {
    await prisma.dropdownConfig.create({
      data: { type, value, approverEmail },
    });
  }
  revalidatePath('/admin');
}

export async function toggleDropdownConfig(id: string, isActive: boolean) {
  await checkAdmin();
  await prisma.dropdownConfig.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath('/admin');
}

export async function getSmtpSettings() {
  await checkAdmin();
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'SMTP_CONFIG' },
  });
  return setting ? JSON.parse(setting.value) : null;
}

export async function saveSmtpSettings(formData: FormData) {
  await checkAdmin();
  const host = formData.get('host') as string;
  const port = parseInt(formData.get('port') as string);
  const user = formData.get('user') as string;
  const pass = formData.get('pass') as string;
  const from = formData.get('from') as string;
  const secure = formData.get('secure') === 'on';

  const config = { host, port, user, pass, from, secure };

  await prisma.systemSetting.upsert({
    where: { key: 'SMTP_CONFIG' },
    update: { value: JSON.stringify(config) },
    create: { key: 'SMTP_CONFIG', value: JSON.stringify(config) },
  });

  revalidatePath('/admin');
}
export async function updateDropdownHeading(type: string, heading: string) {
  await checkAdmin();
  const key = `heading_${type}`;
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: heading },
    create: { key, value: heading },
  });
  revalidatePath('/admin');
}

export async function deleteDropdownConfig(id: string) {
  await checkAdmin();
  await prisma.dropdownConfig.delete({
    where: { id },
  });
  revalidatePath('/admin');
}
