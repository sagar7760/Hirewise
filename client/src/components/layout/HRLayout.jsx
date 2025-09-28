import React from 'react';
import HRNavbar from '../common/HRNavbar';

const HRLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <HRNavbar />

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        {children}
      </main>
      
      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-1 mt-auto">
        <div className="text-center">
          <p className="text-sm text-gray-500 font-['Roboto']">
            © 2025 HireWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HRLayout;
