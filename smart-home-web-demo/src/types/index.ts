export type DeviceState = 'ON' | 'OFF' | 'DIM';

export interface DeviceCommand {
  household?: string;
  device: string;
  command: 'set' | 'toggle';
  value?: DeviceState;
}

export interface PredictionPayload {
  household: string;
  index: number;
  activity: string;
  confidence: number;
  probs: Record<string, number>;
  ground_truth?: string;
  raw_class: string;
  time_col: string;
  query_timestamp?: string;
  matched_timestamp?: string;
  clamped?: string;
  time_range: {
    min?: string;
    max?: string;
  };
  feature_count?: number;
  feature_cols?: string[];
}

export interface WsMessage {
  type: 'prediction' | 'device_command';
  payload: any;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'device' | 'prediction' | 'system';
}

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type?: 'prediction' | 'info' | 'error';
}

export interface HouseholdInfo {
  model_type: string;
  rows: number;
}

// App configuration and structure
export interface Room {
  id: string;
  name: string;
  icon: string;
  devices: string[];
}

// Frontend specific Device wrapper
export interface AppDevice {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'fan' | 'generic';
  state: DeviceState;
  
  // Frontend abstractions (not matching backend 1:1)
  brightness?: number; // 0-100
  temperature?: number; // 16-30
}
