import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, HOUSE_ROOMS } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchDeviceStates } from '../services/api';
import { Activity, Power } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { household, devices, predictions, setAllDevices } = useAppStore();

  useEffect(() => {
    async function loadStates() {
      try {
        const data = await fetchDeviceStates(household);
        if (data && data.devices) {
          setAllDevices(data.devices);
        }
      } catch (err) {
        console.error('Failed to init device states', err);
      }
    }
    loadStates();
  }, [household, setAllDevices]);

  const latestPrediction = predictions.length > 0 ? predictions[0] : null;
  const activeDevicesCount = Object.values(devices).filter(d => d.state === 'ON' || d.state === 'DIM').length;

  return (
    <div className="flex flex-col gap-6 p-4 pt-10 pb-20 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Home</h1>
          <p className="text-gray-500 font-medium">Household: {household}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center border-2 border-white shadow-sm ring-4 ring-primary-50">
          <span className="text-xl font-bold flex items-center justify-center text-primary-600">
             {household.slice(-2)}
          </span>
        </div>
      </header>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col gap-2 p-4 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/rooms')}>
           <div className="rounded-full bg-blue-100 w-10 h-10 flex items-center justify-center mb-1">
              <Power className="text-blue-600 w-5 h-5" />
           </div>
           <h3 className="font-semibold text-gray-900 text-lg">Devices On</h3>
           <p className="text-3xl font-bold text-blue-600">{activeDevicesCount} <span className="text-sm font-normal text-gray-500">active</span></p>
        </Card>

        <Card className="flex flex-col gap-2 p-4 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/notifications')}>
           <div className="rounded-full bg-purple-100 w-10 h-10 flex items-center justify-center mb-1">
              <Activity className="text-purple-600 w-5 h-5" />
           </div>
           <h3 className="font-semibold text-gray-900 text-lg">AI Status</h3>
           <p className="text-sm font-medium text-purple-600 leading-tight">
             {latestPrediction ? 'Active tracking' : 'Standby'}
           </p>
        </Card>
      </div>

      {/* Prediction Banner */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">Latest Activity</h2>
        </div>
        <Card className="border-l-4 border-l-primary-500 overflow-hidden relative">
          {latestPrediction ? (
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="primary">AI Prediction</Badge>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                   {new Date(latestPrediction.matched_timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900 tracking-tight">
                {latestPrediction.activity.replace(/_/g, ' ')}
              </p>
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                 Confidence: <span className="font-semibold ml-1 text-gray-700">{Math.round(latestPrediction.confidence * 100)}%</span>
              </p>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-gray-500 text-sm">No recent activities detected. The system is monitoring your household.</p>
            </div>
          )}
          {/* Decorative background blur */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary-100 blur-3xl rounded-full opacity-60 pointer-events-none" />
        </Card>
      </section>

      {/* Quick Rooms Access */}
      <section>
        <div className="flex justify-between items-center mb-3 mt-2">
          <h2 className="text-lg font-bold text-gray-900">Rooms</h2>
          <button onClick={() => navigate('/rooms')} className="text-sm text-primary-600 font-semibold hover:text-primary-700">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-4 px-4">
          {HOUSE_ROOMS.map(room => {
             const activeInRoom = room.devices.filter(d => {
                const state = devices[d]?.state;
                return state === 'ON' || state === 'DIM';
             }).length;
             
             return (
               <Card 
                 key={room.id} 
                 className="flex-shrink-0 w-[140px] snap-start cursor-pointer active:scale-95 transition-transform"
                 onClick={() => navigate(`/rooms/${room.id}`)}
               >
                 <div className="mb-8 font-semibold text-gray-700">{room.name}</div>
                 <div className="flex justify-between items-end">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{activeInRoom} On</div>
                    <div className="w-2 h-2 rounded-full bg-blue-500" style={{ opacity: activeInRoom > 0 ? 1 : 0.2 }} />
                 </div>
               </Card>
             );
          })}
        </div>
      </section>
    </div>
  );
}
