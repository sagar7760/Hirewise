import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
// Socket.io removed: we now rely purely on REST polling and manual refresh triggers.
import { buildApiUrl } from '../utils/api';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children, pollIntervalMs = 30000 }) => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Removed socket ref; using lightweight polling only

  // REST fetchers
  const fetchList = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/notifications?limit=20'), {
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
      const res = await fetch(buildApiUrl('/api/notifications/unread-count'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data?.data?.count || 0);
      }
    } catch (e) {}
  };

  // Socket initialization removed.

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
      const res = await fetch(buildApiUrl(`/api/notifications/${id}/read`), { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        setItems(prev => prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/notifications/read-all'), { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} });
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
