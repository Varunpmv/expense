import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import FinanceDashboard from '@/components/FinanceDashboard';
import { getUserDashboardData, getDropdownConfigs, getAllSubmissions, getFinanceDashboardData } from '@/lib/data';

export default async function Home() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const role = (session.user as any).role;

  if (role === 'ADMIN') {
    redirect('/admin');
  }

  if (role === 'FINANCE') {
    const data = await getFinanceDashboardData();
    return (
      <main className="flex-1 bg-slate-50 min-h-screen">
        <FinanceDashboard data={data} />
      </main>
    );
  }

  const configs = await getDropdownConfigs();

  return (
    <main className="flex-1 bg-slate-50 min-h-screen">
      {role === 'MANAGER' ? (
        <ManagerDashboard submissions={await getAllSubmissions()} />
      ) : (
        <EmployeeDashboard data={await getUserDashboardData()} configs={configs} />
      )}
    </main>
  );
}
