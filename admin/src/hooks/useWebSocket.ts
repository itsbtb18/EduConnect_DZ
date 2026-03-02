import { useEffect, useRef, useCallback, useState } from 'react';
import type { ChatMessage } from '../types';

interface UseWebSocketOptions {
  roomId: string;
  enabled?: boolean;
  onMessage?: (msg: ChatMessage) => void;
}

/**
 * WebSocket hook for real-time chat messaging.
 * Connects to Django Channels at ws://host/ws/chat/<roomId>/?token=<jwt>
 * Falls back gracefully if WebSocket is unavailable.
 */
export function useChatWebSocket({ roomId, enabled = true, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCount = useRef(0);
  const maxReconnects = 5;

  const getWsUrl = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${proto}//${host}/ws/chat/${roomId}/?token=${token}`;
  }, [roomId]);

  const connect = useCallback(() => {
    if (!roomId || !enabled) return;

    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat_message' || data.message || data.content) {
            const msg: ChatMessage = {
              id: data.id || `ws-${Date.now()}`,
              room: roomId,
              sender: data.sender,
              sender_name: data.sender_name,
              content: data.content || data.message || '',
              sent_at: data.sent_at || new Date().toISOString(),
              is_mine: data.is_mine ?? false,
            };
            onMessage?.(msg);
          }
        } catch {
          // non-JSON message, ignore
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        wsRef.current = null;

        // Auto-reconnect on abnormal close
        if (!event.wasClean && reconnectCount.current < maxReconnects) {
          reconnectCount.current++;
          const delay = Math.min(1000 * 2 ** reconnectCount.current, 30000);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
        setConnected(false);
      };
    } catch {
      setError('Failed to create WebSocket connection');
    }
  }, [roomId, enabled, getWsUrl, onMessage]);

  // Connect/disconnect on roomId change
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [connect]);

  const sendMessage = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ message: content, content }));
        return true;
      }
      return false; // Caller should fall back to REST
    },
    [],
  );

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectCount.current = maxReconnects; // prevent reconnect
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  return { connected, error, sendMessage, disconnect };
}
