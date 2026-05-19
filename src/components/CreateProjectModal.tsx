'use client';

import { useState } from 'react';
import { createProject } from '@/app/actions/expense';
import { Button } from '@/components/ui/Button';
import { X, Calendar } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseHeads: any[];
}

export function CreateProjectModal({ isOpen, onClose, expenseHeads }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createProject(formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md animate-in zoom-in-95 duration-300">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">New Expense Project</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
          </div>
          
          <form action={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="e.g., Client Visit Q1"
                className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 p-3" 
              />
              <p className="mt-2 text-xs text-slate-400">Give this project a clear name for identification.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                <input 
                  type="date" 
                  name="startDate" 
                  required 
                  className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                <input 
                  type="date" 
                  name="endDate" 
                  required 
                  className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={loading}
                className="flex-1"
              >
                Create Project
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
