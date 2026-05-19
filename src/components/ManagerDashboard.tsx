'use client';

import { useState } from 'react';
import { updateSubmissionStatus, getSubmissionDetails } from '@/app/actions/expense';
import { Button } from './ui/Button';
import { FileText, ChevronRight, X, ExternalLink } from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';

export default function ManagerDashboard({ submissions }: { submissions: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewingSub, setViewingSub] = useState<any>(null);
  const [subExpenses, setSubExpenses] = useState<any[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  
  // Modal states
  const [confirmAction, setConfirmAction] = useState<{ id: string, status: 'APPROVED' | 'REJECTED' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAction = async () => {
    if (!confirmAction) return;
    const { id, status } = confirmAction;
    
    setLoadingId(id);
    try {
      await updateSubmissionStatus(id, status, status === 'REJECTED' ? rejectionReason : undefined);
      if (viewingSub?.id === id) setViewingSub(null);
      setConfirmAction(null);
      setRejectionReason('');
    } catch (err) {
      console.error(`Failed to ${status.toLowerCase()} submission`, err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleViewDetails = async (sub: any) => {
    setViewingSub(sub);
    setIsFetchingDetails(true);
    try {
      const details = await getSubmissionDetails(sub.id);
      setSubExpenses(details);
    } catch (err) {
      alert('Failed to load expense details');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">
              Approvals Workflow
            </h1>
            <p className="text-slate-500 font-medium italic">Review and manage employee expense submissions for reimbursement.</p>
          </div>
        </div>
      
      <div className="grid grid-cols-1 gap-6">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No Pending Submissions</h3>
            <p className="text-slate-500 mt-1">You're all caught up with your reviews.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] border border-slate-200/60 overflow-hidden animate-in zoom-in-95 duration-500">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Name</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Month</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Amount</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{sub.user.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{sub.user.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        {sub.name || sub.expenseHead || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-slate-500 font-bold">
                      {sub.month}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-base font-black text-slate-900">₹{sub.totalAmount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                        sub.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        sub.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleViewDetails(sub)}
                        className="bg-white border border-slate-200 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all active:scale-95 flex items-center gap-2 ml-auto group-hover:bg-indigo-50 group-hover:border-indigo-100"
                      >
                        VIEW DETAILS <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewingSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{viewingSub.name || 'Expense Submission'}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-slate-500 text-sm">Submitted by <span className="font-semibold text-slate-700">{viewingSub.user.name}</span></p>
                  {viewingSub.expenseHead && (
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{viewingSub.expenseHead}</span>
                  )}
                  <span className="text-xs text-slate-400">{viewingSub.month}</span>
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
                  <p className="text-slate-500">Loading expense details...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subExpenses.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-indigo-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{exp.expenseHead}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500" suppressHydrationWarning>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">{exp.expenseType}</h4>
                          {exp.notes && <p className="text-sm text-slate-600 mt-2 italic">"{exp.notes}"</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</p>
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
                  
                  <div className="bg-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-200">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium">Grand Total</p>
                      <p className="text-3xl font-bold">₹{viewingSub.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    {viewingSub.status === 'SUBMITTED' && (
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => setConfirmAction({ id: viewingSub.id, status: 'REJECTED' })}
                          variant="outline" 
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          disabled={loadingId === viewingSub.id}
                        >
                          Reject
                        </Button>
                        <Button 
                          onClick={() => setConfirmAction({ id: viewingSub.id, status: 'APPROVED' })}
                          variant="primary" 
                          className="bg-white text-indigo-600 hover:bg-indigo-50"
                          disabled={loadingId === viewingSub.id}
                        >
                          Approve All
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmAction}
        title={confirmAction?.status === 'APPROVED' ? 'Approve Submission' : 'Reject Submission'}
        message={confirmAction?.status === 'APPROVED' 
          ? "Are you sure you want to approve this expense submission? This will move it to the finance queue for payment."
          : "Please provide a reason for rejecting this submission. The employee will be notified."
        }
        type={confirmAction?.status === 'APPROVED' ? 'info' : 'danger'}
        confirmLabel={confirmAction?.status === 'APPROVED' ? 'Confirm Approval' : 'Reject Submission'}
        onConfirm={handleAction}
        onCancel={() => { setConfirmAction(null); setRejectionReason(''); }}
        showInput={confirmAction?.status === 'REJECTED'}
        inputValue={rejectionReason}
        onInputChange={setRejectionReason}
        inputPlaceholder="Reason for rejection..."
        isLoading={!!loadingId}
      />
      </div>
    </div>
  );
}

