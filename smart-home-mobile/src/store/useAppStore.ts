import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppDevice, DeviceState, NotificationItem, PredictionPayload, Room, ToastMessage } from '../types';

interface AppState {
  household: string;
  setHousehold: (hh: string) => void;
  
  // Devices Mapping & Status
  devices: Record<string, AppDevice>;
  updateDeviceState: (id: string, state: DeviceState) => void;
  updateDeviceBrightness: (id: string, brightness: number) => void;
  updateDeviceTemperature: (id: string, temperature: number) => void;
  setAllDevices: (devices: Record<string, DeviceState>) => void;

  // Predictions
  predictions: PredictionPayload[];
  addPrediction: (p: PredictionPayload) => void;
  
  // Notifications
  notifications: NotificationItem[];
  addNotification: (n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  toasts: ToastMessage[];
  addToast: (t: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

// Base mock mapping for hh124 devices based on the implementation plan
const MOCK_DEVICES: Record<string, AppDevice> = {
  'living_light': { id: 'living_light', name: 'Main Light', type: 'light', state: 'OFF', brightness: 0 },
  'living_ac': { id: 'living_ac', name: 'Air Conditioner', type: 'ac', state: 'OFF', temperature: 24 },
  'living_tv': { id: 'living_tv', name: 'Smart TV', type: 'generic', state: 'OFF' },
  'kitchen_light': { id: 'kitchen_light', name: 'Ceiling Light', type: 'light', state: 'OFF', brightness: 0 },
  'bedroom_light': { id: 'bedroom_light', name: 'Room Light', type: 'light', state: 'OFF', brightness: 0 },
  'bedroom_ac': { id: 'bedroom_ac', name: 'Bedroom AC', type: 'ac', state: 'OFF', temperature: 22 },
  'bath_light': { id: 'bath_light', name: 'Bath Light', type: 'light', state: 'OFF', brightness: 0 },
  'bath_exhaust': { id: 'bath_exhaust', name: 'Exhaust Fan', type: 'fan', state: 'OFF' },
  'entry_light': { id: 'entry_light', name: 'Entry Light', type: 'light', state: 'OFF', brightness: 0 },
};

export const HOUSE_ROOMS: Room[] = [
  { id: 'living', name: 'Living Room', icon: 'Sofa', devices: ['living_light', 'living_ac', 'living_tv'] },
  { id: 'kitchen', name: 'Kitchen', icon: 'ChefHat', devices: ['kitchen_light'] },
  { id: 'bedroom', name: 'Master Bedroom', icon: 'BedDouble', devices: ['bedroom_light', 'bedroom_ac'] },
  { id: 'bathroom', name: 'Bathroom', icon: 'Bath', devices: ['bath_light', 'bath_exhaust'] },
  { id: 'entry', name: 'Entryway', icon: 'DoorOpen', devices: ['entry_light'] }
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      household: 'hh124',
      setHousehold: (hh) => set({ household: hh }),

      devices: MOCK_DEVICES,
      
      updateDeviceState: (id, state) => set((s) => {
        const device = s.devices[id];
        if (!device) return s;
        
        let newBrightness = device.brightness;
        if (device.type === 'light') {
          if (state === 'OFF') newBrightness = 0;
          if (state === 'ON' && (newBrightness === 0 || newBrightness === undefined)) newBrightness = 100;
          if (state === 'DIM' && (newBrightness === 0 || newBrightness === 100)) newBrightness = 50;
        }

        return {
          devices: {
            ...s.devices,
            [id]: { ...device, state, brightness: newBrightness }
          }
        };
      }),

      updateDeviceBrightness: (id, brightness) => set((s) => {
        const device = s.devices[id];
        if (!device) return s;
        return {
          devices: {
            ...s.devices,
            [id]: { ...device, brightness }
          }
        };
      }),

      updateDeviceTemperature: (id, temperature) => set((s) => {
        const device = s.devices[id];
        if (!device) return s;
        return {
          devices: {
            ...s.devices,
            [id]: { ...device, temperature }
          }
        };
      }),

      setAllDevices: (deviceStates) => set((s) => {
        const newDevices = { ...s.devices };
        Object.entries(deviceStates).forEach(([backendName, state]) => {
          // Map backend name to frontend ID if needed, for now assume 1:1 mapping if keys match
          // or at least update the ones that match
          if (newDevices[backendName]) {
             newDevices[backendName] = { ...newDevices[backendName], state: state as DeviceState };
             
             // Restore abstracted state consistency
             if (state === 'OFF' && newDevices[backendName].type === 'light') {
                newDevices[backendName].brightness = 0;
             }
          }
        });
        return { devices: newDevices };
      }),

      predictions: [],
      addPrediction: (p) => set((s) => ({
        predictions: [p, ...s.predictions].slice(0, 50) // keep last 50
      })),

      notifications: [],
      addNotification: (n) => set((s) => ({
        notifications: [
          {
            ...n,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...s.notifications
        ].slice(0, 50)
      })),
      
      markNotificationRead: (id) => set((s) => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      
      markAllRead: () => set((s) => ({
        notifications: s.notifications.map(n => ({ ...n, read: true }))
      })),

      toasts: [],
      addToast: (t) => {
        const id = Math.random().toString(36).substring(7);
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => useAppStore.getState().removeToast(id), 5000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(toast => toast.id !== id) }))
    }),
    {
      name: 'smart-home-storage',
      partialize: (state) => ({ household: state.household, devices: state.devices, predictions: state.predictions, notifications: state.notifications }),
    }
  )
);
