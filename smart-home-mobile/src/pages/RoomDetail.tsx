import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, Lightbulb, Fan, Thermometer, Settings as TvIcon } from 'lucide-react';
import { useAppStore, HOUSE_ROOMS } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Slider } from '../components/ui/Slider';
import { sendDeviceCommand } from '../services/api';
import { AppDevice } from '../types';
import { cn } from '../utils/cn';

export function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { household, devices, updateDeviceState, updateDeviceBrightness, updateDeviceTemperature } = useAppStore();
  
  const room = HOUSE_ROOMS.find(r => r.id === roomId);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <p className="text-gray-500">Room not found</p>
        <button className="mt-4 text-primary-600 font-medium" onClick={() => navigate('/rooms')}>Go back</button>
      </div>
    );
  }

  const roomDevices = room.devices.map(id => devices[id]).filter(Boolean);

  /* Device Interaction Handlers */
  const handleToggle = async (device: AppDevice) => {
    try {
      setLoadingMap(prev => ({ ...prev, [device.id]: true }));
      // Optimistic update locally
      const isSwitchOn = device.state === 'ON' || device.state === 'DIM';
      const pendingState = isSwitchOn ? 'OFF' : 'ON';
      updateDeviceState(device.id, pendingState);

      // Send Command
      await sendDeviceCommand({
         household,
         device: device.id,
         command: 'toggle'
      });
      // The websocket hook will sync the true state back shortly
    } catch (error) {
       console.error('Toggle failed', error);
       // Revert UI on failure
       const isSwitchOn = device.state === 'ON' || device.state === 'DIM';
       updateDeviceState(device.id, isSwitchOn ? 'ON' : 'OFF'); // rough revert
    } finally {
       setLoadingMap(prev => ({ ...prev, [device.id]: false }));
    }
  };

  const handleBrightnessChange = async (device: AppDevice, newBrightness: number) => {
     updateDeviceBrightness(device.id, newBrightness);
     try {
       // Convert frontend slider abstraction to backend categorical values
       let backendVal: 'ON' | 'OFF' | 'DIM' = 'DIM';
       if (newBrightness === 0) backendVal = 'OFF';
       if (newBrightness === 100) backendVal = 'ON';
       
       await sendDeviceCommand({
         household,
         device: device.id,
         command: 'set',
         value: backendVal
       });
     } catch (err) {
       console.error('Brightness setting failed', err);
     }
  };
  
  const handleTemperatureChange = async (device: AppDevice, newTemp: number) => {
     updateDeviceTemperature(device.id, newTemp);
     // Backend doesn't support temp control specifically, but we'll ensure it's ON if changed and > 16.
     // In a real implementation we'd probably map to 'set ON' if we adjust the slider above minimum.
     if (device.state === 'OFF') {
       try {
         await sendDeviceCommand({
           household,
           device: device.id,
           command: 'set',
           value: 'ON'
         });
       } catch (err) {
          console.error('AC setting failed', err);
       }
     }
  };

  /* Render Helper */
  const renderDeviceCard = (device: AppDevice) => {
    const isSwitchOn = device.state === 'ON' || device.state === 'DIM';
    const isLoading = loadingMap[device.id];
    
    // Icon Mapping
    let activeColor = "text-primary-500";
    let Icon = Lightbulb;
    if (device.type === 'ac') { Icon = Thermometer; activeColor = 'text-blue-500'; }
    else if (device.type === 'fan') { Icon = Fan; activeColor = 'text-teal-500'; }
    else if (device.type === 'generic') { Icon = TvIcon; activeColor = 'text-purple-500'; }

    return (
      <Card key={device.id} className="flex flex-col p-5 gap-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex justify-between items-start z-10 w-full mb-2">
            <div className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
               isSwitchOn ? "bg-primary-50 " + activeColor : "bg-gray-100 text-gray-400"
            )}>
               <Icon size={24} className={isLoading ? "animate-pulse" : ""} />
            </div>
            
            <Switch 
               checked={isSwitchOn} 
               onCheckedChange={() => handleToggle(device)} 
               disabled={isLoading}
               className={isSwitchOn ? "bg-primary-500" : "bg-gray-200"}
            />
        </div>

        <div className="z-10">
           <h3 className="font-bold text-gray-900 text-lg tracking-tight">{device.name}</h3>
           <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
             {device.state === 'DIM' ? `${device.brightness}% DIMMED` : device.state}
           </p>
        </div>

        {/* Dynamic Controls based on UI type */}
        <div className="mt-2 z-10">
           {device.type === 'light' && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-gray-500 font-medium font-mono">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <Slider 
                  value={device.brightness || 0} 
                  onChange={(v) => handleBrightnessChange(device, v)} 
                  disabled={!isSwitchOn || isLoading}
                />
              </div>
           )}

           {device.type === 'ac' && (
              <div className="flex flex-col gap-2 mt-4">
                 <div className="flex flex-col items-center justify-center -space-y-1 mb-2">
                   <div className="flex items-start">
                     <span className={cn("text-5xl font-extrabold tracking-tighter", isSwitchOn ? "text-gray-900" : "text-gray-300")}>{device.temperature || 24}</span>
                     <span className={cn("text-xl font-bold mt-1", isSwitchOn ? "text-gray-500" : "text-gray-300")}>°C</span>
                   </div>
                 </div>
                 <Slider 
                    min={16} max={30} step={1}
                    value={device.temperature || 24} 
                    onChange={(v) => handleTemperatureChange(device, v)} 
                    disabled={!isSwitchOn || isLoading}
                 />
                 <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
                   <span>16°</span>
                   <span>30°</span>
                 </div>
              </div>
           )}
        </div>

        {/* Decorative background flare */}
        {isSwitchOn && (
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/50 rounded-bl-full pointer-events-none transition-all" />
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg-light">
      <header className="sticky top-0 bg-bg-light/80 backdrop-blur-md z-30 pt-10 pb-4 px-4 flex items-center justify-between mx-auto w-full max-w-md">
        <button 
           onClick={() => navigate(-1)} 
           className="p-2 -ml-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-800"
        >
           <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
        <div className="w-10" /> {/* Balances header */}
      </header>
      
      <div className="flex flex-col gap-5 p-4 max-w-md mx-auto w-full pb-24 flex-1">
         {roomDevices.length === 0 ? (
           <div className="text-center p-8">
             <p className="text-gray-500 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">No devices in this room yet.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 gap-5">
             {roomDevices.map(renderDeviceCard)}
           </div>
         )}
      </div>
    </div>
  );
}
