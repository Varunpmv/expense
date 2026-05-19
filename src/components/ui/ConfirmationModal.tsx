'use client';

import { X, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  inputPlaceholder?: string;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  type = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  showInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder = 'Enter details...',
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertCircle className="h-6 w-6 text-rose-600" />,
    warning: <AlertCircle className="h-6 w-6 text-amber-600" />,
    info: <HelpCircle className="h-6 w-6 text-indigo-600" />,
    success: <CheckCircle className="h-6 w-6 text-emerald-600" />,
  };

  const colors = {
    danger: 'bg-rose-50',
    warning: 'bg-amber-50',
    info: 'bg-indigo-50',
    success: 'bg-emerald-50',
  };

  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const, // We don't have warning variant in Button.tsx, using primary
    info: 'primary' as const,
    success: 'primary' as const,
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${colors[type]}`}>
              {icons[type]}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        
        <div className="px-6 py-6">
          <p className="text-slate-600 leading-relaxed">{message}</p>
          
          {showInput && (
            <div className="mt-4">
              <textarea
                autoFocus
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[100px] resize-none"
              />
            </div>
          )}
        </div>
        
        <div className="px-6 py-6 bg-slate-50/50 flex space-x-3">
          <Button 
            variant="outline" 
            className="flex-1 bg-white" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'} 
            className="flex-1" 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
