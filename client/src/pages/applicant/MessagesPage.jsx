import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NotificationsPage = () => {
  const [notifications] = useState([
    {
      id: 1,
      type: 'application',
      title: 'Application Received',
      message: 'Your application for Senior Software Engineer at Tech Solutions Inc. has been received.',
      time: '2 hours ago',
      read: false,
      icon: 'document'
    },
    {
      id: 2,
      type: 'interview',
      title: 'Interview Scheduled',
      message: 'Interview scheduled for Product Manager position at Innovate Systems on March 20, 2024.',
      time: '1 day ago',
      read: false,
      icon: 'calendar'
    },
    {
      id: 3,
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from HR at Global Dynamics regarding your application.',
      time: '2 days ago',
      read: true,
      icon: 'mail'
    },
    {
      id: 4,
      type: 'job',
      title: 'New Job Match',
      message: 'New job opportunities matching your profile have been posted.',
      time: '3 days ago',
      read: true,
      icon: 'briefcase'
    },
    {
      id: 5,
      type: 'application',
      title: 'Application Status Update',
      message: 'Your application for UX Designer at Creative Agency has been reviewed.',
      time: '1 week ago',
      read: true,
      icon: 'document'
    }
  ]);

  const getNotificationIcon = (iconType) => {
    switch (iconType) {
      case 'document':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'mail':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'briefcase':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type, read) => {
    if (read) return 'text-gray-400';
    
    switch (type) {
      case 'application':
        return 'text-blue-500';
      case 'interview':
        return 'text-green-500';
      case 'message':
        return 'text-purple-500';
      case 'job':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-2 transition-colors duration-300">
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Stay updated with your job applications and messages.
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium font-['Roboto']">
                {unreadCount} unread
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 transition-colors duration-300">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  !notification.read ? 'bg-white dark:bg-gray-700 shadow-sm' : 'bg-gray-100 dark:bg-gray-600'
                } ${getNotificationColor(notification.type, notification.read)} transition-colors duration-300`}>
                  {getNotificationIcon(notification.icon)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium font-['Open_Sans'] ${
                        !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      } transition-colors duration-300`}>
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                        )}
                      </h3>
                      <p className={`mt-1 text-sm font-['Roboto'] ${
                        !notification.read ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'
                      } transition-colors duration-300`}>
                        {notification.message}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto'] flex-shrink-0 ml-4 transition-colors duration-300">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors duration-300">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-2 transition-colors duration-300">
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
