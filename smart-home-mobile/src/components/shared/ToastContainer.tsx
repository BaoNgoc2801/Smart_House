import { useAppStore } from '../../store/useAppStore';
import { X, Bell, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ToastContainer() {
  const toasts = useAppStore((s: any) => s.toasts);
  const removeToast = useAppStore((s: any) => s.removeToast);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-0 mt-safe bottom-auto left-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none mt-12 md:mt-4">
      {toasts.map((toast: any) => (
        <div 
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-top-5 fade-in duration-300"
        >
          <div className={cn("p-2 rounded-xl text-white shrink-0 shadow-sm", toast.type === 'prediction' ? 'bg-purple-500' : 'bg-blue-500')}>
             {toast.type === 'prediction' ? <Activity size={20} /> : <Bell size={20} />}
          </div>
          <div className="flex-1 mt-0.5">
            <h4 className="font-bold text-slate-800 leading-tight text-sm">{toast.title}</h4>
            <p className="text-xs text-slate-600 mt-1">{toast.body}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
