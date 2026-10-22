import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
        };

        const borderColors = {
          success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-100',
          error: 'border-rose-500/30 bg-rose-950/80 text-rose-100',
          warning: 'border-amber-500/30 bg-amber-950/80 text-amber-100',
          info: 'border-cyan-500/30 bg-cyan-950/80 text-cyan-100',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${borderColors[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-wide">
                {typeof toast.title === 'string' ? toast.title : JSON.stringify(toast.title)}
              </h4>
              {toast.message && (
                <p className="text-xs text-slate-300 mt-1 break-words font-mono-code">
                  {typeof toast.message === 'string'
                    ? toast.message
                    : typeof toast.message === 'object' && toast.message !== null
                    ? ((toast.message as any).message || JSON.stringify(toast.message))
                    : String(toast.message)}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
