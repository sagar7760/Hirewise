import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ApplicantDashboard = () => {
  // Enhanced dashboard data
  const [dashboardData] = useState({
    stats: {
      jobsApplied: 12,
      interviewsScheduled: 3,
      applicationsInReview: 5,
      profileViews: 28
    },
    recentApplications: [
      {
        id: 1,
        jobTitle: 'Senior React Developer',
        company: 'TechFlow Solutions',
        location: 'San Francisco, CA',
        appliedDate: '2025-09-10',
        status: 'interview_scheduled',
        interviewDate: '2025-09-18',
        salary: '$90k - $120k'
      },
      {
        id: 2,
        jobTitle: 'Full Stack Engineer',
        company: 'InnovateHub',
        location: 'Remote',
        appliedDate: '2025-09-08',
        status: 'in_review',
        salary: '$80k - $110k'
      },
      {
        id: 3,
        jobTitle: 'Product Manager',
        company: 'Growth Dynamics',
        location: 'New York, NY',
        appliedDate: '2025-09-05',
        status: 'submitted',
        salary: '$100k - $130k'
      }
    ],
    recommendedJobs: [
      {
        id: 1,
        title: 'Frontend Developer',
        company: 'Creative Labs',
        location: 'Austin, TX',
        type: 'Full-time',
        posted: '2 days ago',
        match: 95,
        salary: '$70k - $95k'
      },
      {
        id: 2,
        title: 'React Developer',
        company: 'Digital Minds',
        location: 'Seattle, WA',
        type: 'Full-time',
        posted: '1 week ago',
        match: 88,
        salary: '$85k - $110k'
      },
      {
        id: 3,
        title: 'Software Engineer',
        company: 'NextGen Tech',
        location: 'Boston, MA',
        type: 'Full-time',
        posted: '3 days ago',
        match: 92,
        salary: '$75k - $100k'
      }
    ],
    upcomingInterviews: [
      {
        id: 1,
        company: 'TechFlow Solutions',
        position: 'Senior React Developer',
        date: '2025-09-18',
        time: '2:00 PM',
        type: 'Technical Interview',
        interviewer: 'Sarah Johnson',
        platform: 'Google Meet'
      }
    ],
    recentActivity: [
      {
        id: 1,
        type: 'application_viewed',
        message: 'Your application for Senior React Developer was viewed by TechFlow Solutions',
        timestamp: '2 hours ago',
        company: 'TechFlow Solutions'
      },
      {
        id: 2,
        type: 'interview_scheduled',
        message: 'Interview scheduled for Senior React Developer position',
        timestamp: '1 day ago',
        company: 'TechFlow Solutions'
      },
      {
        id: 3,
        type: 'application_submitted',
        message: 'Application submitted for Full Stack Engineer',
        timestamp: '1 week ago',
        company: 'InnovateHub'
      }
    ]
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'interview_scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'in_review':
        return 'In Review';
      case 'submitted':
        return 'Submitted';
      case 'rejected':
        return 'Rejected';
      case 'accepted':
        return 'Accepted';
      default:
        return 'Unknown';
    }
  };

  const getMatchColor = (match) => {
    if (match >= 90) return 'text-green-600';
    if (match >= 80) return 'text-blue-600';
    if (match >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'application_viewed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'interview_scheduled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'application_submitted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Welcome back, John!</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">
            Here's what's happening with your job search today.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link to="/my-applications" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-['Roboto']">Applications</p>
                  <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.stats.jobsApplied}</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Interviews</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.stats.interviewsScheduled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">In Review</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.stats.applicationsInReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Profile Views</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.stats.profileViews}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Applications & Upcoming Interviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Interviews */}
            {dashboardData.upcomingInterviews.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Upcoming Interviews</h2>
                  <span className="text-sm text-gray-500 font-['Roboto']">
                    {dashboardData.upcomingInterviews.length} scheduled
                  </span>
                </div>
                <div className="p-6">
                  {dashboardData.upcomingInterviews.map((interview) => (
                    <div key={interview.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-1">
                            {interview.position}
                          </h3>
                          <p className="text-gray-600 font-['Roboto'] mb-2">{interview.company}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 font-['Roboto']">Date & Time:</span>
                              <p className="text-black font-['Roboto'] font-medium">
                                {formatDate(interview.date)} at {interview.time}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 font-['Roboto']">Type:</span>
                              <p className="text-black font-['Roboto'] font-medium">{interview.type}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 font-['Roboto']">Interviewer:</span>
                              <p className="text-black font-['Roboto'] font-medium">{interview.interviewer}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 font-['Roboto']">Platform:</span>
                              <p className="text-black font-['Roboto'] font-medium">{interview.platform}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']">
                            Join Meeting
                          </button>
                          <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Applications */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Recent Applications</h2>
                <Link 
                  to="/my-applications" 
                  className="text-sm text-black hover:text-gray-700 font-['Roboto'] font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {dashboardData.recentApplications.map((application) => (
                  <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-black font-['Open_Sans']">
                            {application.jobTitle}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                        <p className="text-gray-600 font-['Roboto'] mb-2">
                          {application.company} • {application.location}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 font-['Roboto']">
                          <span>Applied {formatDate(application.appliedDate)}</span>
                          <span>•</span>
                          <span>{application.salary}</span>
                          {application.interviewDate && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-medium">
                                Interview: {formatDate(application.interviewDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Recommendations & Activity */}
          <div className="space-y-8">
            {/* Recommended Jobs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Recommended Jobs</h2>
                <Link 
                  to="/jobs" 
                  className="text-sm text-black hover:text-gray-700 font-['Roboto'] font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.recommendedJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-black font-['Open_Sans'] mb-1">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 font-['Roboto']">{job.company}</p>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${getMatchColor(job.match).replace('text-', 'bg-')}`}></div>
                          <span className={`text-xs font-medium font-['Roboto'] ${getMatchColor(job.match)}`}>
                            {job.match}% match
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-['Roboto'] mb-3">
                        {job.location} • {job.type} • {job.salary}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-['Roboto']">Posted {job.posted}</span>
                        <button className="text-xs bg-black text-white px-3 py-1 rounded-lg font-medium hover:bg-gray-800 transition-colors font-['Roboto']">
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-black font-['Roboto']">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 font-['Roboto']">{activity.timestamp}</p>
                          {activity.company && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-500 font-['Roboto']">{activity.company}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  to="/jobs"
                  className="block w-full bg-black text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto'] text-center"
                >
                  Browse New Jobs
                </Link>
                <Link 
                  to="/profile"
                  className="block w-full bg-white text-black border border-gray-300 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto'] text-center"
                >
                  Update Profile
                </Link>
                <Link 
                  to="/my-applications"
                  className="block w-full bg-white text-black border border-gray-300 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto'] text-center"
                >
                  Track Applications
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicantDashboard;
