import React from 'react';
import ApplicantNavbar from '../common/ApplicantNavbar';

const DashboardLayout = ({ children, showFooter = false }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ApplicantNavbar />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && (
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-gray-500 text-sm font-['Roboto']">
              © 2025 HireWise. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default DashboardLayout;
