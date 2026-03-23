import { useNavigate } from 'react-router-dom';
import { useAppStore, HOUSE_ROOMS } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import * as Icons from 'lucide-react';

export function Rooms() {
  const navigate = useNavigate();
  const { devices } = useAppStore();

  return (
    <div className="flex flex-col gap-4 p-4 pt-10 pb-24 max-w-md mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <p className="text-gray-500 font-medium">Manage your smart home spaces</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {HOUSE_ROOMS.map(room => {
           // Type casting to grab lucide icons dynamically by name string
           const Icon = (Icons as any)[room.icon] || Icons.Layout;
           
           const activeInRoom = room.devices.filter(d => {
              const state = devices[d]?.state;
              return state === 'ON' || state === 'DIM';
           }).length;
           
           return (
             <Card 
               key={room.id} 
               onClick={() => navigate(`/rooms/${room.id}`)}
               className="flex flex-col p-5 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
             >
                <div className="mb-auto z-10">
                  <div className={`rounded-xl w-10 h-10 flex items-center justify-center mb-4 transition-colors ${activeInRoom > 0 ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon size={20} />
                  </div>
                </div>
                
                <div className="z-10 mt-6">
                  <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {activeInRoom} / {room.devices.length} active
                  </p>
                </div>

                {/* Decorative background */}
                {activeInRoom > 0 && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-100/50 rounded-full blur-2xl group-hover:bg-primary-200/50 transition-colors" />
                )}
             </Card>
           );
        })}
      </div>
    </div>
  );
}
