import React from 'react';
import AdminNavbar from '../common/AdminNavbar';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNavbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-1 text-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-600 font-['Roboto']">
          © 2025 HireWise. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
