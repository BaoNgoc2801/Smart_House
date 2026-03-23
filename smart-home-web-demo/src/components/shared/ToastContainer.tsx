import { useAppStore } from '../../store/useAppStore';
import { X, Bell, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ToastContainer() {
  const toasts = useAppStore(s => s.toasts);
  const removeToast = useAppStore(s => s.removeToast);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-2xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <div className={cn("p-2 rounded-xl text-white shrink-0 shadow-sm", toast.type === 'prediction' ? 'bg-purple-500' : 'bg-blue-500')}>
             {toast.type === 'prediction' ? <Activity size={20} /> : <Bell size={20} />}
          </div>
          <div className="flex-1 mt-0.5">
            <h4 className="font-bold text-slate-800 leading-tight">{toast.title}</h4>
            <p className="text-sm text-slate-600 mt-1">{toast.body}</p>
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
