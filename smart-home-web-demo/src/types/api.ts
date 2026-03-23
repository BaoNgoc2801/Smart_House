export type HouseholdId = 'hh121' | 'hh122' | 'hh124';

export interface HealthHouseholdInfo {
  model_type?: string;
  rows?: number;
  label_col?: string | null;
  time_col?: string | null;
  time_parsed_ok?: boolean;
  time_range?: {
    min: string | null;
    max: string | null;
  };
  has_label_encoder?: boolean;
  has_activity_map?: boolean;
  has_feature_cols?: boolean;
  n_features?: number | null;
  error?: string;
}

export interface HealthResponse {
  status: 'ok';
  households: Record<string, HealthHouseholdInfo>;
}

export interface PredictRequest {
  household?: HouseholdId;
  index?: number;
  timestamp?: string;
  date?: string;
  time?: string;
  time_only?: string;
}

export interface PredictResponse {
  household: HouseholdId;
  index: number;
  activity: string;
  confidence: number | null;
  probs: Record<string, number> | null;
  ground_truth: string | null;
  raw_class: string;
  time_col: string | null;
  query_timestamp: string | null;
  matched_timestamp: string | null;
  clamped: string | null;
  time_range: {
    min: string | null;
    max: string | null;
  };
  feature_count: number | null;
  feature_cols: string[] | null;
  has_label_encoder: boolean;
  has_activity_map: boolean;
}

export type DeviceStateValue = 'ON' | 'OFF' | 'DIM';

export interface DeviceStatesResponse {
  household: HouseholdId;
  devices: Record<string, DeviceStateValue>;
}

export interface DeviceCommandRequest {
  household?: HouseholdId;
  device: string;
  command: 'toggle' | 'set';
  value?: DeviceStateValue;
}

export interface DeviceCommandResponse {
  ok: boolean;
  state: DeviceStateValue;
}

export type WsPredictionMessage = {
  type: 'prediction';
  payload: PredictResponse;
};

export type WsDeviceCommandMessage = {
  type: 'device_command';
  payload: {
    household: HouseholdId;
    device: string;
    command: 'toggle' | 'set';
    value: DeviceStateValue;
  };
};

export type WsMessage = WsPredictionMessage | WsDeviceCommandMessage;

