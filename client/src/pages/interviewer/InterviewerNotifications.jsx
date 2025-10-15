import React from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';
import { useNotifications } from '../../contexts/NotificationsContext';

const InterviewerNotifications = () => {
  const { items: notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [selectedNotifications, setSelectedNotifications] = React.useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  // Alias for future filtering/search; prevents ReferenceError and allows easy extension
  const filteredNotifications = notifications || [];

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
    await Promise.all(selectedNotifications.map(id => markRead(id).catch(() => {})));
    setSelectedNotifications([]);
    setShowDeleteConfirm(false);
  };

  const getUnreadCount = () => unreadCount;

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white font-['Open_Sans']">
                Interviewer Notifications
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-['Roboto']">
                Stay updated with your interview schedule and candidate updates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getUnreadCount() > 0 && (
                <button
                  onClick={() => markAllRead().catch(() => {})}
                  className="bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Mark All Read
                </button>
              )}
              {selectedNotifications.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/50 dark:hover:bg-red-900/80 dark:text-red-400 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Delete Selected ({selectedNotifications.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Header with bulk actions */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                    onChange={selectAllNotifications}
                    className="h-4 w-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-400 rounded-sm focus:ring-2 focus:ring-gray-300 dark:focus:ring-blue-500 checked:bg-black dark:checked:bg-blue-600 checked:border-black dark:checked:border-blue-600 relative appearance-none"
                  />
                  <span className="ml-2 text-sm font-['Roboto'] text-gray-700 dark:text-gray-300">
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
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 15a3 3 0 01-3-3V4a3 3 0 116 0v8a3 3 0 01-3 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-black dark:text-white font-['Open_Sans']">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification._id)}
                        onChange={() => toggleSelectNotification(notification._id)}
                        className="h-4 w-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-400 rounded-sm focus:ring-2 focus:ring-gray-300 dark:focus:ring-blue-500 checked:bg-black dark:checked:bg-blue-600 checked:border-black dark:checked:border-blue-600 relative appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`text-sm font-medium font-['Open_Sans'] ${
                              !notification.read ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-400'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-['Roboto'] mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500 dark:text-gray-500 font-['Roboto']">
                              {formatTime(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="flex items-center justify-center w-auto h-6 px-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                title="Mark as read"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs ml-1.5 font-['Roboto']">Mark Read</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {filteredNotifications.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
              <button className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium font-['Roboto']">
                Load More Notifications
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 font-['Open_Sans']">
              Delete Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-['Roboto']">
              Are you sure you want to delete {selectedNotifications.length} selected notification{selectedNotifications.length > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteSelectedNotifications}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </InterviewerLayout>
  );
};

export default InterviewerNotifications;