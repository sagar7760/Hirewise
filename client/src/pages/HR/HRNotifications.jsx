import React, { useState, useEffect } from 'react';
import HRLayout from '../../components/layout/HRLayout';

const HRNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'application',
      title: 'New Application Received',
      message: 'John Smith applied for Senior Frontend Developer position',
      time: '2025-09-10T14:30:00Z',
      read: false,
      priority: 'medium',
      actionUrl: '/hr/applications',
      icon: 'user-plus',
      metadata: {
        applicantName: 'John Smith',
        jobTitle: 'Senior Frontend Developer',
        jobId: 1
      }
    },
    {
      id: 2,
      type: 'interview',
      title: 'Interview Scheduled',
      message: 'Interview with Sarah Johnson scheduled for tomorrow at 2:00 PM',
      time: '2025-09-10T13:15:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/hr/interviews',
      icon: 'calendar',
      metadata: {
        candidateName: 'Sarah Johnson',
        interviewTime: '2025-09-11T14:00:00Z',
        interviewType: 'Technical Interview'
      }
    },
    {
      id: 3,
      type: 'deadline',
      title: 'Application Deadline Approaching',
      message: 'Product Manager position deadline is in 3 days',
      time: '2025-09-10T12:00:00Z',
      read: true,
      priority: 'medium',
      actionUrl: '/hr/jobs',
      icon: 'clock',
      metadata: {
        jobTitle: 'Product Manager',
        deadline: '2025-09-13T23:59:59Z',
        daysLeft: 3
      }
    },
    {
      id: 4,
      type: 'system',
      title: 'Weekly Report Available',
      message: 'Your weekly hiring report is ready for download',
      time: '2025-09-10T09:00:00Z',
      read: true,
      priority: 'low',
      actionUrl: '/hr/reports',
      icon: 'document-report',
      metadata: {
        reportType: 'Weekly Hiring Report',
        period: 'Sep 2-8, 2025'
      }
    },
    {
      id: 5,
      type: 'application',
      title: 'Application Status Update',
      message: 'Mike Wilson moved to interview stage for UX Designer position',
      time: '2025-09-10T08:45:00Z',
      read: false,
      priority: 'medium',
      actionUrl: '/hr/applications',
      icon: 'arrow-right',
      metadata: {
        applicantName: 'Mike Wilson',
        jobTitle: 'UX Designer',
        newStatus: 'Interview Stage'
      }
    },
    {
      id: 6,
      type: 'interview',
      title: 'Interview Completed',
      message: 'Technical interview with Emma Davis completed - feedback pending',
      time: '2025-09-09T16:30:00Z',
      read: true,
      priority: 'medium',
      actionUrl: '/hr/interviews',
      icon: 'check-circle',
      metadata: {
        candidateName: 'Emma Davis',
        interviewType: 'Technical Interview',
        status: 'Completed - Feedback Pending'
      }
    },
    {
      id: 7,
      type: 'system',
      title: 'Job Posting Published',
      message: 'Data Scientist position has been successfully published',
      time: '2025-09-09T14:20:00Z',
      read: true,
      priority: 'low',
      actionUrl: '/hr/jobs',
      icon: 'megaphone',
      metadata: {
        jobTitle: 'Data Scientist',
        status: 'Published'
      }
    },
    {
      id: 8,
      type: 'deadline',
      title: 'Interview Reminder',
      message: 'Reminder: Interview with Alex Chen in 1 hour',
      time: '2025-09-09T13:00:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/hr/interviews',
      icon: 'bell',
      metadata: {
        candidateName: 'Alex Chen',
        interviewTime: '2025-09-09T14:00:00Z',
        timeLeft: '1 hour'
      }
    }
  ]);

  const [filteredNotifications, setFilteredNotifications] = useState(notifications);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Since we removed filters and search, just show all notifications sorted by time
    const sorted = [...notifications].sort((a, b) => new Date(b.time) - new Date(a.time));
    setFilteredNotifications(sorted);
  }, [notifications]);

  const formatTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const deleteSelectedNotifications = () => {
    setNotifications(prev =>
      prev.filter(notification => !selectedNotifications.includes(notification.id))
    );
    setSelectedNotifications([]);
    setShowDeleteConfirm(false);
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                Notifications
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Stay updated with all your HR activities and important updates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getUnreadCount() > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Mark All Read
                </button>
              )}
              {selectedNotifications.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Delete Selected ({selectedNotifications.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Header with bulk actions */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={selectAllNotifications}
                    className="h-4 w-4 bg-white border-2 border-black rounded-sm focus:ring-2 focus:ring-gray-300 checked:bg-white checked:border-black relative appearance-none"
                    style={{
                      backgroundImage: selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0 
                        ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-1.708-1.708L6.5 7.584 4.354 5.438l-1.708 1.708L6.5 11l7.354-7.354z'/%3e%3c/svg%3e\")"
                        : "none"
                    }}
                  />
                  <span className="ml-2 text-sm font-['Roboto']">
                    {selectedNotifications.length > 0 ? `${selectedNotifications.length} selected` : 'Select all'}
                      </span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 font-['Roboto']">
                    {filteredNotifications.length} notifications
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-200">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={() => toggleSelectNotification(notification.id)}
                            className="h-4 w-4 bg-white border-2 border-black rounded-sm focus:ring-2 focus:ring-gray-300 checked:bg-white checked:border-black relative appearance-none"
                            style={{
                              backgroundImage: selectedNotifications.includes(notification.id)
                                ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-1.708-1.708L6.5 7.584 4.354 5.438l-1.708 1.708L6.5 11l7.354-7.354z'/%3e%3c/svg%3e\")"
                                : "none"
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`text-sm font-medium font-['Open_Sans'] ${
                                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 font-['Roboto'] mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4">
                                <span className="text-xs text-gray-500 font-['Roboto']">
                                  {formatTime(notification.time)}
                                </span>
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="flex items-center justify-center w-10 h-6 rounded-4xl bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 transition-colors"
                                    title="Mark as read"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <button className="text-gray-400 hover:text-gray-600">
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
                <div className="border-t border-gray-200 p-4 text-center">
                  <button className="text-sm text-gray-600 hover:text-gray-900 font-medium font-['Roboto']">
                    Load More Notifications
                  </button>
                </div>
              )}
            </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Open_Sans']">
              Delete Notifications
            </h3>
            <p className="text-gray-600 mb-6 font-['Roboto']">
              Are you sure you want to delete {selectedNotifications.length} selected notification{selectedNotifications.length > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
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
    </HRLayout>
  );
};

export default HRNotifications;
