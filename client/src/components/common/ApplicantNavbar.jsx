import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import hirewiseLogo from '../../assets/hirewise.svg';

const ApplicantNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  const navItems = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Jobs', path: '/jobs' },
  ];

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
      navigate('/my-applications');
    }
    // TODO: Implement navigation for other menu items when pages are created
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
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

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
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

          {/* Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Bell Icon for Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Profile */}
            <div 
              className="relative" 
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                onClick={handleClick}
                className={`bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 hover:ring-2 hover:ring-gray-300 ${
                  isProfileDropdownOpen ? 'ring-2 ring-gray-400' : ''
                }`}
              >
                <span className="sr-only">Open user menu</span>
                <img
                  className="h-8 w-8 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Profile"
                />
              </button>

              {/* Profile Dropdown with Animation */}
              <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 ease-out transform origin-top-right ${
                isProfileDropdownOpen 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">John Doe</p>
                  <p className="text-sm text-gray-500 font-['Roboto']">john.doe@example.com</p>
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
