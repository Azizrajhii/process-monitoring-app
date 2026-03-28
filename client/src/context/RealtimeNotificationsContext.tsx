import * as React from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { io, Socket } from 'socket.io-client';

type NotificationItem = {
  id: string;
  message: string;
  createdAt: string;
};

interface RealtimeNotificationsContextValue {
  unreadCount: number;
  notifications: NotificationItem[];
  clearUnread: () => void;
  markAllAsRead: () => void;
}

const RealtimeNotificationsContext = React.createContext<RealtimeNotificationsContextValue | null>(null);

const getSocketUrl = () => {
  const fromEnv = import.meta.env.VITE_SOCKET_URL;
  if (fromEnv) return fromEnv;

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
  return apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
};

export function RealtimeNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [queue, setQueue] = React.useState<NotificationItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const [currentMessage, setCurrentMessage] = React.useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket: Socket = io(getSocketUrl(), {
      transports: ['websocket'],
      auth: { token },
    });

    const enqueue = (message: string) => {
      const item = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [item, ...prev].slice(0, 10));
      setQueue((prev) => [
        ...prev,
        item,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('alert:created', (payload: any) => {
      const processName = payload?.processName || 'Processus inconnu';
      enqueue(`Alerte temps réel: ${processName} - ${payload?.message || 'Nouvelle alerte'}`);
    });

    socket.on('alert:updated', (payload: any) => {
      enqueue(`Alerte mise à jour: statut ${payload?.status || 'inconnu'}`);
    });

    socket.on('corrective-action:created', (payload: any) => {
      enqueue(`Action corrective ajoutée sur alerte ${payload?.alertId || ''}`);
    });

    socket.on('measurements:imported', (payload: any) => {
      enqueue(`Import CSV terminé: ${payload?.importedCount || 0} mesures, ${payload?.alertsCreated || 0} alertes.`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (open) return;
    if (queue.length === 0) return;

    const [first, ...rest] = queue;
    setCurrentMessage(first.message);
    setQueue(rest);
    setOpen(true);
  }, [queue, open]);

  return (
    <RealtimeNotificationsContext.Provider
      value={{
        unreadCount,
        notifications,
        clearUnread: () => setUnreadCount(0),
        markAllAsRead: () => setUnreadCount(0),
      }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setOpen(false)}>
          {currentMessage}
        </Alert>
      </Snackbar>
    </RealtimeNotificationsContext.Provider>
  );
}

export function useRealtimeNotifications() {
  const ctx = React.useContext(RealtimeNotificationsContext);
  if (!ctx) {
    throw new Error('useRealtimeNotifications must be used inside RealtimeNotificationsProvider');
  }
  return ctx;
}
