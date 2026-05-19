import { getAdminData, getSmtpSettings } from '../actions/admin';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminDashboardClient from '@/components/AdminDashboardClient';

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const { users: usersData, configs: configsData, customFields, settings } = await getAdminData();
  const smtpSettings = await getSmtpSettings();

  return (
    <div className="bg-slate-50 min-h-screen">
      <AdminDashboardClient 
        initialUsers={usersData} 
        initialConfigs={configsData} 
        initialCustomFields={customFields}
        initialSmtpSettings={smtpSettings}
        initialSettings={settings}
      />
    </div>
  );
}
