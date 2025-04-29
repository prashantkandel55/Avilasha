import React, { createContext, useContext, useState, useCallback } from 'react';

export interface NotificationItem {
  id: string;
  type: 'transaction' | 'alert' | 'security' | 'info' | 'price';
  title: string;
  description?: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => [
      {
        ...item,
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        timestamp: Date.now(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
