import { Outlet } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

export function AppShell() {
  // Initialize global websocket for Web app
  useWebSocket();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SmartHome Demo</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
           <span>Live Dashboard</span>
           <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
           </span>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-6 max-w-[1600px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
