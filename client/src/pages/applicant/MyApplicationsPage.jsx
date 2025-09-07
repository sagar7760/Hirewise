import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const MyApplicationsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-4">
            My Applications
          </h1>
          <p className="text-lg text-gray-600 font-['Roboto']">
            View and manage all your job applications in detail.
          </p>
          <div className="mt-8 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500 font-['Roboto']">
              Detailed applications management will be implemented here.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyApplicationsPage;
