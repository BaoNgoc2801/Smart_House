import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DEVICE_POSITIONS } from '../constants/floorplan';
import floorplanImage from '../assets/img/hh124.png';
import { DeviceNode } from '../components/shared/DeviceNode';
import { fetchDeviceStates, sendDeviceCommand, triggerPrediction } from '../services/api';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Activity, Bell, Map, Radio } from 'lucide-react';
import { getPredictionMessage } from '../utils/predictionMessages';
import { ToastContainer } from '../components/shared/ToastContainer';
import { cn } from '../utils/cn';

export function HomeDemo() {
  const { household, devices, predictions, setAllDevices, updateDeviceState } = useAppStore();
  const { speak } = useTextToSpeech();
  
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  
  const lastSpokenPredictionRef = useRef<string | null>(null);

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

  // Request browser notification permission
  const requestNotifications = async () => {
     if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
     }
  };

  const latestPrediction = predictions.length > 0 ? predictions[0] : null;
  
  useEffect(() => {
    if (!latestPrediction) return;
    
    // Create a unique key for the prediction event (we use matched_timestamp or confidence + activity)
    const predKey = `${latestPrediction.activity}_${latestPrediction.matched_timestamp || latestPrediction.confidence}`;
    
    if (predKey !== lastSpokenPredictionRef.current) {
       lastSpokenPredictionRef.current = predKey;
       
       const msgData = getPredictionMessage(latestPrediction.activity);

       // Show system browser notification if permitted
       if (notificationPermission === 'granted') {
          new window.Notification(msgData.title, {
            body: msgData.body,
            icon: '/vite.svg'
          });
       }

       if (latestPrediction.activity) {
         speak(msgData.speech);
       }
    }
  }, [latestPrediction, speak, notificationPermission]);

  // Handle clicking a node on the floorplan to toggle it
  const handleToggleDevice = async (device: any) => {
    setLoadingMap(prev => ({ ...prev, [device.id]: true }));
    try {
      const isSwitchOn = device.state === 'ON' || device.state === 'DIM';
      const pendingState = isSwitchOn ? 'OFF' : 'ON';
      
      // Optimistic update
      updateDeviceState(device.id, pendingState);
      
      // Rest API call (Websocket will broadcast to mobile and back)
      await sendDeviceCommand({
         household,
         device: device.id,
         command: 'toggle'
      });
    } catch (err) {
      console.error('Toggle failed', err);
      const isSwitchOn = device.state === 'ON' || device.state === 'DIM';
      updateDeviceState(device.id, isSwitchOn ? 'ON' : 'OFF');
    } finally {
      setLoadingMap(prev => ({ ...prev, [device.id]: false }));
    }
  };

  const requestPrediction = async () => {
    setIsPredicting(true);
    setPredictionError(null);
    try {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const timeOnly = `${h}:${m}`;
      await triggerPrediction({ household, time_only: timeOnly });
    } catch (err: any) {
      const msg = err?.message ?? 'Prediction failed';
      setPredictionError(msg);
      console.error('[Predict]', msg);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 h-[calc(100vh-6rem)]">
        
        {/* LEFT PANEL: Controls, History, Predictions */}
      <aside className="lg:col-span-1 xl:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* System Status Summary */}
        <section className="glass rounded-2xl p-5 shadow-sm border border-slate-200 backdrop-blur-xl">
           <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
             <Radio size={16} /> Connection Status
           </h2>
           <div className="flex flex-col gap-3">
             <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-white">
                <span className="font-semibold text-slate-700">Household</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-sm font-bold border border-slate-200">{household}</span>
             </div>
             <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-white">
                <span className="font-semibold text-slate-700">Web Socket</span>
                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded shadow-sm text-xs font-bold uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
             </div>
             
             {notificationPermission !== 'granted' && (
                <button 
                  onClick={requestNotifications}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <Bell size={16} /> Enable Alerts
                </button>
             )}
           </div>
        </section>

        {/* Predict Now Button */}
        <div className="flex flex-col gap-2 mb-2">
          <button
            onClick={requestPrediction}
            disabled={isPredicting}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50 text-sm font-semibold"
          >
            <Activity size={15} className={isPredicting ? 'animate-spin' : ''} />
            {isPredicting ? 'Predicting...' : 'Predict Now (current time)'}
          </button>
          {predictionError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {predictionError}
            </p>
          )}
        </div>

        {/* AI Prediction Panel */}
        <section className="glass rounded-2xl p-5 shadow-sm border border-slate-200 flex-1 flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} /> AI Engine
              </h2>
              {latestPrediction && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
           </div>
           
           {latestPrediction ? (
             <div className="flex-1 flex flex-col">
               <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5 text-center shadow-inner relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-300 blur-3xl opacity-30 rounded-full" />
                 
                 <p className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-widest">Detected Activity</p>
                 <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                   {latestPrediction.activity.replace(/_/g, ' ')}
                 </h3>
                 
                 <div className="w-full bg-white/60 rounded-full h-3 mb-2 overflow-hidden border border-purple-100">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.round(latestPrediction.confidence * 100)}%` }} 
                    />
                 </div>
                 <p className="text-sm font-semibold text-slate-600">
                    {Math.round(latestPrediction.confidence * 100)}% Confidence Match
                 </p>
               </div>
               
               <div className="mt-6 flex-1">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Event Timeline</h4>
                 <div className="space-y-3">
                   {predictions.slice(0, 5).map((p, i) => (
                      <div key={i} className={cn("p-3 rounded-xl flex items-center justify-between border", i === 0 ? "bg-white border-purple-100 shadow-sm" : "bg-transparent border-transparent opacity-60")}>
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-800 tracking-tight">{p.activity.replace(/_/g, ' ')}</span>
                           <span className="text-xs text-slate-500 font-medium">{Math.round(p.confidence * 100)}% Match</span>
                         </div>
                         <div className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                           {p.matched_timestamp ? new Date(p.matched_timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) : 'Now'}
                         </div>
                      </div>
                   ))}
                 </div>
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                 <Activity size={48} className="mb-4 opacity-20" />
                 <p className="font-medium">Monitoring environment models.</p>
                 <p className="text-sm mt-1">Awaiting next backend prediction event...</p>
             </div>
           )}
        </section>
      </aside>

      {/* RIGHT PANEL: Interactive Floorplan Canvas */}
      <section className="col-span-1 lg:col-span-3 xl:col-span-4 relative rounded-3xl overflow-hidden glass shadow-xl border border-slate-200/60 bg-white/40 flex items-center justify-center p-8">
         <div className="absolute top-6 left-6 z-30">
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm font-semibold text-slate-700">
              <Map size={20} className="text-blue-600" />
              House Floorplan (hh124)
            </div>
         </div>

         {/* Floorplan Container: Maintains aspect ratio and bounds the absolute positioning */}
         <div className="relative w-full max-w-4xl aspect-[4/3] bg-white rounded-xl shadow-inner border border-slate-100 overflow-hidden mix-blend-multiply">
            {/* The Image */}
            <img 
               src={floorplanImage} 
               alt="Household Floorplan" 
               className="absolute inset-0 w-full h-full object-contain opacity-80"
            />
            
            {/* The Device Node Overlays */}
            {DEVICE_POSITIONS.map((pos) => {
               const device = devices[pos.id];
               if (!device) return null;
               
               return (
                  <DeviceNode 
                    key={device.id}
                    device={device}
                    position={pos}
                    onToggle={handleToggleDevice}
                    isLoading={loadingMap[device.id]}
                  />
               );
            })}
         </div>
         
          <div className="absolute bottom-6 right-6 z-30 glass px-4 py-3 rounded-xl shadow-lg border border-white text-sm max-w-xs text-slate-600 font-medium leading-relaxed">
             <strong>Interactive Demo:</strong> Click any device node on the map to toggle its power state. Realtime syncing with the mobile application is active.
          </div>
       </section>

     </div>
    </>
  );
}
