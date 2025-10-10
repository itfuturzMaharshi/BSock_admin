import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SocketService } from '../services/socket/socket';
import { LOCAL_STORAGE_KEYS } from '../constants/localStorage';

type SocketContextValue = {
  socket: any | null;
};

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    if (token) {
      SocketService.connect();
      setSocket(SocketService.instance);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.TOKEN) {
        if (e.newValue) {
          SocketService.connect();
          setSocket(SocketService.instance);
        } else {
          SocketService.disconnect();
          setSocket(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}


