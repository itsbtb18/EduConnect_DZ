import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ChatMessage, ChatRoomMessage } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════════════════ */

function getWsBase() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${proto}//${host}`;
}

function getToken() {
  return localStorage.getItem('access_token') || '';
}

/* ═══════════════════════════════════════════════════════════════════════
   WebSocket event types
   ═══════════════════════════════════════════════════════════════════════ */

export interface TypingEvent {
  type: 'typing_indicator';
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

export interface ReadReceiptEvent {
  type: 'read_receipt';
  user_id: string;
  user_name: string;
  last_read_message_id: string;
}

export type WsEvent = ChatMessage | TypingEvent | ReadReceiptEvent;

/* ═══════════════════════════════════════════════════════════════════════
   useChat — manages a per-conversation WebSocket + fetches history
   ═══════════════════════════════════════════════════════════════════════ */

interface UseChatOptions {
  conversationId: string;
  onMessage?: (msg: ChatMessage) => void;
  onTyping?: (evt: TypingEvent) => void;
  onReadReceipt?: (evt: ReadReceiptEvent) => void;
}

export function useChat({ conversationId, onMessage, onTyping, onReadReceipt }: UseChatOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCount = useRef(0);
  const maxReconnects = 10;
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onReadReceiptRef = useRef(onReadReceipt);
  onMessageRef.current = onMessage;
  onTypingRef.current = onTyping;
  onReadReceiptRef.current = onReadReceipt;

  const connect = useCallback(() => {
    if (!conversationId) return;

    try {
      const token = getToken();
      const url = `${getWsBase()}/ws/chat/${conversationId}/?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'typing_indicator') {
            onTypingRef.current?.(data as TypingEvent);
          } else if (data.type === 'read_receipt') {
            onReadReceiptRef.current?.(data as ReadReceiptEvent);
          } else {
            onMessageRef.current?.(data as ChatMessage);
          }
        } catch {
          // ignore non-JSON
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;
        if (!event.wasClean && reconnectCount.current < maxReconnects) {
          reconnectCount.current++;
          const delay = Math.min(1000 * 2 ** reconnectCount.current, 30000);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Switching conversation');
      wsRef.current = null;
    }
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectCount.current = 0;
    setIsConnected(false);

    if (conversationId) {
      connect();
    }

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Cleanup');
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [conversationId, connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
      return true;
    }
    return false;
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  }, []);

  const sendMarkRead = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read' }));
    }
  }, []);

  return { isConnected, sendMessage, sendTyping, sendMarkRead };
}


/* ═══════════════════════════════════════════════════════════════════════
   useRoomChat — manages a per-room WebSocket for group/broadcast
   ═══════════════════════════════════════════════════════════════════════ */

interface UseRoomChatOptions {
  roomId: string;
  onMessage?: (msg: ChatRoomMessage) => void;
  onTyping?: (evt: TypingEvent) => void;
}

export function useRoomChat({ roomId, onMessage, onTyping }: UseRoomChatOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCount = useRef(0);
  const maxReconnects = 10;
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  onMessageRef.current = onMessage;
  onTypingRef.current = onTyping;

  const connect = useCallback(() => {
    if (!roomId) return;

    try {
      const token = getToken();
      const url = `${getWsBase()}/ws/room/${roomId}/?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'typing_indicator') {
            onTypingRef.current?.(data as TypingEvent);
          } else {
            onMessageRef.current?.(data as ChatRoomMessage);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;
        if (!event.wasClean && reconnectCount.current < maxReconnects) {
          reconnectCount.current++;
          const delay = Math.min(1000 * 2 ** reconnectCount.current, 30000);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Switching room');
      wsRef.current = null;
    }
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectCount.current = 0;
    setIsConnected(false);

    if (roomId) {
      connect();
    }

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Cleanup');
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [roomId, connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
      return true;
    }
    return false;
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  }, []);

  return { isConnected, sendMessage, sendTyping };
}


/* ═══════════════════════════════════════════════════════════════════════
   useNotifications — global WS for real-time notifications
   ═══════════════════════════════════════════════════════════════════════ */

export interface NotificationEvent {
  type: 'new_message' | 'room_message' | 'payment_expired' | 'absence_alert';
  conversation_id?: string;
  room_id?: string;
  sender_name?: string;
  preview?: string;
  message?: string;
  count?: number;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  onEvent?: (event: NotificationEvent) => void;
}

export function useNotificationSocket({ enabled = true, onEvent }: UseNotificationsOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCount = useRef(0);
  const maxReconnects = 20;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const qc = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const token = getToken();
      if (!token) return;
      const url = `${getWsBase()}/ws/notifications/?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationEvent;
          onEventRef.current?.(data);

          if (data.type === 'new_message') {
            qc.invalidateQueries({ queryKey: ['conversations'] });
          }
          if (data.type === 'room_message') {
            qc.invalidateQueries({ queryKey: ['chatRooms'] });
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;
        if (!event.wasClean && reconnectCount.current < maxReconnects) {
          reconnectCount.current++;
          const delay = Math.min(3000 * 2 ** Math.min(reconnectCount.current, 5), 30000);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }
  }, [enabled, qc]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Cleanup');
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected };
}

// Legacy export for backward compat
export { useChat as useChatWebSocket };
