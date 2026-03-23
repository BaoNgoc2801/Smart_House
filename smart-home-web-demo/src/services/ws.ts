import { WS_BASE_URL, DEFAULT_HOUSEHOLD } from '../constants/config';
import type { WsMessage } from '../types/api';

export type WsHandlers = {
  onMessage: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
};

export function createSmartHomeWebSocket(handlers: WsHandlers): WebSocket | null {
  if (typeof window === 'undefined') return null;
  const ws = new WebSocket(`${WS_BASE_URL}/ws/${DEFAULT_HOUSEHOLD}`);

  ws.onopen = () => {
    handlers.onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WsMessage;
      handlers.onMessage(data);
    } catch (e) {
      console.error('Failed to parse WS message', e);
    }
  };

  ws.onerror = (e) => {
    handlers.onError?.(e);
  };

  ws.onclose = () => {
    handlers.onClose?.();
  };

  return ws;
}

