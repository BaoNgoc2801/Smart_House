import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Bell, LayoutGrid, Pill } from 'lucide-react';
import { ToastContainer } from '../components/shared/ToastContainer';
import { cn } from '../utils/cn';
import { useAppStore } from '../store/useAppStore';
import { useWebSocket } from '../hooks/useWebSocket';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = useAppStore(s => s.notifications.filter(n => !n.read).length);

  // Maintain persistent WebSocket connection across all core app views
  useWebSocket();

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Rooms', path: '/rooms', icon: LayoutGrid },
    { label: 'Reminders', path: '/reminders', icon: Pill, badge: undefined as number | undefined },
    { label: 'Alerts', path: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-bg-light overflow-hidden">
      <ToastContainer />
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-safe">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="glass sticky bottom-0 border-t border-gray-200/50 pb-safe-bottom">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-full h-full text-xs font-medium space-y-1 transition-colors"
                aria-label={item.label}
              >
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-300',
                  isActive ? 'bg-primary-100 text-primary-600 scale-110' : 'text-gray-500 hover:text-gray-900 group-hover:bg-gray-100'
                )}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge !== undefined && (
                    <span className="absolute top-1 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'transition-all duration-300',
                  isActive ? 'text-primary-600 font-semibold' : 'text-gray-500'
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
