import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const AdminDashboard = () => {
  const [stats] = useState({
    totalJobs: 142,
    totalCandidates: 1250,
    totalHRs: 8,
    totalInterviewers: 15,
    selectedCandidates: 89,
    pendingApplications: 320
  });

  const [recentActivity] = useState([
    {
      id: 1,
      type: 'job_posted',
      message: 'Sarah Johnson posted "Senior Frontend Developer" position',
      time: '2 hours ago',
      hr: 'Sarah Johnson'
    },
    {
      id: 2,
      type: 'candidate_selected',
      message: '3 candidates selected for "Product Manager" role',
      time: '4 hours ago',
      hr: 'Michael Chen'
    },
    {
      id: 3,
      type: 'hr_added',
      message: 'New HR "Emma Davis" added to the organization',
      time: '1 day ago',
      hr: 'System'
    },
    {
      id: 4,
      type: 'interview_scheduled',
      message: '5 interviews scheduled for "Data Scientist" position',
      time: '2 days ago',
      hr: 'David Wilson'
    }
  ]);

  const [applicantsTrend] = useState([
    { month: 'Jan', applications: 180, selected: 12 },
    { month: 'Feb', applications: 220, selected: 18 },
    { month: 'Mar', applications: 280, selected: 22 },
    { month: 'Apr', applications: 320, selected: 28 },
    { month: 'May', applications: 280, selected: 24 },
    { month: 'Jun', applications: 350, selected: 32 }
  ]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'job_posted':
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
        );
      case 'candidate_selected':
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'hr_added':
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'interview_scheduled':
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 font-['Roboto']">
            Manage your organization's hiring process and team members.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{stats.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{stats.totalCandidates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total HRs</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{stats.totalHRs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Interviewers</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{stats.totalInterviewers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Applications Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Applications Trend
            </h3>
            <div className="h-64 flex items-end space-x-2">
              {applicantsTrend.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center space-y-1">
                    <div className="w-full bg-gray-200 rounded-t">
                      <div 
                        className="bg-gray-700 rounded-t transition-all duration-500"
                        style={{ height: `${(data.applications / 350) * 200}px` }}
                      ></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-t">
                      <div 
                        className="bg-gray-900 rounded-t transition-all duration-500"
                        style={{ height: `${(data.selected / 35) * 50}px` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 font-['Roboto'] mt-2">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-700 rounded mr-2"></div>
                <span className="text-sm text-gray-600 font-['Roboto']">Applications</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-900 rounded mr-2"></div>
                <span className="text-sm text-gray-600 font-['Roboto']">Selected</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-['Roboto']">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 font-['Roboto'] mt-1">
                      {activity.time} • {activity.hr}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-gray-900 hover:text-black font-medium font-['Roboto'] transition-colors">
              View all activity
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
              Add HR
            </h3>
            <p className="text-sm text-gray-600 font-['Roboto']">
              Invite new HR to join your organization
            </p>
          </button>

          <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
              Manage Users
            </h3>
            <p className="text-sm text-gray-600 font-['Roboto']">
              View and manage HRs and Interviewers
            </p>
          </button>

          <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
              Organization Settings
            </h3>
            <p className="text-sm text-gray-600 font-['Roboto']">
              Update organization profile and settings
            </p>
          </button>

          <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
              View Reports
            </h3>
            <p className="text-sm text-gray-600 font-['Roboto']">
              Generate and export organization reports
            </p>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
