import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InterviewerLayout from '../../components/layout/InterviewerLayout';

const InterviewerDashboard = () => {
  const [dashboardData] = useState({
    summaryStats: {
      totalInterviews: 42,
      upcomingInterviews: 8,
      todaysInterviews: 3,
      pendingFeedback: 5
    },
    todaysInterviews: [
      {
        id: 1,
        candidateName: 'Sarah Johnson',
        jobTitle: 'Frontend Developer',
        time: '10:00 AM',
        duration: '60 min',
        status: 'scheduled'
      },
      {
        id: 2,
        candidateName: 'Mike Chen',
        jobTitle: 'Full Stack Developer',
        time: '2:00 PM',
        duration: '45 min',
        status: 'scheduled'
      },
      {
        id: 3,
        candidateName: 'Emily Davis',
        jobTitle: 'UI/UX Designer',
        time: '4:30 PM',
        duration: '60 min',
        status: 'scheduled'
      }
    ],
    recentActivities: [
      {
        id: 1,
        type: 'interview_completed',
        message: 'Interview with John Smith completed',
        timestamp: '2 hours ago'
      },
      {
        id: 2,
        type: 'feedback_submitted',
        message: 'Feedback submitted for Lisa Anderson',
        timestamp: '1 day ago'
      },
      {
        id: 3,
        type: 'interview_scheduled',
        message: 'New interview scheduled with Alex Rodriguez',
        timestamp: '2 days ago'
      }
    ]
  });

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Interviewer Dashboard</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">
            Welcome back! Here's your interview overview for today.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link to="/interviewer/today" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-['Roboto']">Today's Interviews</p>
                  <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.summaryStats.todaysInterviews}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/interviewer/upcoming" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-['Roboto']">Upcoming</p>
                  <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.summaryStats.upcomingInterviews}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/interviewer/feedback" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-['Roboto']">Pending Feedback</p>
                  <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.summaryStats.pendingFeedback}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/interviewer/past" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Interviews</p>
                  <p className="text-2xl font-bold text-black font-['Open_Sans']">{dashboardData.summaryStats.totalInterviews}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Today's Schedule</h2>
              <Link 
                to="/interviewer/today" 
                className="text-sm text-black hover:text-gray-700 font-['Roboto'] font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="p-6">
              {dashboardData.todaysInterviews.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.todaysInterviews.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-black font-['Open_Sans']">
                          {interview.candidateName}
                        </h3>
                        <p className="text-sm text-gray-600 font-['Roboto']">{interview.jobTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-black font-['Roboto']">{interview.time}</p>
                        <p className="text-sm text-gray-500 font-['Roboto']">{interview.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-['Roboto'] mt-2">No interviews scheduled for today</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-black font-['Roboto']">{activity.message}</p>
                      <p className="text-xs text-gray-500 font-['Roboto']">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/interviewer/today"
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
            >
              View Today's Schedule
            </Link>
            <Link 
              to="/interviewer/feedback"
              className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']"
            >
              Complete Feedback
            </Link>
            <Link 
              to="/interviewer/upcoming"
              className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']"
            >
              Review Upcoming
            </Link>
          </div>
        </div>
      </div>
    </InterviewerLayout>
  );
};

export default InterviewerDashboard;
