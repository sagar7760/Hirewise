import React from 'react';
import HRNavbar from '../common/HRNavbar';

const HRLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <HRNavbar />

      {/* Main Content */}
      <div className="flex-1">
        <main className="relative overflow-y-auto focus:outline-none">
          {children}
        </main>
        
        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-4 py-1">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-['Roboto']">
              © 2025 HireWise. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRLayout;
