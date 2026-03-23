import { DeviceState } from '../types';

export const ACTIVITY_DEVICE_MAP_HH124: Record<string, Record<string, DeviceState>> = {
  'Sleep': {
    'bedroom_ac': 'ON',
    'bedroom_light': 'OFF',
    'living_light': 'OFF',
    'living_tv': 'OFF',
    'kitchen_light': 'OFF',
    'bath_light': 'OFF',
    'bath_exhaust': 'OFF',
    'entry_light': 'OFF'
  },
  'Relax': {
    'living_light': 'DIM',
    'living_tv': 'ON',
    'living_ac': 'ON'
  },
  'Work': {
    'living_light': 'ON',
    'bedroom_light': 'ON',
    'living_tv': 'OFF'
  },
  'Leave_Home': {
    'bedroom_ac': 'OFF',
    'bedroom_light': 'OFF',
    'living_light': 'OFF',
    'living_tv': 'OFF',
    'living_ac': 'OFF',
    'kitchen_light': 'OFF',
    'bath_light': 'OFF',
    'bath_exhaust': 'OFF',
    'entry_light': 'OFF'
  },
  'Enter_Home': {
    'entry_light': 'ON',
    'living_light': 'ON',
    'living_ac': 'ON'
  },
  'Personal_Care': {
    'bath_light': 'ON',
    'bath_exhaust': 'ON'
  }
};
