import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'hr_management',
      title: 'New HR Manager Added',
      message: 'Sarah Wilson has been added as HR Manager for Marketing Department',
      time: '2025-09-10T15:30:00Z',
      read: false,
      priority: 'medium',
      actionUrl: '/admin/hr-management',
      icon: 'user-plus',
      metadata: {
        hrName: 'Sarah Wilson',
        department: 'Marketing',
        userId: 'HR001'
      }
    },
    {
      id: 2,
      type: 'system',
      title: 'System Backup Completed',
      message: 'Daily system backup completed successfully at 3:00 AM',
      time: '2025-09-10T14:15:00Z',
      read: false,
      priority: 'low',
      actionUrl: '/admin/system',
      icon: 'database',
      metadata: {
        backupSize: '2.5 GB',
        duration: '45 minutes'
      }
    },
    {
      id: 3,
      type: 'security',
      title: 'Security Alert',
      message: 'Multiple failed login attempts detected for admin account',
      time: '2025-09-10T13:00:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/admin/security',
      icon: 'shield',
      metadata: {
        attempts: 5,
        ipAddress: '192.168.1.100',
        timeframe: '30 minutes'
      }
    },
    {
      id: 4,
      type: 'organization',
      title: 'Organization Settings Updated',
      message: 'Company profile information has been updated by John Admin',
      time: '2025-09-10T11:45:00Z',
      read: true,
      priority: 'medium',
      actionUrl: '/admin/organization',
      icon: 'building',
      metadata: {
        updatedBy: 'John Admin',
        changes: 'Company address, phone number'
      }
    },
    {
      id: 5,
      type: 'user_activity',
      title: 'New User Registration',
      message: 'Michael Brown registered as a new candidate on the platform',
      time: '2025-09-10T10:30:00Z',
      read: false,
      priority: 'low',
      actionUrl: '/admin/users',
      icon: 'user-check',
      metadata: {
        userName: 'Michael Brown',
        userType: 'Candidate',
        email: 'michael.brown@email.com'
      }
    },
    {
      id: 6,
      type: 'job_management',
      title: 'Job Posting Requires Approval',
      message: 'Senior DevOps Engineer position posted by HR Team needs admin approval',
      time: '2025-09-10T09:15:00Z',
      read: true,
      priority: 'medium',
      actionUrl: '/admin/jobs',
      icon: 'clipboard-check',
      metadata: {
        jobTitle: 'Senior DevOps Engineer',
        postedBy: 'HR Team',
        department: 'Engineering'
      }
    },
    {
      id: 7,
      type: 'reports',
      title: 'Monthly Analytics Report Ready',
      message: 'August 2025 platform analytics and hiring report is now available',
      time: '2025-09-09T18:00:00Z',
      read: true,
      priority: 'low',
      actionUrl: '/admin/reports',
      icon: 'chart-bar',
      metadata: {
        reportPeriod: 'August 2025',
        reportType: 'Monthly Analytics'
      }
    },
    {
      id: 8,
      type: 'interviewer_management',
      title: 'Interview Capacity Alert',
      message: 'Technical interview slots are 90% booked for next week',
      time: '2025-09-09T16:30:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/admin/interviewer-management',
      icon: 'calendar-alert',
      metadata: {
        capacity: '90%',
        period: 'Next week',
        interviewType: 'Technical'
      }
    },
    {
      id: 9,
      type: 'system',
      title: 'Platform Maintenance Scheduled',
      message: 'Scheduled maintenance on September 15, 2025 from 2:00 AM to 4:00 AM',
      time: '2025-09-09T14:00:00Z',
      read: true,
      priority: 'medium',
      actionUrl: '/admin/maintenance',
      icon: 'wrench',
      metadata: {
        maintenanceDate: '2025-09-15',
        duration: '2 hours',
        downtime: 'Expected'
      }
    },
    {
      id: 10,
      type: 'performance',
      title: 'Server Performance Alert',
      message: 'Database server CPU usage exceeded 85% for 15 minutes',
      time: '2025-09-09T12:45:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/admin/performance',
      icon: 'cpu',
      metadata: {
        serverType: 'Database',
        cpuUsage: '85%',
        duration: '15 minutes'
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
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                Admin Notifications
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Stay updated with all system activities and administrative alerts
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getUnreadCount() > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-gray-200 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Mark All Read
                </button>
              )}
              {selectedNotifications.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-gray-200 hover:bg-red-200 text-red-500 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
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
    </AdminLayout>
  );
};

export default AdminNotifications;
