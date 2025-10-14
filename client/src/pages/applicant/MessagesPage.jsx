import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';

const NotificationsPage = () => {
  const { 
    items: notifications = [], 
    unreadCount = 0, 
    markRead, 
    markAllRead,
    refresh
  } = useNotifications() || {};
  const { token } = useAuth();
  
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Helper function to format time
  const formatTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await markRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Toggle notification selection
  const toggleSelectNotification = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  // Select/deselect all notifications
  const selectAllNotifications = () => {
    if (!notifications || notifications.length === 0) return;
    
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n._id));
    }
  };

  // Delete selected notifications via API then refresh
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
      // Refresh list
      if (typeof refresh === 'function') {
        await refresh();
      }
      setSelectedNotifications([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    return unreadCount || 0;
  };

  // Render notification icon based on type
  const renderIcon = (type, colorClass) => {
    switch (type) {
      case 'application_submitted':
      case 'application_status_changed':
        return (
          <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'interview_scheduled':
      case 'interview_rescheduled':
      case 'interview_cancelled':
        return (
          <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'feedback_submitted':
        return (
          <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'job_created':
        return (
          <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0h.01M16 6h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
          </svg>
        );
      default:
        return (
          <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  // Get notification colors based on type, priority, and read status
  const getNotificationColors = (type, priority, read) => {
    if (read) {
      return {
        bg: 'bg-white dark:bg-gray-800',
        hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-700',
        accent: 'text-gray-400 dark:text-gray-500',
        title: 'text-gray-700 dark:text-gray-300',
        message: 'text-gray-500 dark:text-gray-500',
        time: 'text-gray-400 dark:text-gray-500'
      };
    }

    // Unread notifications with priority/type coloring
    if (priority === 'high' || type === 'application_status_changed') {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        hoverBg: 'hover:bg-red-100 dark:hover:bg-red-900/30',
        accent: 'text-red-500 dark:text-red-400',
        title: 'text-gray-900 dark:text-white',
        message: 'text-gray-700 dark:text-gray-300',
        time: 'text-gray-600 dark:text-gray-400'
      };
    }

    if (type.startsWith('interview')) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30',
        accent: 'text-green-500 dark:text-green-400',
        title: 'text-gray-900 dark:text-white',
        message: 'text-gray-700 dark:text-gray-300',
        time: 'text-gray-600 dark:text-gray-400'
      };
    }

    // Default unread (blue)
    return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      accent: 'text-blue-500 dark:text-blue-400',
      title: 'text-gray-900 dark:text-white',
      message: 'text-gray-700 dark:text-gray-300',
      time: 'text-gray-600 dark:text-gray-400'
    };
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-2 transition-colors duration-300">
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Stay updated with your job applications and interviews
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {getUnreadCount() > 0 && (
                <button
                  onClick={markAllRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                >
                  Mark All Read
                </button>
              )}
              
              {selectedNotifications.length > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                >
                  Delete Selected ({selectedNotifications.length})
                </button>
              )}
            </div>
          </div>

          </div>

          {/* Notifications Card (Header + List) */}
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

            {/* Notifications List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
              const colors = getNotificationColors(
                notification.type,
                notification.priority,
                notification.read
              );
              const isSelected = selectedNotifications.includes(notification._id);

              return (
                <div
                  key={notification._id}
                  className={`p-4 ${colors.bg} ${colors.hoverBg} transition-colors cursor-pointer flex items-start space-x-4`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectNotification(notification._id)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm ${colors.accent} transition-colors duration-300`}>
                    {renderIcon(notification.type, colors.accent)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-semibold font-['Open_Sans'] ${colors.title} transition-colors duration-300`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className={`text-sm font-['Roboto'] ${colors.message} mb-2 transition-colors duration-300`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center space-x-4">
                      <span className={`text-xs font-['Roboto'] ${colors.time} transition-colors duration-300`}>
                        {formatTime(notification.createdAt)}
                      </span>
                      
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1 transition-colors duration-200"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Mark Read</span>
                        </button>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`/api/notifications/${notification._id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                            if (!res.ok) throw new Error('Failed to delete');
                            if (typeof refresh === 'function') await refresh();
                          } catch (err) {
                            console.error('Delete notification failed', err);
                          }
                        }}
                        className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center space-x-1 transition-colors duration-200"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7m3 4v6m4-6v6" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Empty State
            <div className="p-12 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-2 transition-colors duration-300">
                You're all caught up!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                No notifications at the moment. We'll notify you when something important happens.
              </p>
            </div>
          )}
          </div>

          {/* Load More */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
              <button
                onClick={() => (typeof refresh === 'function' ? refresh() : null)}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium font-['Roboto']"
              >
                Load More Notifications
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-2">
                Delete Notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mb-6">
                Are you sure you want to delete {selectedNotifications.length} selected notification{selectedNotifications.length > 1 ? 's' : ''}? This action will mark them as read.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteSelectedNotifications}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
