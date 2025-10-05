import React from 'react';
import AdminNavbar from '../common/AdminNavbar';

// Added dark theme classes to wrapper & footer
const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      <AdminNavbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-1 text-center border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-300">
        <p className="text-sm text-gray-600 dark:text-gray-400 font-['Roboto']">
          © 2025 HireWise. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
