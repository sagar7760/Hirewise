import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';
import { SkeletonTable } from '../../components/common/Skeleton';
import { useApiRequest } from '../../hooks/useApiRequest';

const HRDashboard = () => {
  // Data state
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  // Loading & error states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [error, setError] = useState(null);

  const { makeJsonRequest } = useApiRequest();

  // Simple TTL cache helpers (localStorage)
  const CACHE_PREFIX = 'hrDashboard:';
  const getCacheKey = (key) => `${CACHE_PREFIX}${key}`;
  const setCache = (key, value, ttlSeconds) => {
    try {
      const record = { value, expires: Date.now() + ttlSeconds * 1000 };
      localStorage.setItem(getCacheKey(key), JSON.stringify(record));
    } catch (e) {
      // ignore storage errors
    }
  };
  const getCache = (key) => {
    try {
      const raw = localStorage.getItem(getCacheKey(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expires && parsed.expires > Date.now()) {
        return parsed.value;
      } else {
        localStorage.removeItem(getCacheKey(key));
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const cached = getCache('stats');
      if (cached) {
        setDashboardStats(cached);
        setLoadingStats(false);
      }
      const res = await makeJsonRequest('/api/hr/dashboard/stats');
      if (res && res.success !== false) {
        const stats = res.stats || res.data || res; // flexible shape
        setDashboardStats(stats);
        setCache('stats', stats, 60); // 60s TTL
      }
    } catch (err) {
      setError(prev => prev || 'Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  }, [makeJsonRequest]);

  const fetchRecentJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const cached = getCache('recentJobs');
      if (cached) {
        setRecentJobs(cached);
        setLoadingJobs(false);
      }
      const res = await makeJsonRequest('/api/hr/dashboard/recent-jobs');
      if (res && res.recentJobs) {
        setRecentJobs(res.recentJobs);
        setCache('recentJobs', res.recentJobs, 120); // 2 min TTL
      }
    } catch (err) {
      setError(prev => prev || 'Failed to load recent jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, [makeJsonRequest]);

  const fetchRecentApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const cached = getCache('recentApplications');
      if (cached) {
        setRecentApplications(cached);
        setLoadingApplications(false);
      }
      const res = await makeJsonRequest('/api/hr/dashboard/recent-applications');
      if (res && res.recentApplications) {
        setRecentApplications(res.recentApplications);
        setCache('recentApplications', res.recentApplications, 60);
      }
    } catch (err) {
      setError(prev => prev || 'Failed to load applications');
    } finally {
      setLoadingApplications(false);
    }
  }, [makeJsonRequest]);

  const fetchUpcomingInterviews = useCallback(async () => {
    setLoadingInterviews(true);
    try {
      const cached = getCache('upcomingInterviews');
      if (cached) {
        setUpcomingInterviews(cached);
        setLoadingInterviews(false);
      }
      const res = await makeJsonRequest('/api/hr/dashboard/upcoming-interviews');
      if (res && res.upcomingInterviews) {
        setUpcomingInterviews(res.upcomingInterviews);
        setCache('upcomingInterviews', res.upcomingInterviews, 60);
      }
    } catch (err) {
      setError(prev => prev || 'Failed to load interviews');
    } finally {
      setLoadingInterviews(false);
    }
  }, [makeJsonRequest]);

  useEffect(() => {
    // Run only once on mount
    fetchStats();
    fetchRecentJobs();
    fetchRecentApplications();
    fetchUpcomingInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
      case 'Scheduled':
      case 'Confirmed':
        return 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'Draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'Shortlisted':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400';
      case 'Under Review':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'text-green-600 dark:text-green-400 font-semibold';
    if (score >= 7.0) return 'text-gray-700 dark:text-gray-300';
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                HR Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Manage jobs, applications, and interviews
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/hr/jobs/create"
                className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Job
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center animate-pulse">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                  <div className="ml-4 w-full">
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : dashboardStats ? (
            <>
              {/* Total Jobs Posted */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Total Jobs Posted</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{dashboardStats.totalJobs ?? 0}</dd>
                  </div>
                </div>
              </div>

              {/* Total Applicants */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Total Applicants</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{dashboardStats.totalApplicants ?? 0}</dd>
                  </div>
                </div>
              </div>
              
              {/* Candidates Shortlisted */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Candidates Shortlisted</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{dashboardStats.candidatesShortlisted ?? 0}</dd>
                  </div>
                </div>
              </div>
              
              {/* Interviews Scheduled */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Interviews Scheduled</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{dashboardStats.interviewsScheduled ?? 0}</dd>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-4 text-sm text-red-600 dark:text-red-400">Failed to load statistics.</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Recent Jobs</h2>
                <Link 
                  to="/hr/jobs" 
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-['Roboto'] transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {loadingJobs ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                      </div>
                    </div>
                  ))
                ) : recentJobs.length === 0 ? (
                  <div className="p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                    No recent jobs found.
                    <div className="mt-2">
                      <Link to="/hr/jobs/create" className="text-gray-700 dark:text-gray-300 underline">Create your first job</Link>
                    </div>
                  </div>
                ) : recentJobs.slice(0, 3).map((job) => (
                  <div key={job._id || job.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">{job.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto'] mt-1">
                        {job.department || job.category || 'General'} • {job.applicants || job.applicantsCount || 0} applicants
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
                        {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Upcoming Interviews</h2>
                <Link 
                  to="/hr/interviews" 
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-['Roboto'] transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {loadingInterviews ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    </div>
                  ))
                ) : upcomingInterviews.length === 0 ? (
                  <div className="p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                    No upcoming interviews scheduled.
                  </div>
                ) : upcomingInterviews.map((interview) => (
                  <div key={interview._id || interview.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">{interview.candidate || interview.candidateName || 'Candidate'}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                          {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto'] mt-1">
                        {(interview.job || interview.jobTitle || 'Job')} • {(interview.interviewer || interview.interviewerName || 'Interviewer')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-900 dark:text-white font-['Roboto'] font-medium">{interview.date ? new Date(interview.date).toLocaleDateString() : ''}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{interview.time || (interview.date ? new Date(interview.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Recent Applications</h2>
                <Link 
                  to="/hr/applications" 
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-['Roboto'] transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Job Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Resume Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loadingApplications ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8">
                        <SkeletonTable rows={3} columns={6} />
                      </td>
                    </tr>
                  ) : recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No recent applications.
                      </td>
                    </tr>
                  ) : recentApplications.map((application) => (
                    <tr key={application._id || application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">{application.candidate || application.candidateName || 'Candidate'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">{application.job || application.jobTitle || 'Job'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                          {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-['Roboto'] ${getScoreColor(application.resumeScore)}`}>
                          {application.resumeScore != null ? Number(application.resumeScore).toFixed(1) : '–'}/10
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors duration-300 ${getStatusColor(application.status)}`}>
                          {application.status?.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="View application">
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="Shortlist application">
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
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

        {/* Error banner */}
        {error && (
          <div className="mt-8 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm flex justify-between items-start">
            <div>{error}</div>
            <button
              onClick={() => {
                setError(null);
                fetchStats();
                fetchRecentJobs();
                fetchRecentApplications();
                fetchUpcomingInterviews();
              }}
              className="ml-4 text-red-800 dark:text-red-400 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/hr/jobs/create"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">Create New Job</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">Post a new job opening</p>
                </div>
              </Link>

              <Link
                to="/hr/applications"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">Review Applications</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">Shortlist candidates</p>
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