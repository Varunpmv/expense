'use client';

import { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { Filter, Download, FileText, TrendingUp, Clock, CheckCircle, ChevronRight, ChevronLeft, X, ExternalLink } from 'lucide-react';
import { getSubmissionDetails, markAsPaid } from '@/app/actions/expense';
import { ConfirmationModal } from './ui/ConfirmationModal';

export default function FinanceDashboard({ data }: { data: any }) {
  const [filterDept, setFilterDept] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const [viewingSub, setViewingSub] = useState<any>(null);
  const [subExpenses, setSubExpenses] = useState<any[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'submissions' | 'advances'>('submissions');
  const [editingAdvance, setEditingAdvance] = useState<{ id: string, name: string, amount: number } | null>(null);
  const [newAdvanceAmount, setNewAdvanceAmount] = useState<string>('');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');
  const [viewingHistory, setViewingHistory] = useState<{ id: string, name: string } | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Modal state
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filteredSubmissions = useMemo(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    return data.submissions.filter((sub: any) => {
      const matchDept = !filterDept || sub.user.department === filterDept;
      const matchEmployee = !filterEmployee || sub.user.email === filterEmployee;
      const [year, month] = sub.month.split('-');
      const matchMonth = !filterMonth || month === filterMonth;
      const matchYear = !filterYear || year === filterYear;
      const matchStatus = !filterStatus || sub.status === filterStatus;
      return matchDept && matchEmployee && matchMonth && matchYear && matchStatus;
    });
  }, [data.submissions, filterDept, filterEmployee, filterMonth, filterYear, filterStatus]);

  const paginatedSubmissions = useMemo(() => {
    if (itemsPerPage === 'all') return filteredSubmissions;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredSubmissions.length / itemsPerPage);

  const stats = useMemo(() => {
    const paid = filteredSubmissions.filter((s: any) => s.status === 'PAID');
    const approved = filteredSubmissions.filter((s: any) => s.status === 'APPROVED');
    const pending = filteredSubmissions.filter((s: any) => s.status === 'SUBMITTED');
    
    return {
      totalPaid: paid.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0),
      totalApproved: approved.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0),
      pendingApproval: pending.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0),
      countPaid: paid.length,
      countApproved: approved.length,
      countPending: pending.length,
      totalCount: filteredSubmissions.length,
    };
  }, [filteredSubmissions]);

  const handleViewDetails = async (sub: any) => {
    setViewingSub(sub);
    setIsFetchingDetails(true);
    try {
      const details = await getSubmissionDetails(sub.id);
      setSubExpenses(details);
    } catch (err) {
      // We should probably replace this alert too, but let's focus on confirms first
      console.error('Failed to load details', err);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirmId) return;
    setIsUpdating(true);
    try {
      await markAsPaid(confirmId);
      setViewingSub(null);
      setConfirmId(null);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAdvance = async () => {
    if (!editingAdvance) return;
    setIsUpdating(true);
    try {
      const { addEmployeeAdvance } = await import('@/app/actions/expense');
      await addEmployeeAdvance(editingAdvance.id, parseFloat(newAdvanceAmount), advanceNotes);
      setEditingAdvance(null);
      setAdvanceNotes('');
    } catch (err) {
      alert('Failed to add advance');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchHistory = async (userId: string, name: string) => {
    setViewingHistory({ id: userId, name });
    setIsLoadingHistory(true);
    try {
      const { getAdvanceHistory } = await import('@/app/actions/expense');
      const history = await getAdvanceHistory(userId);
      setHistoryItems(history);
    } catch (err) {
      alert('Failed to fetch history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleMasterDownload = () => {
    // Construct dynamic filename
    let nameParts = ['finance_report'];
    if (filterDept) nameParts.push(filterDept.toLowerCase().replace(/\s+/g, '_'));
    if (filterEmployee) {
      const emp = data.employees.find((e: any) => e.email === filterEmployee);
      if (emp) nameParts.push(emp.name.toLowerCase().replace(/\s+/g, '_'));
    }
    if (filterYear) nameParts.push(filterYear);
    if (filterMonth) nameParts.push(filterMonth);
    if (filterStatus) nameParts.push(filterStatus.toLowerCase());
    if (nameParts.length === 1) nameParts.push('master');
    
    const fileName = `${nameParts.join('_')}_${new Date().toISOString().split('T')[0]}.csv`;

    // Master CSV Export of filtered data
    const headers = ['Employee', 'Department', 'Month', 'Submitted On', 'Approved By', 'Total Amount', 'Status'];
    const rows = filteredSubmissions.map((sub: any) => [
      `"${sub.user.name}"`,
      `"${sub.user.department || '--'}"`,
      `"${sub.month}"`,
      `"${new Date(sub.submittedAt).toLocaleDateString()}"`,
      `"${sub.approvedBy?.name || '--'}"`,
      sub.totalAmount,
      `"${sub.status}"`
    ]);
    
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const years = Array.from(new Set(data.submissions.map((s: any) => s.month.split('-')[0]))).sort().reverse();
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">
              Finance Operations
            </h1>
            <p className="text-slate-500 font-medium italic">Manage submissions, disbursements, and employee advances.</p>
          </div>
          
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-md border border-white/50 shadow-inner">
            <button 
              onClick={() => setActiveTab('submissions')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === 'submissions' 
                  ? 'bg-white text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.15)] scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
              }`}
            >
              Submissions
            </button>
            <button 
              onClick={() => setActiveTab('advances')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === 'advances' 
                  ? 'bg-white text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.15)] scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
              }`}
            >
              Employee Advances
            </button>
          </div>
        </div>

      {activeTab === 'submissions' ? (
        <>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Paid', value: stats.totalPaid, sub: `${stats.countPaid} paid claims`, color: 'emerald' },
          { label: 'Total Approved', value: stats.totalApproved, sub: `${stats.countApproved} awaiting payment`, color: 'blue' },
          { label: 'Pending Approval', value: stats.pendingApproval, sub: `${stats.countPending} in review`, color: 'amber' },
          { label: 'Total Submissions', value: stats.totalCount, sub: 'Across filters', color: 'slate', isCount: true }
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all duration-300 group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
            <h3 className={`text-3xl font-black tracking-tighter ${
              stat.color === 'emerald' ? 'text-emerald-600' :
              stat.color === 'blue' ? 'text-indigo-600' :
              stat.color === 'amber' ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {stat.isCount ? stat.value : `₹${stat.value.toLocaleString('en-IN')}`}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Advanced Filters</h4>
          </div>
          <Button 
            onClick={handleMasterDownload}
            variant="outline"
            size="sm"
            className="flex items-center bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            value={filterDept} 
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {data.departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={filterEmployee} 
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Employees</option>
            {data.employees.map((e: any) => <option key={e.email} value={e.email}>{e.name}</option>)}
          </select>

          <div className="flex space-x-2">
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              className="flex-1 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Months</option>
              {months.map(m => <option key={m} value={m}>{new Date(2000, parseInt(m)-1).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="flex-1 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Years</option>
              {years.map((y: string) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button 
            onClick={() => { setFilterDept(''); setFilterEmployee(''); setFilterMonth(''); setFilterYear(''); setFilterStatus(''); }}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 text-center"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white shadow-md rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee / Dept</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted On</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Approved By</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedSubmissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">No submissions found matching the criteria.</td>
              </tr>
            ) : (
              paginatedSubmissions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{sub.user.name}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">{sub.user.department || 'No Dept'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600" suppressHydrationWarning>
                    {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {sub.name || sub.expenseHead || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {sub.month}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-base font-bold text-slate-900">₹{sub.totalAmount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {sub.approvedBy ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{sub.approvedBy.name}</span>
                        <span className="text-[10px] text-slate-400">Manager</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                      sub.status === 'PAID' ? 'bg-indigo-100 text-indigo-700' :
                      sub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      sub.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right space-x-2">
                    {sub.status === 'APPROVED' && (
                      <Button size="sm" variant="primary" onClick={() => setConfirmId(sub.id)} disabled={isUpdating}>
                        Mark Paid
                      </Button>
                    )}
                    <button 
                      onClick={() => handleViewDetails(sub)}
                      className="text-indigo-600 hover:text-indigo-900 font-bold text-sm inline-flex items-center transition-colors px-2 py-1"
                    >
                      Audit <ChevronRight className="ml-1 h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {filteredSubmissions.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Show</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemsPerPage(val === 'all' ? 'all' : parseInt(val));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border-slate-200 text-xs font-bold text-slate-700 py-1 focus:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{itemsPerPage === 'all' ? 1 : (currentPage - 1) * (itemsPerPage as number) + 1}</span> to <span className="font-bold text-slate-900">{itemsPerPage === 'all' ? filteredSubmissions.length : Math.min(currentPage * (itemsPerPage as number), filteredSubmissions.length)}</span> of <span className="font-bold text-slate-900">{filteredSubmissions.length}</span> results
              </p>
            </div>

            {itemsPerPage !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                    // Only show first, last, current, and pages around current if many pages
                    if (totalPages > 7) {
                      if (p !== 1 && p !== totalPages && (p < currentPage - 1 || p > currentPage + 1)) {
                        if (p === currentPage - 2 || p === currentPage + 2) {
                          return <span key={p} className="px-2 text-slate-400">...</span>;
                        }
                        return null;
                      }
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === p 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
        </>
      ) : (
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manage Employee Advances</h3>
              <p className="text-sm text-slate-500">Set the advance amount allocated to each employee.</p>
            </div>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Current Advance</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.allUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{user.name}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-black text-slate-900">₹{user.advanceAmount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-4">
                    <button 
                      onClick={() => fetchHistory(user.id, user.name)}
                      className="text-slate-500 hover:text-indigo-600 text-sm font-bold"
                    >
                      History
                    </button>
                    <button 
                      onClick={() => {
                        setEditingAdvance({ id: user.id, name: user.name, amount: user.advanceAmount });
                        setNewAdvanceAmount('');
                      }}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-bold"
                    >
                      Add Advance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Advance History Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Advance History</h2>
                <p className="text-slate-500 text-sm">Tracking fund allocations for <span className="font-bold text-slate-900">{viewingHistory.name}</span></p>
              </div>
              <button onClick={() => setViewingHistory(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-slate-500">Retrieving history...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 font-medium">No advance history found for this employee.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-500" suppressHydrationWarning>{new Date(item.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {item.notes && <p className="text-[10px] text-slate-400 mt-1">Note: {item.notes}</p>}
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                        Disbursed
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advance Add Modal */}
      {editingAdvance && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Give New Advance</h2>
            <p className="text-slate-500 mb-6">Adding to advance for <span className="font-bold text-slate-900">{editingAdvance.name}</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Advance Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={newAdvanceAmount}
                    onChange={(e) => setNewAdvanceAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <textarea 
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., Monthly travel allowance"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <Button 
                onClick={() => setEditingAdvance(null)}
                variant="outline" 
                className="flex-1"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateAdvance}
                variant="primary" 
                className="flex-1"
                isLoading={isUpdating}
              >
                Add Advance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewingSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{viewingSub.name || 'Expense Submission'}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <p className="text-slate-500 text-sm">By <span className="font-semibold text-slate-700">{viewingSub.user.name}</span></p>
                  {viewingSub.expenseHead && (
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{viewingSub.expenseHead}</span>
                  )}
                  <span className="text-xs text-slate-400">{viewingSub.month}</span>
                  {viewingSub.approvedBy && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      ✓ Approved by {viewingSub.approvedBy.name}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewingSub(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isFetchingDetails ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-slate-500">Loading audit trail...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subExpenses.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{exp.expenseHead}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500" suppressHydrationWarning>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">{exp.expenseType}</h4>
                          {exp.notes && <p className="text-sm text-slate-600 mt-2 italic">"{exp.notes}"</p>}
                          
                          {exp.customFields && Object.keys(exp.customFields).length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              {Object.entries(exp.customFields).map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{key}</p>
                                  <p className="text-xs font-semibold text-slate-700">{value as string}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</p>
                          {exp.billUrl && (
                            <a 
                              href={exp.billUrl} 
                              className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 mt-3"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(exp.billUrl, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-2" /> View Bill
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Final Audit Total</p>
                      <p className="text-3xl font-bold">₹{viewingSub.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {viewingSub.status === 'APPROVED' && (
                        <Button variant="primary" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setConfirmId(viewingSub.id)} disabled={isUpdating}>
                          Mark as Paid
                        </Button>
                      )}
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Status</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold mt-1 ${
                          viewingSub.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                          viewingSub.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                          viewingSub.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {viewingSub.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmId}
        title="Confirm Payment"
        message="Are you sure you want to mark this submission as paid? This action will finalize the reimbursement."
        type="info"
        confirmLabel="Yes, Mark Paid"
        onConfirm={handleMarkAsPaid}
        onCancel={() => setConfirmId(null)}
        isLoading={isUpdating}
      />
      </div>
    </div>
  );
}
