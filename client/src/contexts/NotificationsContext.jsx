import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children, pollIntervalMs = 30000 }) => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // REST fetchers
  const fetchList = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data?.data?.items || []);
      }
    } catch (e) {
      // silent
    }
  };

  const fetchUnread = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data?.data?.count || 0);
      }
    } catch (e) {}
  };

  // Initialize socket
  useEffect(() => {
  if (!token) return;

    // Close any existing
    if (socketRef.current) {
      try { socketRef.current.disconnect(); } catch {}
      socketRef.current = null;
    }

  const origin = window.location.origin.replace(/:\d+$/, ':5000');
  const socket = io(origin, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      // console.log('Socket connected');
    });

    socket.on('notification:new', (notif) => {
      setItems(prev => [notif, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
    });

    socket.on('disconnect', () => {
      // console.log('Socket disconnected');
    });

    return () => {
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [token]);

  // Initial and polling fetch
  useEffect(() => {
    if (!token) return;
    fetchList();
    fetchUnread();
    const t = setInterval(() => { fetchUnread(); }, pollIntervalMs);
    return () => clearInterval(t);
  }, [token, pollIntervalMs]);

  const markRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        setItems(prev => prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        setItems(prev => prev.map(n => ({ ...n, read: true, readAt: n.readAt || new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch {}
  };

  const value = useMemo(() => ({ items, unreadCount, markRead, markAllRead, refresh: () => { fetchList(); fetchUnread(); } }), [items, unreadCount]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
};
