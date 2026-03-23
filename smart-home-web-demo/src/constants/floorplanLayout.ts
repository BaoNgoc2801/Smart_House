import floorplanImg from '../../../data/floorplans/hh124.png';

import type { Device, Room } from '../types/domain';
import { DEFAULT_HOUSEHOLD } from './config';

export const FLOORPLAN_IMAGE = floorplanImg;

export interface PositionedDevice extends Device {
  xPercent: number;
  yPercent: number;
}

export const ROOMS: Room[] = [
  { id: 'living-room', name: 'Living Room', householdId: DEFAULT_HOUSEHOLD },
  { id: 'kitchen', name: 'Kitchen', householdId: DEFAULT_HOUSEHOLD },
  { id: 'bedroom', name: 'Bedroom', householdId: DEFAULT_HOUSEHOLD },
  { id: 'bathroom', name: 'Bathroom', householdId: DEFAULT_HOUSEHOLD },
  { id: 'entrance', name: 'Entrance / Hallway', householdId: DEFAULT_HOUSEHOLD },
];

export const INITIAL_DEVICES: PositionedDevice[] = [
  {
    id: 'living_main_light',
    name: 'Living Main Light',
    roomId: 'living-room',
    kind: 'light',
    state: 'OFF',
    capabilities: { canDim: true },
    frontendState: { brightness: 0 },
    xPercent: 45,
    yPercent: 55,
  },
  {
    id: 'living_floor_lamp',
    name: 'Floor Lamp',
    roomId: 'living-room',
    kind: 'light',
    state: 'OFF',
    capabilities: { canDim: true },
    frontendState: { brightness: 0 },
    xPercent: 38,
    yPercent: 62,
  },
  {
    id: 'living_tv',
    name: 'TV',
    roomId: 'living-room',
    kind: 'tv',
    state: 'OFF',
    xPercent: 52,
    yPercent: 60,
  },
  {
    id: 'living_fan',
    name: 'Ceiling Fan',
    roomId: 'living-room',
    kind: 'fan',
    state: 'OFF',
    capabilities: { hasSpeed: true },
    frontendState: { speed: 0 },
    xPercent: 47,
    yPercent: 48,
  },
  {
    id: 'kitchen_ceiling_light',
    name: 'Kitchen Light',
    roomId: 'kitchen',
    kind: 'light',
    state: 'OFF',
    capabilities: { canDim: true },
    frontendState: { brightness: 0 },
    xPercent: 30,
    yPercent: 30,
  },
  {
    id: 'kitchen_counter_light',
    name: 'Counter Light',
    roomId: 'kitchen',
    kind: 'light',
    state: 'OFF',
    capabilities: { canDim: true },
    frontendState: { brightness: 0 },
    xPercent: 40,
    yPercent: 35,
  },
  {
    id: 'bedroom_main_light',
    name: 'Bedroom Light',
    roomId: 'bedroom',
    kind: 'light',
    state: 'OFF',
    capabilities: { canDim: true },
    frontendState: { brightness: 0 },
    xPercent: 70,
    yPercent: 40,
  },
  {
    id: 'bedroom_lamp',
    name: 'Bedside Lamp',
    roomId: 'bedroom',
    kind: 'light',
    state: 'OFF',
    capabilities: { canDim: true },
    frontendState: { brightness: 0 },
    xPercent: 76,
    yPercent: 48,
  },
  {
    id: 'bedroom_ac',
    name: 'Bedroom AC',
    roomId: 'bedroom',
    kind: 'ac',
    state: 'OFF',
    capabilities: { hasTemperature: true },
    frontendState: { temperature: 24 },
    xPercent: 82,
    yPercent: 35,
  },
  {
    id: 'bathroom_light',
    name: 'Bathroom Light',
    roomId: 'bathroom',
    kind: 'light',
    state: 'OFF',
    xPercent: 65,
    yPercent: 25,
  },
  {
    id: 'entrance_light',
    name: 'Entrance Light',
    roomId: 'entrance',
    kind: 'light',
    state: 'OFF',
    xPercent: 50,
    yPercent: 80,
  },
  {
    id: 'entrance_door_lock',
    name: 'Door Lock',
    roomId: 'entrance',
    kind: 'door',
    state: 'OFF',
    xPercent: 60,
    yPercent: 88,
  },
];

