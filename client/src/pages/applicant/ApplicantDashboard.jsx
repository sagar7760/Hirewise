import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ApplicantDashboard = () => {
  // Mock data for dashboard stats
  const [dashboardStats] = useState({
    jobsApplied: 12,
    interviewsScheduled: 3,
    applicationsInReview: 5
  });

  // Mock data for recent applications
  const [recentApplications] = useState([
    {
      id: 1,
      jobTitle: 'Software Engineer',
      company: 'Tech Innovators Inc.',
      appliedDate: 'Oct 25, 2023'
    },
    {
      id: 2,
      jobTitle: 'Product Manager',
      company: 'Global Solutions Corp',
      appliedDate: 'Oct 20, 2023'
    },
    {
      id: 3,
      jobTitle: 'Data Analyst',
      company: 'Data Insights LLC',
      appliedDate: 'Oct 15, 2023'
    },
    {
      id: 4,
      jobTitle: 'UX/UI Designer',
      company: 'Creative Minds Agency',
      appliedDate: 'Oct 10, 2023'
    }
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // Mock pagination

  const handleViewDetails = (applicationId) => {
    console.log('View details for application:', applicationId);
    // TODO: Navigate to application details page
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // TODO: Fetch data for the selected page
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
            My Applications
          </h1>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Jobs Applied */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-0">
                <p className="text-sm font-medium text-gray-500 font-['Roboto']">Jobs Applied</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                  {dashboardStats.jobsApplied}
                </p>
              </div>
            </div>
          </div>

          {/* Interviews Scheduled */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4M5 21h14a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-0">
                <p className="text-sm font-medium text-gray-500 font-['Roboto']">Interviews Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                  {dashboardStats.interviewsScheduled}
                </p>
              </div>
            </div>
          </div>

          {/* Applications in Review */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-0">
                <p className="text-sm font-medium text-gray-500 font-['Roboto']">Applications in Review</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                  {dashboardStats.applicationsInReview}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">
            Recent Applications
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {recentApplications.map((application) => (
              <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
                          {application.jobTitle}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 font-['Roboto']">
                            {application.company} • Applied on {application.appliedDate}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewDetails(application.id)}
                          className="mt-3 text-sm text-black hover:underline font-medium font-['Roboto'] transition-colors"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Company Brand - Monochromatic */}
                      <div className="ml-6 flex-shrink-0">
                        <div className="w-24 h-24 rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200">
                          <div className="text-center">
                            <div className="text-xs font-bold font-['Open_Sans'] leading-tight text-gray-700">
                              {application.company.split(' ').map((word, index) => (
                                <div key={index}>{word}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors font-['Roboto'] ${
                      currentPage === page
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicantDashboard;
