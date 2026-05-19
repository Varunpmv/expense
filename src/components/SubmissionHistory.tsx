'use client';

import { useState, useMemo } from 'react';
import { FileText, ChevronRight, Clock, CheckCircle, CreditCard, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

type Tab = 'latest' | 'pending' | 'month' | 'year';

const PAGE_SIZE = 6;

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'PAID'     ? 'bg-indigo-100 text-indigo-700' :
    status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
    status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  );
}

function SubIcon({ status }: { status: string }) {
  if (status === 'PAID')     return <CreditCard className="h-4 w-4" />;
  if (status === 'APPROVED') return <CheckCircle className="h-4 w-4" />;
  if (status === 'REJECTED') return <XCircle className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

function SubmissionRow({ sub, onView }: { sub: any; onView: (s: any) => void }) {
  const colorMap: Record<string, string> = {
    PAID:     'bg-indigo-50 text-indigo-600',
    APPROVED: 'bg-emerald-50 text-emerald-600',
    REJECTED: 'bg-rose-50 text-rose-600',
    SUBMITTED:'bg-amber-50 text-amber-600',
  };
  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center ${colorMap[sub.status] || colorMap.SUBMITTED}`}>
          <SubIcon status={sub.status} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{sub.name || `Submission ${sub.month}`}</p>
          <p className="text-[10px] text-slate-400 mt-0.5" suppressHydrationWarning>
            {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <div className="text-right">
          <p className="text-sm font-black text-slate-900">₹{sub.totalAmount.toLocaleString('en-IN')}</p>
          <StatusBadge status={sub.status} />
        </div>
        <button
          onClick={() => onView(sub)}
          className="text-indigo-600 hover:text-indigo-800 transition-colors"
          title="View Details"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function GroupSection({ label, subs, total, onView }: { label: string; subs: any[]; total: number; onView: (s: any) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-800">{label}</span>
          <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{subs.length} submission{subs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-slate-900">₹{total.toLocaleString('en-IN')}</span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="divide-y divide-slate-100 bg-white">
          {subs.map(s => <SubmissionRow key={s.id} sub={s} onView={onView} />)}
        </div>
      )}
    </div>
  );
}

export default function SubmissionHistory({ submissions, onView }: { submissions: any[]; onView: (s: any) => void }) {
  const [tab, setTab] = useState<Tab>('latest');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() =>
    [...submissions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [submissions]
  );

  const pending = useMemo(() => sorted.filter(s => s.status === 'SUBMITTED'), [sorted]);

  const byMonth = useMemo(() => {
    const groups: Record<string, any[]> = {};
    sorted.forEach(s => {
      const d = new Date(s.submittedAt);
      const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [sorted]);

  const byYear = useMemo(() => {
    const groups: Record<string, any[]> = {};
    sorted.forEach(s => {
      const key = new Date(s.submittedAt).getFullYear().toString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [sorted]);

  const latestPage = sorted.slice(0, page * PAGE_SIZE);
  const hasMore = latestPage.length < sorted.length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'latest',  label: 'Latest' },
    { id: 'pending', label: 'Pending', count: pending.length },
    { id: 'month',   label: 'By Month' },
    { id: 'year',    label: 'By Year' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-100 px-4 pt-3 gap-1 bg-slate-50/60">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`relative px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
              tab === t.id
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 border-b-white -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${
                tab === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === 'latest' && (
          <div>
            <div className="divide-y divide-slate-100">
              {latestPage.map(s => <SubmissionRow key={s.id} sub={s} onView={onView} />)}
            </div>
            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full mt-3 py-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors border border-dashed border-indigo-200"
              >
                Show more ({sorted.length - latestPage.length} remaining)
              </button>
            )}
          </div>
        )}

        {tab === 'pending' && (
          <div>
            {pending.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">No pending submissions!</p>
                <p className="text-xs text-slate-400 mt-1">All your claims have been processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.map(s => <SubmissionRow key={s.id} sub={s} onView={onView} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'month' && (
          <div>
            {Object.entries(byMonth).map(([month, subs]) => (
              <GroupSection
                key={month}
                label={month}
                subs={subs}
                total={subs.reduce((a, s) => a + s.totalAmount, 0)}
                onView={onView}
              />
            ))}
          </div>
        )}

        {tab === 'year' && (
          <div>
            {Object.entries(byYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, subs]) => (
              <GroupSection
                key={year}
                label={year}
                subs={subs}
                total={subs.reduce((a, s) => a + s.totalAmount, 0)}
                onView={onView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
