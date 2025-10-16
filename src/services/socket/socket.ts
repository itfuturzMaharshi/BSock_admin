import { io, Socket } from 'socket.io-client';
import { LOCAL_STORAGE_KEYS } from '../../constants/localStorage';

type UserType = 'admin' | 'customer' | 'seller';

class SocketServiceClass {
  private socket: Socket | null = null;

  connect(baseUrl?: string) {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
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
      console.log('Socket connected', this.socket?.id);
      // Auto-join room when connected
      this.joinRoom();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Message listener for backend userMessage
    this.socket.on('userMessage', (payload: any) => {
      console.log('Received userMessage:', payload);
    });

    // Message listener for sendToAll
    this.socket.on('message', (payload: any) => {
      console.log('Received broadcast message:', payload);
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

  // Get user data from localStorage
  private getUserData(): { userId: string; userType: UserType } | null {
    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
    
    if (!userId) {
      console.warn('Missing userId in localStorage');
      return null;
    }
    
    return { userId, userType:'admin' };
  }

  // Join room with userId and userType
  joinRoom() {
    console.log('Attempting to join room...');
    if (!this.socket) return;
    console.log('Socket instance exists');
    
    const userData = this.getUserData();
    console.log('User data:', userData);
    if (!userData) return;
    
    this.socket.emit('joinRoom', {
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Leave room
  leaveRoom() {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('leaveRoom', {
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Send message to all connected users
  sendToAll(message: any) {
    if (!this.socket) return;
    this.socket.emit('sendToAll', message);
  }

  // Negotiation-specific socket methods
  joinNegotiation(negotiationId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('joinNegotiation', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  leaveNegotiation(negotiationId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('leaveNegotiation', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Listen for negotiation notifications
  onNegotiationNotification(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('negotiationNotification', callback);
  }

  // Listen for negotiation broadcasts
  onNegotiationBroadcast(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('negotiationBroadcast', callback);
  }

  // Listen for negotiation updates
  onNegotiationUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('negotiationUpdate', callback);
  }

  // Listen for user joining/leaving negotiations
  onUserJoinedNegotiation(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userJoinedNegotiation', callback);
  }

  onUserLeftNegotiation(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userLeftNegotiation', callback);
  }

  // Listen for typing indicators
  onUserTyping(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userTyping', callback);
  }

  // Send typing indicator
  sendNegotiationTyping(negotiationId: string, isTyping: boolean) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('negotiationTyping', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType,
      isTyping
    });
  }

  // Mark negotiation as read
  markNegotiationRead(negotiationId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('markNegotiationRead', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Remove all negotiation listeners
  removeNegotiationListeners() {
    if (!this.socket) return;
    this.socket.off('negotiationNotification');
    this.socket.off('negotiationBroadcast');
    this.socket.off('negotiationUpdate');
    this.socket.off('userJoinedNegotiation');
    this.socket.off('userLeftNegotiation');
    this.socket.off('userTyping');
    this.socket.off('negotiationRead');
  }
}

export const SocketService = new SocketServiceClass();