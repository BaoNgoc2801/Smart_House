import type { DeviceCommand, PredictionPayload } from '../types';
import { API_BASE_URL } from '../constants/config';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchDeviceStates(household: string) {
  const res = await fetch(`${API_BASE_URL}/devices/state/${household}`);
  if (!res.ok) throw new Error('Failed to fetch device states');
  return res.json();
}

export async function sendDeviceCommand(req: DeviceCommand) {
  const res = await fetch(`${API_BASE_URL}/devices/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Failed to send command ${req.command}`);
  return res.json();
}

export async function triggerPrediction(req: { household: string; time_only?: string }) {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to trigger prediction');
  return res.json() as Promise<PredictionPayload>;
}
export async function fetchPredictions(householdId: string) {
  const res = await fetch(`${API_BASE_URL}/predictions/${householdId}`);
  if (!res.ok) throw new Error('Failed to fetch predictions');
  return res.json();
}

export async function fetchHouseholds() {
  const res = await fetch(`${API_BASE_URL}/households`);
  if (!res.ok) throw new Error('Failed to fetch households');
  return res.json();
}

export async function fetchSensors(householdId: string) {
  const res = await fetch(`${API_BASE_URL}/households/${householdId}/sensors`);
  if (!res.ok) throw new Error('Failed to fetch sensors');
  return res.json();
}

export async function fetchAlerts(householdId: string) {
  const res = await fetch(`${API_BASE_URL}/households/${householdId}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function markAlertRead(alertId: number) {
  const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark alert as read');
  return res.json();
}

export async function fetchHouseholdModel(householdId: string) {
  const res = await fetch(`${API_BASE_URL}/households/${householdId}/model`);
  if (!res.ok) throw new Error('Failed to fetch household model');
  return res.json();
}
