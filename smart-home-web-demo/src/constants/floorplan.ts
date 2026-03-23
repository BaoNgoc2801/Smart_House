export interface DevicePosition {
  id: string;   // Matches AppDevice.id
  x: number;    // percentage 0-100 (left)
  y: number;    // percentage 0-100 (top)
  roomId: string; // Matches HOUSE_ROOMS.id
}

// Approximate coordinates for 'hh124.png' floorplan.
// X is % from left width, Y is % from top height.
// Based on typical top-down architectural layout of a standard house.
export const DEVICE_POSITIONS: DevicePosition[] = [
  // Bedroom (usually top-right or top-left)
  { id: 'bedroom_light', roomId: 'bedroom', x: 25, y: 30 },
  { id: 'bedroom_ac', roomId: 'bedroom', x: 15, y: 20 },
  
  // Kitchen (often near the entrance/living)
  { id: 'kitchen_light', roomId: 'kitchen', x: 75, y: 35 },
  
  // Living Room (central)
  { id: 'living_light', roomId: 'living', x: 60, y: 65 },
  { id: 'living_ac', roomId: 'living', x: 85, y: 55 },
  { id: 'living_tv', roomId: 'living', x: 80, y: 80 },
  
  // Bathroom
  { id: 'bath_light', roomId: 'bathroom', x: 45, y: 25 },
  { id: 'bath_exhaust', roomId: 'bathroom', x: 50, y: 15 },
  
  // Entryway
  { id: 'entry_light', roomId: 'entry', x: 30, y: 80 },
];
