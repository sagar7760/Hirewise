import React from 'react';
import HRLayout from '../../components/layout/HRLayout';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';

const HRNotifications = () => {
  const { items: notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();
  const { token } = useAuth();
  const [selectedNotifications, setSelectedNotifications] = React.useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const formatTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAsRead = (notificationId) => { markRead(notificationId).catch(() => {}); };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n._id));
    }
  };

  const deleteSelectedNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids: selectedNotifications })
      });
      if (!res.ok) throw new Error('Failed to delete notifications');
      if (typeof refresh === 'function') await refresh();
      setSelectedNotifications([]);
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error('HR bulk delete failed', e);
    }
  };

  const getUnreadCount = () => unreadCount;

  // Icon Utility (Simplified SVG structure for dark mode handling)
  const renderIcon = (iconType, colorClass) => {
      // The colorClass handles stroke/fill color based on notification type/read status
      const svgClass = `w-5 h-5 ${colorClass} stroke-current`;
      
      switch (iconType) {
          case 'user-plus': return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 15h2m-2 4h4m-4 0v-2m0 2h-4"/></svg>;
          case 'calendar': return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
          case 'clock': return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
          case 'document-report': return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h13M9 11L4 16m5-5l5 5"/></svg>;
          case 'arrow-right': return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>;
          case 'check-circle': return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
          case 'megaphone': return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
          case 'bell': return <svg className="w-5 h-5 text-red-500 dark:text-red-400 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
          default: return <svg className={svgClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
      }
  };

  const getNotificationColors = (type, read) => {
      // Background colors
      const bg = read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20';
      const hoverBg = 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
      
      // Icon accent color (high, medium, low)
      let accent = 'text-gray-600 dark:text-gray-300';
      if (!read) {
          switch (type) {
              case 'interview': // High priority/action
                  accent = 'text-green-600 dark:text-green-400'; 
                  break;
              case 'application': // Medium priority/action
                  accent = 'text-blue-600 dark:text-blue-400'; 
                  break;
              case 'deadline': // High priority/action
                  accent = 'text-red-600 dark:text-red-400'; 
                  break;
              default:
                  accent = 'text-gray-600 dark:text-gray-300';
                  break;
          }
      }

      return {
          bg,
          hoverBg,
          accent,
          title: read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white',
          message: read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-200',
          time: 'text-gray-500 dark:text-gray-400'
      };
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                Notifications
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Stay updated with all your HR activities and important updates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getUnreadCount() > 0 && (
                <button
                  onClick={() => markAllRead().catch(() => {})}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Mark All Read
                </button>
              )}
              {selectedNotifications.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Delete Selected ({selectedNotifications.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg transition-colors duration-300">
          {/* Header with bulk actions */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                    onChange={selectAllNotifications}
                    className="h-4 w-4 rounded-sm border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">
                    {selectedNotifications.length > 0 ? `${selectedNotifications.length} selected` : 'Select all'}
                      </span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                    {notifications.length} notifications
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const colors = getNotificationColors(notification.type, notification.read);
                    return (
                    <div
                      key={notification._id}
                      className={`p-4 transition-colors duration-300 flex items-start space-x-4 ${colors.bg} ${colors.hoverBg}`}
                    >
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification._id)}
                          onChange={() => toggleSelectNotification(notification._id)}
                          className="h-4 w-4 rounded-sm border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800"
                        />
                      </div>

                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colors.accent} bg-gray-100 dark:bg-gray-700 transition-colors`}>
                        {renderIcon(notification.icon, colors.accent)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`text-sm font-medium font-['Open_Sans'] ${colors.title}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-sm font-['Roboto'] mb-2 ${colors.message}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4">
                              <span className={`text-xs font-['Roboto'] ${colors.time}`}>
                                {formatTime(notification.createdAt)}
                              </span>
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification._id)}
                                  className="flex items-center justify-center w-10 h-6 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                                  title="Mark as read"
                                >
                                  <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/notifications/${notification._id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                                  if (!res.ok) throw new Error('Failed to delete');
                                  if (typeof refresh === 'function') await refresh();
                                } catch (err) {
                                  console.error('HR single delete failed', err);
                                }
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7m3 4v6m4-6v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>

              {/* Load More */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                  <button onClick={() => (typeof refresh === 'function' ? refresh() : null)} className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium font-['Roboto']">
                    Load More Notifications
                  </button>
                </div>
              )}
            </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 transition-colors duration-300">
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 dark:border dark:border-gray-700 transition-colors duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">
              Delete Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-['Roboto']">
              Are you sure you want to delete **{selectedNotifications.length}** selected notification{selectedNotifications.length > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteSelectedNotifications}
                className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
};

export default HRNotifications;