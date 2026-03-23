import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Activity, Info, Zap } from 'lucide-react';
import { cn } from '../utils/cn';

export function Notifications() {
  const { notifications, markNotificationRead, markAllRead } = useAppStore();

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <div className="flex flex-col h-full bg-bg-light max-w-md mx-auto">
      <header className="sticky top-0 bg-bg-light/80 backdrop-blur-md z-30 pt-10 pb-4 px-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
           <button 
             onClick={markAllRead} 
             className="text-sm font-medium text-primary-600 hover:text-primary-700"
           >
             Mark all read
           </button>
        )}
      </header>
      
      <div className="flex flex-col gap-3 p-4 pb-24 flex-1 overflow-y-auto">
         {notifications.length === 0 ? (
           <div className="text-center mt-20">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="text-gray-400" size={32} />
             </div>
             <h2 className="text-lg font-bold text-gray-900 mb-1">All Caught Up</h2>
             <p className="text-gray-500">You don't have any new notifications.</p>
           </div>
         ) : (
           notifications.map(notif => {
             const isPrediction = notif.type === 'prediction';
             const isDevice = notif.type === 'device';
             
             return (
               <Card 
                 key={notif.id} 
                 className={cn(
                   "p-4 cursor-pointer relative overflow-hidden transition-colors border",
                   notif.read ? "bg-white border-transparent shadow-sm" : "bg-primary-50 border-primary-100 shadow-md",
                 )}
                 onClick={() => !notif.read && markNotificationRead(notif.id)}
               >
                 {!notif.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500" />
                 )}
                 <div className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      isPrediction ? "bg-purple-100 text-purple-600" : 
                      isDevice ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    )}>
                      {isPrediction ? <Activity size={20} /> : isDevice ? <Zap size={20} /> : <Info size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                         <h3 className={cn("text-sm font-semibold truncate pr-2", notif.read ? "text-gray-700" : "text-gray-900")}>
                           {notif.title}
                         </h3>
                         <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap mt-0.5">
                           {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                       </div>
                       <p className={cn("text-sm line-clamp-2", notif.read ? "text-gray-500" : "text-gray-700")}>
                         {notif.body}
                       </p>
                    </div>
                 </div>
               </Card>
             );
           })
         )}
      </div>
    </div>
  );
}
