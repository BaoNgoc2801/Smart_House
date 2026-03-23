import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { WsMessage } from '../types';
import { API_BASE_URL, sendDeviceCommand } from '../services/api';
import { getPredictionMessage } from '../utils/predictionMessages';
import { ACTIVITY_DEVICE_MAP_HH124 } from '../utils/activityMap';

const WS_URL = API_BASE_URL.replace('http', 'ws');

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const household = useAppStore((state) => state.household);
  
  const updateDeviceState = useAppStore(state => state.updateDeviceState);
  const addPrediction = useAppStore(state => state.addPrediction);
  const addNotification = useAppStore(state => state.addNotification);
  const addToast = useAppStore(state => state.addToast);

  const connect = useCallback(() => {
    if (!household) return;
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${WS_URL}/ws/${household}`;
    console.log('[WS] Connecting to', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected to household:', household);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        console.log('[WS] Message received:', msg);

        switch (msg.type) {
          case 'device_command': {
            const { device, value } = msg.payload;
            updateDeviceState(device, value);
            break;
          }
          case 'prediction': {
            const pred = msg.payload;
            addPrediction(pred);
            
            // Add helpful notification for prediction
            const msgData = getPredictionMessage(pred.activity);
              
            // Send internal app notification
            addNotification({
              title: msgData.title,
              body: msgData.body,
              type: 'prediction'
            });

            // Show an instant toast alert in app
            addToast({
              title: msgData.title,
              body: msgData.body,
              type: 'prediction'
            });

            // Automatically toggle mapped devices based on prediction
            const deviceChanges = ACTIVITY_DEVICE_MAP_HH124[pred.activity];
            if (deviceChanges) {
               const allDeviceIds = Object.keys(useAppStore.getState().devices);
               allDeviceIds.forEach((devId) => {
                  const newState = deviceChanges[devId] || 'OFF';
                  updateDeviceState(devId, newState);
                  sendDeviceCommand({ household, device: devId, command: 'set', value: newState })
                     .catch(e => console.error('Failed automated device toggle', e));
               });
            }

            break;
          }
        }
      } catch (err) {
        console.error('[WS] Parse error', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] Disconnected from', household, event.code);
      // Auto reconnect unless the close was normal
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      }
    };

    ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        ws.close();
    };
  }, [household, addNotification, addPrediction, updateDeviceState]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) wsRef.current.close(1000, 'Component unmount');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  // Expose manual reconnect or other utilities if needed
  return {
    reconnect: connect
  };
}
