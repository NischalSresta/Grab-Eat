import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface OrderUpdate {
  type?: string;
  orderId: number;
  status: string;
  paymentStatus: string;
  tableNumber: string;
  totalAmount: number;
  cashRequested?: boolean;
}

export function useOrderSocket(onUpdate: (update: OrderUpdate) => void) {
  const clientRef = useRef<Client | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/orders', (msg) => {
          try {
            const update: OrderUpdate = JSON.parse(msg.body);
            onUpdateRef.current(update);
          } catch (e) { }
        });
      },
      onStompError: () => { /* connection might not be ready yet, that's ok */ },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, []);
}
