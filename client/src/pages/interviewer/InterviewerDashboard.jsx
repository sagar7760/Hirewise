import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import InterviewerLayout from '../../components/layout/InterviewerLayout';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonCard } from '../../components/common/Skeleton';

const InterviewerDashboard = () => {
  // Unified state
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    error: null,
    summaryStats: {
      totalInterviews: 0,
      upcomingInterviews: 0,
      todaysInterviews: 0,
      pendingFeedback: 0,
      completedThisWeek: 0,
      avgFeedbackTurnaroundHours: 0
    },
    todaysInterviews: [],
    recentActivities: []
  });

  const { makeJsonRequest } = useApiRequest();
  const toast = useToast();

  const humanizeTimeAgo = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const fetchDashboard = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await makeJsonRequest('/api/interviewer/dashboard');
      if (res?.success) {
        const { summary, todaysInterviews, recentActivities, metrics } = res.data;
        setDashboardData({
          loading: false,
          error: null,
            summaryStats: {
              totalInterviews: summary.totalInterviews,
              upcomingInterviews: summary.upcomingInterviews,
              todaysInterviews: summary.todaysInterviews,
              pendingFeedback: summary.pendingFeedback,
              completedThisWeek: metrics?.completedThisWeek || 0,
              avgFeedbackTurnaroundHours: metrics?.avgFeedbackTurnaroundHours || 0
            },
          todaysInterviews: todaysInterviews || [],
          recentActivities: (recentActivities || []).map(a => ({ ...a, timeAgo: humanizeTimeAgo(a.timestamp) }))
        });
      } else {
        throw new Error(res?.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard fetch error', err);
      toast.error(err.message || 'Failed to load dashboard');
      setDashboardData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [makeJsonRequest, toast]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Interviewer Dashboard</h1>
              <p className="text-gray-600 font-['Roboto'] mt-2">
                Welcome back! Here's your interview overview for today.
              </p>
            </div>
            <button
              onClick={fetchDashboard}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto'] disabled:opacity-60"
              disabled={dashboardData.loading}
            >
              {dashboardData.loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {dashboardData.error && (
            <div className="mt-4 text-sm text-red-600">{dashboardData.error}</div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {dashboardData.loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <Link to="/interviewer/interviews" className="block">
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
              <Link to="/interviewer/interviews" className="block">
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
              <Link to="/interviewer/interviews" className="block">
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
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Today's Schedule</h2>
              <Link 
                to="/interviewer/interviews" 
                className="text-sm text-black hover:text-gray-700 font-['Roboto'] font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="p-6">
              {dashboardData.loading ? (
                <div className="space-y-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : dashboardData.todaysInterviews.length > 0 ? (
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
                        <p className="text-sm font-medium text-black font-['Roboto']">{interview.time || '—'}</p>
                        <p className="text-sm text-gray-500 font-['Roboto']">{interview.duration} min</p>
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
              {dashboardData.loading ? (
                <div className="space-y-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentActivities.length === 0 && (
                    <p className="text-sm text-gray-500 font-['Roboto']">No recent activity</p>
                  )}
                  {dashboardData.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-black font-['Roboto']">{activity.message}</p>
                        <p className="text-xs text-gray-500 font-['Roboto']">{activity.timeAgo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Link 
              to="/interviewer/interviews"
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
            >
              View Interview Schedule
            </Link>
            <Link 
              to="/interviewer/feedback"
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
            >
              Complete Feedback
            </Link>
          </div>
        </div>
      </div>
    </InterviewerLayout>
  );
};

export default InterviewerDashboard;
