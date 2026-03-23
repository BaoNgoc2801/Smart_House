import type { AppDevice } from '../../types';
import { Lightbulb, Thermometer, Settings as TvIcon, Fan } from 'lucide-react';
import type { DevicePosition } from '../../constants/floorplan';
import { cn } from '../../utils/cn';

interface DeviceNodeProps {
  device: AppDevice;
  position: DevicePosition;
  onToggle: (device: AppDevice) => void;
  isLoading: boolean;
}

export function DeviceNode({ device, position, onToggle, isLoading }: DeviceNodeProps) {
  const isSwitchOn = device.state === 'ON' || device.state === 'DIM';
  
  // Icon Mapping
  let activeColor = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]";
  let activeBg = "bg-yellow-500/20";
  let Icon = Lightbulb;
  
  if (device.type === 'ac') { 
    Icon = Thermometer; 
    activeColor = 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]'; 
    activeBg = "bg-blue-500/20";
  } else if (device.type === 'fan') { 
    Icon = Fan; 
    activeColor = 'text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]'; 
    activeBg = "bg-teal-500/20";
  } else if (device.type === 'generic') { 
    Icon = TvIcon; 
    activeColor = 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'; 
    activeBg = "bg-purple-500/20";
  }

  return (
    <div 
      className="absolute group z-10 transition-transform duration-300 hover:scale-110 hover:z-20 cursor-pointer"
      style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
      onClick={() => onToggle(device)}
    >
       {/* Device Tooltip Badge - Shows on Hover */}
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="glass-dark px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xl flex items-center gap-2">
             <span>{device.name}</span>
             <span className={cn("px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", isSwitchOn ? "bg-white/20" : "bg-black/40 text-slate-400")}>
               {device.state}
             </span>
          </div>
       </div>

       {/* Interactive Marker Node */}
       <div className={cn(
         "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 shadow-lg",
         isSwitchOn ? `border-white/50 ${activeBg}` : "bg-slate-800/80 border-slate-600/50 hover:bg-slate-700/80",
         isLoading && 'animate-pulse cursor-wait'
       )}>
          {/* Inner Glow effect when ON */}
          {isSwitchOn && (
            <div className={`absolute inset-0 rounded-full blur-md opacity-50 ${activeColor.split(' ')[0].replace('text-', 'bg-')}`} />
          )}

          <Icon size={18} className={cn("relative z-10", isSwitchOn ? activeColor : "text-slate-400")} />
       </div>
    </div>
  );
}
