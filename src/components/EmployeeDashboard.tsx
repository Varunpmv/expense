'use client';

import { useState, useEffect, useMemo } from 'react';
import { AddExpenseModal } from './AddExpenseModal';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { Button } from './ui/Button';
import { createProject, assignExpensesToProject, submitProject } from '@/app/actions/expense';
import { CreateProjectModal } from './CreateProjectModal';
import SubmissionHistory from './SubmissionHistory';
import { getPresetDates } from '@/lib/dateUtils';
import { 
  Plus, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  X, 
  Trash2, 
  CreditCard, 
  History,
  AlertCircle,
  Calendar,
  TrendingUp,
  FolderOpen,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function EmployeeDashboard({ data, configs }: { data: any, configs: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [assigningToProject, setAssigningToProject] = useState<string | null>(null);
  const [viewingSub, setViewingSub] = useState<any | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'recent' | 'drafts' | 'pending' | 'reimbursement'>('recent');

  const stats = useMemo(() => {
    const subs = data.submissions || [];
    const totalClaimed   = subs.reduce((a: number, s: any) => a + s.totalAmount, 0);
    const underReview    = subs.filter((s: any) => s.status === 'SUBMITTED').reduce((a: number, s: any) => a + s.totalAmount, 0);
    const approvedUnpaid = subs.filter((s: any) => s.status === 'APPROVED').reduce((a: number, s: any) => a + s.totalAmount, 0);
    const reimbursed     = subs.filter((s: any) => s.status === 'PAID').reduce((a: number, s: any) => a + s.totalAmount, 0);
    const advance        = data.advanceAmount || 0;
    
    // Derived stats for the new summary header
    const draftProjectsCount = data.draftProjects?.length || 0;
    const pendingApprovalCount = subs.filter((s: any) => s.status === 'SUBMITTED').length;
    const approvedUnpaidCount = subs.filter((s: any) => s.status === 'APPROVED').length;

    return { 
      totalClaimed, underReview, approvedUnpaid, reimbursed, advance,
      draftProjectsCount, pendingApprovalCount, approvedUnpaidCount
    };
  }, [data]);

  const filteredReports = useMemo(() => {
    const allReports = [
      ...(data.draftProjects || []).map((p: any) => ({ ...p, status: 'DRAFT' })),
      ...(data.submissions || [])
    ].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    switch (activeReportTab) {
      case 'drafts':
        return allReports.filter(r => r.status === 'DRAFT');
      case 'pending':
        return allReports.filter(r => r.status === 'SUBMITTED');
      case 'reimbursement':
        return allReports.filter(r => r.status === 'APPROVED');
      default:
        return allReports.slice(0, 5); // Show top 5 for "Recent"
    }
  }, [activeReportTab, data]);

  const handleAssignToProject = async (projectId: string) => {
    if (selectedExpenses.length === 0) return;
    setIsSubmitting(true);
    try {
      await assignExpensesToProject(projectId, selectedExpenses);
      setSelectedExpenses([]);
      setAssigningToProject(null);
    } catch (err) {
      console.error('Assignment failed', err);
      alert('Failed to assign expenses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to submit this project for approval?')) return;
    setIsSubmitting(true);
    try {
      await submitProject(projectId);
    } catch (err) {
      console.error('Submit failed', err);
      alert(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">
              My Expenses
            </h1>
            <p className="text-slate-500 font-medium italic">Track your project costs, drafts, and reimbursement status.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="group flex items-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl text-sm font-black text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all active:scale-95 shadow-sm"
            >
              <Calendar className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
              CREATE PROJECT
            </button>
            <button 
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
              ADD NEW EXPENSE
            </button>
          </div>
        </div>
      
      {/* Financial KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: 'Total Expenses', value: stats.totalClaimed, sub: 'Lifetime claims filed', icon: FileText, color: 'slate' },
            { label: 'Under Review', value: stats.underReview, sub: 'Awaiting manager approval', icon: Clock, color: 'amber' },
            { label: 'Approved', value: stats.approvedUnpaid, sub: 'Cleared, finance to pay', icon: CheckCircle, color: 'emerald' },
            { label: 'Advance Given', value: stats.advance, sub: 'Pre-paid by company', icon: CreditCard, color: 'indigo' },
            { label: 'Reimbursed', value: stats.reimbursed, sub: 'Paid out by finance', icon: TrendingUp, color: 'indigo' }
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl bg-white/80 backdrop-blur-xl border-white shadow-lg shadow-slate-200/50 hover:shadow-indigo-100`}
            >
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {stat.label}
                </p>
                <div className={`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900">
                ₹{stat.value.toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] font-medium mt-1.5 text-slate-400">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Combined Reports Section */}
          <div className="lg:col-span-2 space-y-8">
          {/* Quick Add Expenses Section (Moved to TOP) */}
          <section className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-8 border border-white shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-indigo-600" />
                  Quick Add Expenses
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Standalone expenses not yet assigned to a project.</p>
              </div>
              {selectedExpenses.length > 0 && (
                <div className="flex items-center space-x-3 animate-in fade-in slide-in-from-right-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedExpenses.length} Selected</span>
                  <select 
                    onChange={(e) => handleAssignToProject(e.target.value)}
                    className="text-[10px] font-black border-slate-200 rounded-xl bg-white text-indigo-600 focus:ring-indigo-500 py-2 pl-3 pr-8 shadow-sm"
                  >
                    <option value="">Assign to Project...</option>
                    {data.draftProjects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
              {data.drafts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center p-5 bg-slate-50 rounded-full mb-4">
                    <FileText className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">All caught up!</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium italic">Create new project expenses to see them here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.drafts.map((expense: any) => (
                    <div key={expense.id} className="p-5 hover:bg-indigo-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                      <div className="flex items-center space-x-4">
                        <input 
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedExpenses(prev => [...prev, expense.id]);
                            else setSelectedExpenses(prev => prev.filter(id => id !== expense.id));
                          }}
                          className="h-4 w-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                        />
                        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black group-hover:bg-white group-hover:shadow-sm transition-all flex-shrink-0">
                          {expense.expenseHead[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="text-sm font-black text-slate-900 truncate">{expense.expenseHead}</p>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{expense.expenseType}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight" suppressHydrationWarning>
                            {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end sm:space-x-6">
                        <p className="text-base font-black text-slate-900">₹{expense.amount.toLocaleString('en-IN')}</p>
                        <div className="flex space-x-1 sm:opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleEdit(expense)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-slate-100 transition-all active:scale-90">
                            <Plus className="h-4 w-4" />
                          </button>
                          <button onClick={() => {/* delete logic */}} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 shadow-sm border border-transparent hover:border-slate-100 transition-all active:scale-90">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Reports Summary Section (Moved to BOTTOM) */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Reports Summary</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {[
                { id: 'recent', label: 'Most Recent', sub: 'Reports' },
                { id: 'drafts', label: 'Unsubmitted Reports', sub: `${stats.draftProjectsCount} ${stats.draftProjectsCount === 1 ? 'Report' : 'Reports'}` },
                { id: 'pending', label: 'Awaiting Approval', sub: `${stats.pendingApprovalCount} ${stats.pendingApprovalCount === 1 ? 'Report' : 'Reports'}` },
                { id: 'reimbursement', label: 'Awaiting Reimbursement', sub: `${stats.approvedUnpaidCount} ${stats.approvedUnpaidCount === 1 ? 'Report' : 'Reports'} (₹${stats.approvedUnpaid.toLocaleString('en-IN')})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveReportTab(tab.id as any)}
                  className={`px-8 py-6 text-left transition-all relative group ${
                    activeReportTab === tab.id ? 'bg-pink-50/10' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <p className={`text-[11px] font-black uppercase tracking-tight mb-1 ${
                    activeReportTab === tab.id ? 'text-[#d1127c]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    {tab.label}
                  </p>
                  <p className={`text-base font-black ${
                    activeReportTab === tab.id ? 'text-[#d1127c]' : 'text-slate-900'
                  }`}>
                    {tab.sub}
                  </p>
                  {activeReportTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#d1127c] animate-in fade-in slide-in-from-bottom-1 duration-300"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Report Details Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/30">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Details</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">To Be Reimbursed</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <FolderOpen className="h-10 w-10 text-slate-200 mb-4" />
                          <p className="text-sm font-bold text-slate-400 italic">No reports found for this category.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report: any) => (
                      <tr 
                        key={report.id} 
                        onClick={() => report.status !== 'DRAFT' && setViewingSub(report)}
                        className={`group transition-all duration-200 cursor-pointer ${
                          report.status === 'PAID' ? 'bg-indigo-50/20' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-5">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                              report.status === 'DRAFT' ? 'bg-slate-100 text-slate-400 group-hover:bg-slate-200' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                            }`}>
                              <FolderOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{report.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5" suppressHydrationWarning>
                                {new Date(report.startDate || report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' })} - 
                                {new Date(report.endDate || report.updatedAt || report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900">₹{report.totalAmount.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">({report.expenses?.length || 0} expenses)</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-black text-slate-900">
                            ₹{report.status === 'PAID' ? '0' : report.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                              report.status === 'PAID' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                              report.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              report.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                              report.status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                              'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              {report.status}
                            </span>
                            {report.status === 'DRAFT' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleSubmitProject(report.id); }}
                                className="p-2 hover:bg-indigo-600 hover:text-white rounded-xl text-indigo-600 transition-all active:scale-90"
                                title="Submit Project"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Help / Info */}
        <div className="space-y-6">
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/30">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-2xl font-black mb-3 tracking-tight">Reimbursement Policy</h4>
              <p className="text-indigo-100/90 text-sm leading-relaxed mb-8 font-medium">
                Ensure all bills are clear and readable. Submissions for the current month close on the last day. Payments are processed within 5-7 business days after final finance approval.
              </p>
              <button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95">
                VIEW DETAILED GUIDE
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden border border-slate-800">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <h4 className="text-lg font-black mb-6 flex items-center gap-3">
              <Clock className="h-5 w-5 text-indigo-400" />
              QUICK TIPS
            </h4>
            <ul className="space-y-5">
              {[
                { text: 'Attach clear receipts for faster manager approval.', icon: '📸' },
                { text: 'Bundle items into one submission to reduce audit cycles.', icon: '📦' },
                { text: 'Check comments if a submission is rejected.', icon: '💬' }
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <span className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-sm group-hover:bg-white/10 transition-colors">
                    {tip.icon}
                  </span>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 transition-colors">
                    {tip.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        </div>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
        configs={configs}
        expense={editingExpense}
      />

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        expenseHeads={configs.expenseHeads}
      />

      {/* Submission Detail Modal */}
      {viewingSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{viewingSub.name || 'Expense Submission'}</h2>
                <div className="flex items-center gap-3 mt-1">
                  {viewingSub.expenseHead && (
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{viewingSub.expenseHead}</span>
                  )}
                  <span className="text-xs text-slate-400">{viewingSub.month}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                    viewingSub.status === 'PAID' ? 'bg-indigo-100 text-indigo-700' :
                    viewingSub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    viewingSub.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{viewingSub.status}</span>
                </div>
              </div>
              <button onClick={() => setViewingSub(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {(viewingSub.expenses || []).map((exp: any) => (
                  <div key={exp.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{exp.expenseHead}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-medium text-slate-500" suppressHydrationWarning>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5">{exp.expenseType}</h4>
                        {exp.notes && <p className="text-sm text-slate-500 mt-1 italic">"{exp.notes}"</p>}
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-xl font-black text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</p>
                        {exp.billUrl && (
                          <a 
                            href={exp.billUrl} 
                            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(exp.billUrl, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" /> View Bill
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total footer */}
              <div className={`mt-6 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg ${
                viewingSub.status === 'REJECTED' ? 'bg-rose-600' :
                viewingSub.status === 'APPROVED' || viewingSub.status === 'PAID' ? 'bg-emerald-600' :
                'bg-indigo-600'
              }`}>
                <div>
                  <p className="text-white/70 text-sm font-medium">Total Amount</p>
                  <p className="text-3xl font-bold">₹{viewingSub.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm">Status</p>
                  <p className="text-lg font-black uppercase mt-0.5">{viewingSub.status}</p>
                  {viewingSub.status === 'REJECTED' && viewingSub.rejectionReason && (
                    <p className="text-xs text-white/80 mt-1 max-w-xs text-right">Reason: {viewingSub.rejectionReason}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
