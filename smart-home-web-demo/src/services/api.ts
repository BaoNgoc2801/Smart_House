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
