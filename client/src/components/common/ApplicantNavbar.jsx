import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import hirewiseLogo from '../../assets/hirewise.svg';

const ApplicantNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isNotificationHovered, setIsNotificationHovered] = useState(false);
  const [isNotificationClicked, setIsNotificationClicked] = useState(false);
  const dropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const notificationHoverTimeoutRef = useRef(null);
  
  const navItems = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Applications', path: '/applicant/applications' },
  ];

  // Mock notification data
  const mockNotifications = [
    {
      id: 1,
      type: 'application',
      title: 'Application Received',
      message: 'Your application for Senior Software Engineer has been received.',
      time: '2 hours ago',
      read: false,
      icon: 'document'
    },
    {
      id: 2,
      type: 'interview',
      title: 'Interview Scheduled',
      message: 'Interview scheduled for Product Manager position.',
      time: '1 day ago',
      read: false,
      icon: 'calendar'
    },
    {
      id: 3,
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from HR.',
      time: '2 days ago',
      read: true,
      icon: 'mail'
    }
  ];

  const unreadNotifications = mockNotifications.filter(n => !n.read);

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
        setIsClicked(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setIsNotificationDropdownOpen(false);
        setIsNotificationClicked(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle hover behavior
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
    if (!isClicked) {
      setIsProfileDropdownOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isClicked) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsProfileDropdownOpen(false);
      }, 200); // Small delay to prevent flickering
    }
  };

  const handleClick = () => {
    setIsClicked(!isClicked);
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleProfileMenuClick = (action) => {
    console.log(`Clicked: ${action}`);
    setIsProfileDropdownOpen(false);
    setIsClicked(false);
    
    // Navigate based on the action
    if (action === 'Profile') {
      navigate('/profile');
    } else if (action === 'My Applications') {
      navigate('/applicant/applications');
    } else if (action === 'Saved Jobs') {
      navigate('/saved-jobs');
    } else if (action === 'Sign Out') {
      logout();
    }
    // TODO: Implement navigation for other menu items when pages are created
  };

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
  };

  const handleNotificationItemClick = (notificationId) => {
    console.log(`Clicked notification: ${notificationId}`);
    setIsNotificationDropdownOpen(false);
    setIsNotificationClicked(false);
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
    setIsNotificationDropdownOpen(false);
    setIsNotificationClicked(false);
  };

  const getNotificationIcon = (iconType) => {
    switch (iconType) {
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
      case 'mail':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo only */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-auto"
                  src={hirewiseLogo}
                  alt="HireWise"
                />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 font-['Open_Sans']">
                HireWise
              </span>
            </Link>
          </div>

          {/* Navigation Links, Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="flex items-center space-x-8 mr-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors font-['Roboto'] ${
                    isActivePath(item.path)
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {/* Notifications Dropdown */}
            <div 
              className="relative" 
              ref={notificationDropdownRef}
              onMouseEnter={handleNotificationMouseEnter}
              onMouseLeave={handleNotificationMouseLeave}
            >
              <button 
                onClick={handleNotificationClick}
                className={`relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100 ${
                  isNotificationDropdownOpen ? 'text-gray-600 bg-gray-100' : ''
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification Badge */}
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadNotifications.length}
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
                    <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">Notifications</h3>
                    {unreadNotifications.length > 0 && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                        {unreadNotifications.length} unread
                      </span>
                    )}
                  </div>
                </div>

                {/* Notification Items */}
                <div className="max-h-96 overflow-y-auto">
                  {mockNotifications.length > 0 ? (
                    mockNotifications.slice(0, 4).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationItemClick(notification.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            !notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'
                          } ${notification.type === 'application' ? 'text-blue-500' : 
                             notification.type === 'interview' ? 'text-green-500' : 
                             notification.type === 'message' ? 'text-purple-500' : 'text-gray-500'}`}>
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
                                    <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
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
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 font-['Roboto']">No notifications</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {mockNotifications.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <button
                      onClick={handleViewAllNotifications}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium font-['Roboto'] transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile */}
            <div 
              className="relative" 
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                onClick={handleClick}
                className={`flex items-center text-sm rounded-full focus:outline-none transition-all duration-200 hover:ring-2 hover:ring-gray-300 ${
                  isProfileDropdownOpen ? 'ring-2 ring-gray-400' : ''
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture.startsWith('data:') ? 
                           user.profilePicture : 
                           user.profilePicture.startsWith('/uploads') ? 
                           `${window.location.origin}${user.profilePicture}` :
                           user.profilePicture}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Profile image failed to load:', user.profilePicture);
                        if (e.target) {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }
                      }}
                    />
                  ) : null}
                  {!user?.profilePicture && (
                    <div className="text-xs font-bold text-gray-600 font-['Open_Sans']">
                      {user?.fullName ? 
                        user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 
                        user?.firstName && user?.lastName ?
                        `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() :
                        user?.email ?
                        user.email[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              </button>

              {/* Profile Dropdown with Animation */}
              <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 ease-out transform origin-top-right ${
                isProfileDropdownOpen 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                    {user?.fullName || 
                     (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '') ||
                     user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 font-['Roboto']">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => handleProfileMenuClick('Profile')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto'] transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  
                  <button
                    onClick={() => handleProfileMenuClick('My Applications')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto'] transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    My Applications
                  </button>
                  
                  <button
                    onClick={() => handleProfileMenuClick('Saved Jobs')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto'] transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Saved Jobs
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Sign Out */}
                <button
                  onClick={() => handleProfileMenuClick('Sign Out')}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-['Roboto'] transition-colors duration-150"
                >
                  <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu (hidden by default) */}
      <div className="md:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`block pl-3 pr-4 py-2 text-base font-medium transition-colors font-['Roboto'] ${
                isActivePath(item.path)
                  ? 'text-black bg-gray-50 border-l-4 border-black'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default ApplicantNavbar;
