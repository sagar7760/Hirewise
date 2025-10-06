import React from 'react';
import HRNavbar from '../common/HRNavbar';

const HRLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <HRNavbar />

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        {children}
      </main>
      
      {/* Footer */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-1 mt-auto transition-colors duration-300">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">
            © 2025 HireWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HRLayout;
