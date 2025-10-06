import React from 'react';
import InterviewerNavbar from '../common/InterviewerNavbar';
import { useTheme } from '../../contexts/ThemeContext';

const InterviewerLayout = ({ children }) => {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-black'}`}>
      {/* Navbar */}
      <InterviewerNavbar />

      {/* Main Content */}
      <div className="flex-1">
        <main className="relative overflow-y-auto focus:outline-none">
          {children}
        </main>
        
        {/* Footer */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-4 py-1`}>
          <div className="text-center">
            <p className={`text-sm font-['Roboto'] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>© 2025 HireWise. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerLayout;