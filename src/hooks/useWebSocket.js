import { useEffect, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { useStore } from '@/store/index';
import { getUuid } from "@/utils/utils";

export const useWebSocket = () => {
  const { user } = useStore();

  // 从 Zustand 获取状态和修改方法
  const isConnected = useStore(state => state.isConnected);
  const socketData = useStore(state => state.socketData);
  const setSocketStatus = useStore(state => state.setSocketStatus);
  const setSocketData = useStore(state => state.setSocketData);
  const setMessageUuid = useStore(state => state.setMessageUuid);

  const socketRef = useRef(null);
  const stompClientRef = useRef(null);
  const timerRef = useRef(null);

  const connect = useCallback(() => {
    if (!user || !user.id) return;

    const socket = new SockJS('/voicesagex-console/user-web/websocket');
    const stompClient = Stomp.over(socket);

    stompClient.heartbeat.outgoing = 2000;
    stompClient.heartbeat.incoming = 0;

    const headers = {
      user_id: user.id,
      user_name: user.username,
    };

    stompClient.connect(
      headers,
      () => {
        console.log('✅ WebSocket connected');
        setSocketStatus(true); // 用 Zustand 设置连接状态

        stompClient.subscribe(`/user/${user.id}/message`, (res) => {
          const data = JSON.parse(res.body);
          console.log(data,'SOCKET DATA')
          setSocketData(data);  // 用 Zustand 设置数据
          setMessageUuid(getUuid());
        });

        // 启动心跳测试
        timerRef.current = setInterval(() => {
          try {
            stompClient.send('test');
          } catch (e) {
            console.warn('💔 WebSocket send failed, attempting reconnect...');
            reconnect();
          }
        }, 300000); // 每 5 分钟
      },
      (err) => {
        console.error('❌ WebSocket connection failed:', err);
        setSocketStatus(false); // 连接失败也更新状态
      }
    );

    socketRef.current = socket;
    stompClientRef.current = stompClient;
  }, [user, setSocketStatus, setSocketData]);

  const disconnect = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.disconnect(() => {
        console.log('🛑 WebSocket disconnected');
        setSocketStatus(false);
      });
      stompClientRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [setSocketStatus]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  const sendMessage = useCallback((destination, message) => {
    if (stompClientRef.current && isConnected) {
      stompClientRef.current.send(destination, {}, JSON.stringify(message));
    }
  }, [isConnected]);

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    isConnected,
    socketData,
    sendMessage,
    reconnect,
    disconnect,
  };
};
