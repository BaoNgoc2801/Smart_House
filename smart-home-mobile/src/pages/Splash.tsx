import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Splash() {
  const navigate = useNavigate();
  const household = useAppStore(s => s.household);

  useEffect(() => {
    // Artificial delay to show splash, then navigate based on status
    const timer = setTimeout(() => {
       if (household) {
           navigate('/dashboard', { replace: true });
       } else {
           // Not implemented yet, ideally navigate to household selection
           // For now, default to dashboard.
           navigate('/dashboard', { replace: true });
       }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate, household]);

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-primary-600 text-white">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="rounded-3xl bg-white/20 p-6 backdrop-blur-md shadow-xl">
          <Home size={64} className="text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">SmartHome</h1>
        <p className="text-primary-100 font-medium tracking-wide">Initializing system...</p>
      </div>
    </div>
  );
}
