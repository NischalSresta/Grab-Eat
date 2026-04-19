export type BookingRealtimeEventType = 'BOOKED' | 'RESERVED' | 'CANCELLED' | 'UPDATED';

export interface BookingRealtimeEvent {
  type: BookingRealtimeEventType;
  message?: string;
  tableId?: number;
  bookingId?: number;
  timestamp?: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const realtimeService = {
  subscribeBookingEvents(
    onEvent: (payload: BookingRealtimeEvent) => void,
    onError?: (err: Event) => void
  ) {
    const es = new EventSource(`${API_BASE}/tables/events`, { withCredentials: true });

    es.onmessage = ev => {
      try {
        onEvent(JSON.parse(ev.data) as BookingRealtimeEvent);
      } catch {
        // skip if the message cant be parsed
      }
    };

    es.onerror = err => onError?.(err);

    return () => es.close();
  },
};

export { realtimeService };
export default realtimeService;