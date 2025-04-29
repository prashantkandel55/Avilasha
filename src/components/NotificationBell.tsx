import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

const NotificationBell: React.FC = () => {
  const { notifications, markAllRead } = useNotification();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        className="relative"
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2 font-semibold border-b">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            <ul>
              {notifications.map(n => (
                <li key={n.id} className={`p-3 border-b last:border-b-0 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
