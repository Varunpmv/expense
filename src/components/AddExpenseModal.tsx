'use client';

import { useState, useEffect } from 'react';
import { addExpense, updateExpense } from '@/app/actions/expense';
import { Button } from '@/components/ui/Button';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: {
    accounts: any[];
    expenseHeads: any[];
    expenseTypes: any[];
    customFields: any[];
  };
  expense?: any | null; // Pass an expense to edit
}

export function AddExpenseModal({ isOpen, onClose, configs, expense }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');

  useEffect(() => {
    if (expense) {
      setDate(new Date(expense.date).toISOString().split('T')[0]);
    } else {
      setDate('');
    }
  }, [expense]);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (expense) {
        await updateExpense(expense.id, formData);
      } else {
        await addExpense(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                  {expense ? 'Edit Draft Expense' : 'Add New Expense'}
                </h3>
                
                <form action={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" name="date" required defaultValue={date} max={new Date().toISOString().split('T')[0]} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                    <input type="number" step="0.01" name="amount" required defaultValue={expense?.amount} placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account</label>
                    <select name="account" required defaultValue={expense?.account || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                      <option value="">Select Account</option>
                      {configs.accounts.map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expense Head</label>
                    <select name="expenseHead" required defaultValue={expense?.expenseHead || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                      <option value="">Select Head</option>
                      {configs.expenseHeads.map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expense Type</label>
                    <select name="expenseType" required defaultValue={expense?.expenseType || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                      <option value="">Select Type</option>
                      {configs.expenseTypes.map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
                    </select>
                  </div>
                  
                  {/* Dynamic Custom Fields */}
                  {configs.customFields?.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700">{field.name} {field.required && <span className="text-red-500">*</span>}</label>
                      {field.type === 'SELECT' ? (
                        <select 
                          name={`custom_${field.name}`} 
                          required={field.required} 
                          defaultValue={expense?.customFields?.[field.name] || ''}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        >
                          <option value="">Select Option</option>
                          {field.options?.split(',').map((opt: string) => (
                            <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          name={`custom_${field.name}`} 
                          required={field.required} 
                          defaultValue={expense?.customFields?.[field.name] || ''}
                          placeholder={`Enter ${field.name.toLowerCase()}...`}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bill Upload (Optional)</label>
                    <input type="file" name="bill" accept="image/*,.pdf,.xlsx,.xls,.csv" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    {expense?.billUrl && <p className="text-xs text-gray-500 mt-1">Current file uploaded. Upload a new one to replace it.</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea name="notes" rows={3} defaultValue={expense?.notes || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Optional notes..."></textarea>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 -mx-4 -mb-4 mt-8 rounded-b-xl">
                    <Button type="submit" variant="primary" disabled={loading} className="w-full sm:ml-3 sm:w-auto">
                      {loading ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="mt-3 w-full sm:mt-0 sm:w-auto">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
