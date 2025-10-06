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
                  onClick={markAllAsRead}
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
                    checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={selectAllNotifications}
                    className="h-4 w-4 rounded-sm border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">
                    {selectedNotifications.length > 0 ? `${selectedNotifications.length} selected` : 'Select all'}
                      </span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                    {filteredNotifications.length} notifications
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.length === 0 ? (
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
                  filteredNotifications.map((notification) => {
                    const colors = getNotificationColors(notification.type, notification.read);
                    return (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors duration-300 flex items-start space-x-4 ${colors.bg} ${colors.hoverBg}`}
                    >
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => toggleSelectNotification(notification.id)}
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
                                {formatTime(notification.time)}
                              </span>
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
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
                            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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