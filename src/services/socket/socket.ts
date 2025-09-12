import { io, Socket } from 'socket.io-client';

type UserType = 'admin' | 'customer' | 'seller';

class SocketServiceClass {
  private socket: Socket | null = null;

  connect(baseUrl?: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = baseUrl || (import.meta.env.VITE_BASE_URL as string);
    if (!url) return;

    if (this.socket) {
      if (this.socket.connected) return;
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      // console.log('Socket connected', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      // console.log('Socket disconnected');
    });

    // Message channels aligned with backend rooms
    this.socket.on('adminMessage', (_payload: any) => {
      void _payload;
      // You can surface this via a callback bus if needed
      // console.log('adminMessage', payload);
    });
    this.socket.on('customerMessage', (_payload: any) => {
      void _payload;
      // console.log('customerMessage', payload);
    });
    this.socket.on('sellerMessage', (_payload: any) => {
      void _payload;
      // console.log('sellerMessage', payload);
    });
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.removeAllListeners(); } catch {}
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }
  }

  get instance(): Socket | null {
    return this.socket;
  }

  // Client-initiated events matching backend handlers
  sendMessage(toUserId: string, message: string) {
    if (!this.socket) return;
    this.socket.emit('sendMessage', { toUserId, message });
  }

  sendToType(userType: UserType, message: string) {
    if (!this.socket) return;
    this.socket.emit('sendToType', { userType, message });
  }
}

export const SocketService = new SocketServiceClass();


