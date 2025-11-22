import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Client, IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 1. Definição do Tipo para o Contexto
type WebSocketContextType = {
  stompClient: Client | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  lastNotification: any | null; // NOVO: Para armazenar a última notificação
};

// 2. Criação do Contexto
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// 3. Hook para consumir o contexto
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === null) {
    throw new Error('useWebSocket deve ser usado dentro de um WebSocketProvider');
  }
  return context;
};

type WebSocketProviderProps = {
  children: ReactNode;
};

// 4. Criação do Provider
export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // NOVO: Estado para a última notificação recebida
  const [lastNotification, setLastNotification] = useState<any | null>(null);

  const disconnect = () => {
    if (stompClient?.connected) {
      stompClient.deactivate();
    }
    if (stompClient !== null) {
      setStompClient(null);
    }
    if (isConnected) {
      setIsConnected(false);
    }
    setLastNotification(null); // NOVO: Limpa a notificação ao desconectar
  };

  const connect = useCallback((token: string) => {
    if (!token || isConnected) {
      return;
    }
    
    if (stompClient) {
      stompClient.deactivate();
    }

    const socketFactory = () => new SockJS(`http://localhost:8080/ws`);

    const client = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('Conectado ao WebSocket!');
        setIsConnected(true);
        setStompClient(client);

        // ************************************************************
        // NOVO: Inscrição na fila de notificações privadas do usuário
        // ************************************************************
        client.subscribe('/user/queue/notifications', (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log("Nova notificação recebida:", notification);
            
            // Armazena a notificação no estado do Contexto
            setLastNotification(notification);

          } catch (error) {
            console.error("Erro ao processar notificação", error);
          }
        });
        // ************************************************************

      },
      onDisconnect: () => {
        console.log('Desconectado do WebSocket.');
        setIsConnected(false);
        setStompClient(null);
      },
      onStompError: (frame: IFrame) => {
        console.error('Erro no STOMP:', frame.headers['message'], frame.body);
        setIsConnected(false);
        setStompClient(null);
        client.deactivate();
      },
      onWebSocketError: (event: Event) => {
        console.error('Erro na conexão WebSocket:', event);
        setIsConnected(false);
        setStompClient(null);
        client.deactivate();
      },
      onWebSocketClose: (event: CloseEvent) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setStompClient(null);
      }
    });

    client.activate();

  }, [isConnected, stompClient]); // A dependência do 'stompClient' aqui está correta

  // Efeito para desconectar ao desmontar
  useEffect(() => {
    return () => {
      // Usar a função de desconexão definida no estado
      if (stompClient) {
        stompClient.deactivate();
        setIsConnected(false);
        setStompClient(null);
      }
    };
  }, [stompClient]); // Depende apenas do stompClient


  // Valor do Contexto
  const contextValue: WebSocketContextType = {
    stompClient,
    isConnected,
    connect,
    disconnect,
    lastNotification, // NOVO: Expõe a notificação no contexto
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};