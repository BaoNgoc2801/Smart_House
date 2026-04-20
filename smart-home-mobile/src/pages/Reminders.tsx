import { useEffect, useState, useCallback, useRef } from 'react';
import { predictCurrentTime, ReminderResult } from '../services/reminderApi';
import { useAppStore } from '../store/useAppStore';
import { Bell, Clock, Pill, Moon, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function Reminders() {
  const { addNotification, addToast } = useAppStore();
  const [result, setResult] = useState<ReminderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictCurrentTime();
      setResult(res);
      setLastRefresh(new Date());

      // Only fire notification if status changed
      if (res.status !== 'none' && res.status !== prevStatusRef.current) {
        prevStatusRef.current = res.status;

        const title = res.status === 'medication_time'
          ? '💊 Medication Reminder'
          : '😴 Sleep Reminder';

        addNotification({ title, body: res.message, type: 'prediction' });
        addToast({ title, body: res.message, type: 'prediction' });

        // Browser / PWA notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new window.Notification(title, { body: res.message, icon: '/vite.svg' });
        }
      } else if (res.status === 'none') {
        prevStatusRef.current = 'none';
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  }, [addNotification, addToast]);

  // Auto-run on mount and every 5 minutes
  useEffect(() => {
    runPrediction();
    const timer = setInterval(runPrediction, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [runPrediction]);

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const statusConfig = {
    medication_time: {
      Icon: Pill,
      bgClass: 'bg-amber-50 border-amber-200',
      iconClass: 'bg-amber-100 text-amber-600',
      textClass: 'text-amber-800',
      label: 'Medication Time',
      description: 'Time to take your medication',
    },
    sleep_time: {
      Icon: Moon,
      bgClass: 'bg-indigo-50 border-indigo-200',
      iconClass: 'bg-indigo-100 text-indigo-600',
      textClass: 'text-indigo-800',
      label: 'Sleep Time',
      description: 'Time to go to sleep',
    },
    none: {
      Icon: CheckCircle,
      bgClass: 'bg-green-50 border-green-200',
      iconClass: 'bg-green-100 text-green-600',
      textClass: 'text-green-800',
      label: 'All Good',
      description: 'No reminders right now',
    },
  };

  const current = result ? statusConfig[result.status] : null;

  return (
    <div className="flex flex-col gap-5 p-4 pt-10 pb-24 max-w-md mx-auto">

      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-500 text-sm mt-0.5">AI-powered health reminders</p>
      </header>

      {/* Current Time Card */}
      <div className="glass rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Time</p>
          <p className="text-3xl font-black text-slate-900">{timeStr}</p>
          <p className="text-sm text-slate-500 mt-1">{dateStr}</p>
        </div>
        <div className="rounded-full bg-blue-100 p-4">
          <Clock className="text-blue-600" size={28} />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-800 text-sm">Could not get prediction</p>
            <p className="text-red-600 text-xs mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Status Card */}
      {loading && !result && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {current && result && (
        <div className={cn('rounded-2xl border p-5 flex flex-col gap-4', current.bgClass)}>
          <div className="flex items-center gap-4">
            <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', current.iconClass)}>
              <current.Icon size={28} />
            </div>
            <div>
              <p className={cn('text-lg font-bold', current.textClass)}>{current.label}</p>
              <p className={cn('text-sm font-medium', current.textClass, 'opacity-80')}>{current.description}</p>
            </div>
          </div>

          {/* Prediction details */}
          <div className="bg-white/60 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Detected Activity</span>
              <span className="font-bold text-slate-900">{result.activity.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Confidence</span>
              <span className="font-bold text-slate-900">{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 mt-1">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alert Banner for active reminders */}
      {result?.status !== 'none' && result && (
        <div className="flex gap-3 items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <Bell className="text-blue-500 shrink-0" size={20} />
          <p className="text-sm font-semibold text-slate-800">{result.message}</p>
        </div>
      )}

      {/* Refresh info */}
      {lastRefresh && (
        <p className="text-center text-xs text-slate-400">
          Last updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          {' · '} Auto-refreshes every 5 minutes
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={runPrediction}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Checking...' : 'Check Now'}
        </button>
      </div>
    </div>
  );
}
