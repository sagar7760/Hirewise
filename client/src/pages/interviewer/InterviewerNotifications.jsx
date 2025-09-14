import React, { useState, useEffect } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';

const InterviewerNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'interview_scheduled',
      title: 'New Interview Scheduled',
      message: 'Interview with Sarah Johnson for Frontend Developer position scheduled for tomorrow at 10:00 AM',
      time: '2025-09-14T16:30:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/interviewer/upcoming-interviews',
      icon: 'calendar-plus',
      metadata: {
        candidateName: 'Sarah Johnson',
        jobTitle: 'Frontend Developer',
        scheduledTime: '10:00 AM',
        interviewType: 'Technical'
      }
    },
    {
      id: 2,
      type: 'interview_reminder',
      title: 'Interview Reminder',
      message: 'You have an interview with Mike Chen in 30 minutes - React Developer position',
      time: '2025-09-14T15:45:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/interviewer/todays-interviews',
      icon: 'clock',
      metadata: {
        candidateName: 'Mike Chen',
        jobTitle: 'React Developer',
        timeRemaining: '30 minutes',
        meetingLink: 'https://meet.google.com/abc-def-ghi'
      }
    },
    {
      id: 3,
      type: 'feedback_pending',
      title: 'Feedback Overdue',
      message: 'Feedback for Emily Davis (UI/UX Designer) is now 3 days overdue',
      time: '2025-09-14T14:00:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/interviewer/pending-feedback',
      icon: 'exclamation-triangle',
      metadata: {
        candidateName: 'Emily Davis',
        jobTitle: 'UI/UX Designer',
        daysPending: 3,
        interviewDate: '2025-09-11'
      }
    },
    {
      id: 4,
      type: 'interview_rescheduled',
      title: 'Interview Rescheduled',
      message: 'Interview with David Wilson has been rescheduled to September 16, 2:00 PM',
      time: '2025-09-14T12:15:00Z',
      read: false,
      priority: 'medium',
      actionUrl: '/interviewer/upcoming-interviews',
      icon: 'calendar-edit',
      metadata: {
        candidateName: 'David Wilson',
        jobTitle: 'Full Stack Developer',
        newDate: 'September 16, 2:00 PM',
        reason: 'Candidate request'
      }
    },
    {
      id: 5,
      type: 'feedback_submitted',
      title: 'Feedback Submitted Successfully',
      message: 'Your feedback for Robert Taylor (DevOps Engineer) has been submitted and shared with HR',
      time: '2025-09-14T11:30:00Z',
      read: true,
      priority: 'low',
      actionUrl: '/interviewer/past-interviews',
      icon: 'check-circle',
      metadata: {
        candidateName: 'Robert Taylor',
        jobTitle: 'DevOps Engineer',
        recommendation: 'hire',
        overallRating: 4
      }
    },
    {
      id: 6,
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      message: 'Interview with Lisa Martinez has been cancelled due to candidate unavailability',
      time: '2025-09-14T10:00:00Z',
      read: true,
      priority: 'medium',
      actionUrl: '/interviewer/upcoming-interviews',
      icon: 'x-circle',
      metadata: {
        candidateName: 'Lisa Martinez',
        jobTitle: 'Product Manager',
        reason: 'Candidate unavailability',
        originalTime: 'September 15, 3:00 PM'
      }
    },
    {
      id: 7,
      type: 'schedule_conflict',
      title: 'Schedule Conflict Alert',
      message: 'You have overlapping interview slots on September 17. Please review your schedule.',
      time: '2025-09-13T18:45:00Z',
      read: false,
      priority: 'high',
      actionUrl: '/interviewer/upcoming-interviews',
      icon: 'alert-triangle',
      metadata: {
        conflictDate: 'September 17',
        conflictingInterviews: 2,
        timeSlot: '2:00 PM - 3:00 PM'
      }
    },
    {
      id: 8,
      type: 'candidate_materials',
      title: 'New Candidate Materials',
      message: 'Updated resume and portfolio uploaded for Jennifer Kim - Product Designer position',
      time: '2025-09-13T16:20:00Z',
      read: true,
      priority: 'low',
      actionUrl: '/interviewer/upcoming-interviews',
      icon: 'document-add',
      metadata: {
        candidateName: 'Jennifer Kim',
        jobTitle: 'Product Designer',
        documentsAdded: ['Resume', 'Portfolio'],
        interviewDate: 'September 16'
      }
    },
    {
      id: 9,
      type: 'evaluation_request',
      title: 'Evaluation Method Updated',
      message: 'HR has updated the evaluation criteria for Senior Backend Developer positions',
      time: '2025-09-13T14:30:00Z',
      read: true,
      priority: 'medium',
      actionUrl: '/interviewer/pending-feedback',
      icon: 'clipboard-list',
      metadata: {
        position: 'Senior Backend Developer',
        updatedCriteria: ['Technical Skills', 'System Design', 'Code Quality'],
        effectiveFrom: 'September 15'
      }
    },
    {
      id: 10,
      type: 'interview_completed',
      title: 'Interview Completed',
      message: 'Interview with Alex Rodriguez for React Developer position completed successfully',
      time: '2025-09-13T12:00:00Z',
      read: true,
      priority: 'low',
      actionUrl: '/interviewer/pending-feedback',
      icon: 'check',
      metadata: {
        candidateName: 'Alex Rodriguez',
        jobTitle: 'React Developer',
        duration: '60 minutes',
        interviewType: 'Technical',
        feedbackDue: '3 days'
      }
    }
  ]);

  const [filteredNotifications, setFilteredNotifications] = useState(notifications);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Sort notifications by time (newest first)
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
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black font-['Open_Sans']">
                Interviewer Notifications
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Stay updated with your interview schedule and candidate updates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getUnreadCount() > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
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
                <h3 className="mt-2 text-sm font-medium text-black font-['Open_Sans']">No notifications</h3>
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
                              !notification.read ? 'text-black' : 'text-gray-700'
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
            <h3 className="text-lg font-semibold text-black mb-4 font-['Open_Sans']">
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
    </InterviewerLayout>
  );
};

export default InterviewerNotifications;