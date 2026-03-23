import type { DeviceStateValue, HouseholdId, PredictResponse } from './api';

export type DeviceKind = 'light' | 'ac' | 'fan' | 'tv' | 'door' | 'generic';

export interface Room {
  id: string;
  name: string;
  householdId: HouseholdId;
}

export interface Device {
  id: string;
  name: string;
  roomId: string;
  kind: DeviceKind;
  state: DeviceStateValue;
  capabilities?: {
    canDim?: boolean;
    hasTemperature?: boolean;
    hasSpeed?: boolean;
  };
  frontendState?: {
    brightness?: number; // 0-1
    temperature?: number; // purely UI, not sent to backend
    speed?: number; // 0-1
  };
}

export type Prediction = PredictResponse;

export type EventType = 'device_command' | 'prediction' | 'sync' | 'system';

export interface EventLogEntry {
  id: string;
  timestamp: string;
  type: EventType;
  source: 'web' | 'mobile' | 'backend';
  payload: unknown;
}

export type NotificationKind = 'prediction' | 'device' | 'system';

export interface NotificationItem {
  id: string;
  createdAt: string;
  kind: NotificationKind;
  title: string;
  message: string;
  unread: boolean;
  relatedDeviceId?: string;
  relatedPredictionIndex?: number;
}

