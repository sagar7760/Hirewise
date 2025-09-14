import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import hirewiseLogo from '../../assets/hirewise.svg';

const InterviewerNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isNotificationHovered, setIsNotificationHovered] = useState(false);
  const [isNotificationClicked, setIsNotificationClicked] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isProfileClicked, setIsProfileClicked] = useState(false);
  
  const notificationDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationHoverTimeoutRef = useRef(null);
  const profileHoverTimeoutRef = useRef(null);

  // Sample notifications for Interviewer
  const [notifications] = useState([
    {
      id: 1,
      type: 'reminder',
      title: 'Interview Starting Soon',
      message: 'Interview with Sarah Johnson starts in 30 minutes',
      time: '5 minutes ago',
      read: false,
      icon: 'clock'
    },
    {
      id: 2,
      type: 'feedback',
      title: 'Feedback Reminder',
      message: 'You have 3 pending feedback submissions',
      time: '1 hour ago',
      read: false,
      icon: 'document'
    },
    {
      id: 3,
      type: 'schedule',
      title: 'Interview Rescheduled',
      message: 'Interview with Mike Chen moved to tomorrow 2:00 PM',
      time: '2 hours ago',
      read: true,
      icon: 'calendar'
    }
  ]);

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  // Navigation items for Interviewer (simplified)
  const navigationItems = [
    { name: 'Dashboard', href: '/interviewer/dashboard' },
    { name: 'Interviews', href: '/interviewer/interviews' },
    { name: 'Pending Feedback', href: '/interviewer/feedback' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setIsNotificationDropdownOpen(false);
        setIsNotificationClicked(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
        setIsProfileClicked(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsProfileDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsNotificationClicked(false);
    setIsProfileClicked(false);
  }, [location.pathname]);

  // Notification dropdown handlers
  const handleNotificationMouseEnter = () => {
    if (notificationHoverTimeoutRef.current) {
      clearTimeout(notificationHoverTimeoutRef.current);
    }
    setIsNotificationHovered(true);
    if (!isNotificationClicked) {
      setIsNotificationDropdownOpen(true);
    }
  };

  const handleNotificationMouseLeave = () => {
    setIsNotificationHovered(false);
    if (!isNotificationClicked) {
      notificationHoverTimeoutRef.current = setTimeout(() => {
        setIsNotificationDropdownOpen(false);
      }, 200);
    }
  };

  const handleNotificationClick = () => {
    setIsNotificationClicked(!isNotificationClicked);
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    setIsProfileDropdownOpen(false);
  };

  // Profile dropdown handlers
  const handleProfileMouseEnter = () => {
    if (profileHoverTimeoutRef.current) {
      clearTimeout(profileHoverTimeoutRef.current);
    }
    setIsProfileHovered(true);
    if (!isProfileClicked) {
      setIsProfileDropdownOpen(true);
    }
  };

  const handleProfileMouseLeave = () => {
    setIsProfileHovered(false);
    if (!isProfileClicked) {
      profileHoverTimeoutRef.current = setTimeout(() => {
        setIsProfileDropdownOpen(false);
      }, 200);
    }
  };

  const handleProfileClick = () => {
    setIsProfileClicked(!isProfileClicked);
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsNotificationDropdownOpen(false);
  };

  const handleProfileMenuClick = (action) => {
    console.log('Profile action:', action);
    setIsProfileDropdownOpen(false);
    setIsProfileClicked(false);

    if (action === 'Profile') {
      navigate('/interviewer/profile');
    } else if (action === 'Logout') {
      // Handle logout logic
      navigate('/login');
    }
  };

  const handleNotificationItemClick = (notificationId) => {
    console.log(`Clicked notification: ${notificationId}`);
    setIsNotificationDropdownOpen(false);
    setIsNotificationClicked(false);
  };

  const getNotificationIcon = (iconType) => {
    switch (iconType) {
      case 'clock':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo only */}
          <div className="flex items-center">
            <Link to="/interviewer/dashboard" className="flex items-center">
              <img src={hirewiseLogo} alt="HireWise" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-black font-['Open_Sans']">HireWise</span>
              <span className="ml-2 text-sm text-gray-500 font-['Roboto']">Interviewer</span>
            </Link>
          </div>

          {/* Right side - Navigation, Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Navigation Menu */}
            <div className="hidden md:flex md:space-x-8 mr-4">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/interviewer/dashboard' && location.pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors font-['Roboto'] ${
                      isActive
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-600 hover:text-black hover:border-b-2 hover:border-gray-300'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
            {/* Notifications */}
            <div 
              className="relative" 
              ref={notificationDropdownRef}
              onMouseEnter={handleNotificationMouseEnter}
              onMouseLeave={handleNotificationMouseLeave}
            >
              <button
                onClick={handleNotificationClick}
                className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative ${
                  isNotificationDropdownOpen ? 'bg-gray-100 text-gray-900' : ''
                }`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-black text-white text-xs rounded-full flex items-center justify-center font-['Roboto']">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <div className={`absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 ease-out transform origin-top-right ${
                isNotificationDropdownOpen 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">Interviewer Notifications</h3>
                    {unreadNotifications.length > 0 && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                        {unreadNotifications.length} unread
                      </span>
                    )}
                  </div>
                </div>

                {/* Notification Items */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationItemClick(notification.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                        !notification.read ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          !notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'
                        } ${notification.type === 'reminder' ? 'text-gray-700' : 
                           notification.type === 'feedback' ? 'text-gray-700' : 
                           notification.type === 'schedule' ? 'text-gray-700' : 'text-gray-500'}`}>
                          {getNotificationIcon(notification.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium font-['Open_Sans'] ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                                {!notification.read && (
                                  <span className="ml-2 w-2 h-2 bg-gray-800 rounded-full inline-block"></span>
                                )}
                              </p>
                              <p className={`mt-1 text-xs font-['Roboto'] ${
                                !notification.read ? 'text-gray-600' : 'text-gray-500'
                              } line-clamp-2`}>
                                {notification.message}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 font-['Roboto'] flex-shrink-0 ml-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Footer with View All link */}
                <div className="border-t border-gray-100 px-4 py-3">
                  <Link
                    to="/interviewer/notifications"
                    onClick={() => setIsNotificationDropdownOpen(false)}
                    className="text-sm text-gray-600 hover:text-gray-900 font-['Roboto'] transition-colors"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div 
              className="relative" 
              ref={profileDropdownRef}
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              <button
                onClick={handleProfileClick}
                className={`flex items-center text-sm rounded-full focus:outline-none transition-all duration-200 hover:ring-2 hover:ring-gray-300 ${
                  isProfileDropdownOpen ? 'ring-2 ring-gray-400' : ''
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </button>

              {/* Profile Dropdown */}
              <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 ease-out transform origin-top-right ${
                isProfileDropdownOpen 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">Interviewer</p>
                  <p className="text-xs text-gray-500 font-['Roboto']">interviewer@hirewise.com</p>
                </div>
                <button
                  onClick={() => handleProfileMenuClick('Profile')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-['Roboto']"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </div>
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => handleProfileMenuClick('Logout')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-['Roboto']"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu (hidden by default) */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/interviewer/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 text-base font-medium transition-colors font-['Roboto'] ${
                  isActive
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default InterviewerNavbar;