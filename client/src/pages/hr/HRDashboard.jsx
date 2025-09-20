import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';

const HRDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 12,
    totalApplicants: 247,
    candidatesShortlisted: 38,
    interviewsScheduled: 15
  });

  const [recentJobs, setRecentJobs] = useState([
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      status: 'Active',
      applicants: 45,
      postedDate: '2025-09-01',
      createdBy: 'me'
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      status: 'Active',
      applicants: 32,
      postedDate: '2025-09-03',
      createdBy: 'other'
    },
    {
      id: 3,
      title: 'UX Designer',
      department: 'Design',
      status: 'Draft',
      applicants: 0,
      postedDate: '2025-09-05',
      createdBy: 'me'
    },
    {
      id: 4,
      title: 'Data Scientist',
      department: 'Analytics',
      status: 'Active',
      applicants: 28,
      postedDate: '2025-09-06',
      createdBy: 'other'
    }
  ]);

  const [upcomingInterviews, setUpcomingInterviews] = useState([
    {
      id: 1,
      candidate: 'John Smith',
      job: 'Senior Frontend Developer',
      date: '2025-09-10',
      time: '10:00 AM',
      interviewer: 'Sarah Johnson',
      status: 'Scheduled'
    },
    {
      id: 2,
      candidate: 'Emily Davis',
      job: 'Product Manager',
      date: '2025-09-10',
      time: '2:00 PM',
      interviewer: 'Mike Wilson',
      status: 'Scheduled'
    },
    {
      id: 3,
      candidate: 'Alex Rodriguez',
      job: 'UX Designer',
      date: '2025-09-11',
      time: '11:00 AM',
      interviewer: 'Lisa Chen',
      status: 'Confirmed'
    }
  ]);

  const [recentApplications, setRecentApplications] = useState([
    {
      id: 1,
      candidate: 'Maria Garcia',
      job: 'Senior Frontend Developer',
      appliedDate: '2025-09-08',
      resumeScore: 8.5,
      status: 'Under Review'
    },
    {
      id: 2,
      candidate: 'David Kim',
      job: 'Product Manager',
      appliedDate: '2025-09-08',
      resumeScore: 9.2,
      status: 'Shortlisted'
    },
    {
      id: 3,
      candidate: 'Jennifer Lee',
      job: 'Data Scientist',
      appliedDate: '2025-09-07',
      resumeScore: 7.8,
      status: 'Under Review'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
      case 'Scheduled':
      case 'Confirmed':
        return 'bg-gray-200 text-gray-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-600';
      case 'Shortlisted':
        return 'bg-gray-800 text-white';
      case 'Under Review':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'text-gray-900 font-semibold';
    if (score >= 7.0) return 'text-gray-700';
    return 'text-gray-500';
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                HR Dashboard
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Manage jobs, applications, and interviews
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/hr/jobs/create"
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Job
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 font-['Roboto']">Total Jobs Posted</dt>
                <dd className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{dashboardStats.totalJobs}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 font-['Roboto']">Total Applicants</dt>
                <dd className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{dashboardStats.totalApplicants}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 font-['Roboto']">Candidates Shortlisted</dt>
                <dd className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{dashboardStats.candidatesShortlisted}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 font-['Roboto']">Interviews Scheduled</dt>
                <dd className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{dashboardStats.interviewsScheduled}</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">Recent Jobs</h2>
                <Link 
                  to="/hr/jobs" 
                  className="text-sm text-gray-600 hover:text-gray-900 font-['Roboto'] transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">{job.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-['Roboto'] mt-1">
                        {job.department} • {job.applicants} applicants
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-['Roboto']">
                        {new Date(job.postedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">Upcoming Interviews</h2>
                <Link 
                  to="/hr/interviews" 
                  className="text-sm text-gray-600 hover:text-gray-900 font-['Roboto'] transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">{interview.candidate}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-['Roboto'] mt-1">
                        {interview.job} • {interview.interviewer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-900 font-['Roboto'] font-medium">{interview.date}</p>
                      <p className="text-xs text-gray-500 font-['Roboto']">{interview.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">Recent Applications</h2>
                <Link 
                  to="/hr/applications" 
                  className="text-sm text-gray-600 hover:text-gray-900 font-['Roboto'] transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Job Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Resume Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">{application.candidate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-['Roboto']">{application.job}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-['Roboto']">
                          {new Date(application.appliedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-['Roboto'] ${getScoreColor(application.resumeScore)}`}>
                          {application.resumeScore}/10
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-gray-600 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/hr/jobs/create"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">Create New Job</h3>
                  <p className="text-xs text-gray-500 font-['Roboto']">Post a new job opening</p>
                </div>
              </Link>

              <Link
                to="/hr/applications"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">Review Applications</h3>
                  <p className="text-xs text-gray-500 font-['Roboto']">Shortlist candidates</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRDashboard;
