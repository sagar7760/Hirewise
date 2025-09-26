import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

const ApplicantDashboard = () => {
  const { user, apiRequest, refreshUser } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      jobsApplied: 0,
      applicationsInReview: 0,
      shortlisted: 0,
      totalJobs: 0
    },
    recentApplications: [],
    recommendedJobs: [],
    recentActivity: [],
    profileCompletion: { percentage: 0, missingItems: [] },
    topSkills: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fallback: If profile completion is low after initial load, try refreshing user data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && dashboardData.profileCompletion && dashboardData.profileCompletion.percentage < 50) {
        console.log('🔄 Dashboard: Profile completion low, forcing user data refresh...');
        refreshUser(true).catch(error => { // Force refresh to bypass rate limiting
          console.error('Failed to refresh user data:', error);
        });
      }
    }, 2000); // Wait 2 seconds after initial load

    return () => clearTimeout(timer);
  }, [dashboardData.profileCompletion, user, refreshUser]);

  // Recalculate profile completion whenever user data changes
  useEffect(() => {
    if (user && user.firstName && user.email) { // Basic validation to ensure user data is loaded
      console.log('📊 Recalculating profile completion...');
      const profileCompletion = calculateProfileCompletion(user);
      setDashboardData(prevData => ({
        ...prevData,
        profileCompletion
      }));
    }
  }, [user]); // This will trigger whenever the user object changes

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard stats and recent applications
      const [statsResponse, applicationsResponse, jobsResponse, savedJobsResponse] = await Promise.all([
        apiRequest('/api/applications/stats/dashboard'),
        apiRequest('/api/applicant/applications?limit=5'),
        apiRequest('/api/jobs?limit=6'), // For recommendations
        apiRequest('/api/applicant/saved-jobs') // For saved jobs count
      ]);

      // Parse responses with error handling
      let statsData = { data: { stats: {} } };
      let applicationsData = { applications: [] };
      let jobsData = { jobs: [], data: [] };
      let savedJobsData = { data: [] };

      try {
        if (statsResponse && statsResponse.ok) {
          statsData = await statsResponse.json();
        }
      } catch (e) {
        console.warn('Failed to parse stats data:', e);
      }

      try {
        if (applicationsResponse && applicationsResponse.ok) {
          applicationsData = await applicationsResponse.json();
          console.log('📊 Dashboard: Applications data:', applicationsData);
        }
      } catch (e) {
        console.warn('Failed to parse applications data:', e);
      }

      try {
        if (jobsResponse && jobsResponse.ok) {
          jobsData = await jobsResponse.json();
        }
      } catch (e) {
        console.warn('Failed to parse jobs data:', e);
      }

      try {
        if (savedJobsResponse && savedJobsResponse.ok) {
          savedJobsData = await savedJobsResponse.json();
        }
      } catch (e) {
        console.warn('Failed to parse saved jobs data:', e);
      }

      // Extract jobs array from different possible response structures
      let jobsArray = [];
      if (jobsData.data && jobsData.data.jobs && Array.isArray(jobsData.data.jobs)) {
        jobsArray = jobsData.data.jobs;
      } else if (jobsData.jobs && Array.isArray(jobsData.jobs)) {
        jobsArray = jobsData.jobs;
      } else if (jobsData.data && Array.isArray(jobsData.data)) {
        jobsArray = jobsData.data;
      } else if (Array.isArray(jobsData)) {
        jobsArray = jobsData;
      }

      // Calculate job recommendations with match algorithm
      console.log('🔍 Jobs array for recommendations:', jobsArray.length, 'jobs');
      console.log('🔍 Sample job from API:', jobsArray[0]);
      const recommendedJobs = calculateJobRecommendations(jobsArray);
      console.log('🔍 Generated recommended jobs:', recommendedJobs.length, 'jobs');
      console.log('🔍 Sample recommended job:', recommendedJobs[0]);

      // Generate activity feed based on applications
      const recentActivity = generateActivityFeed(applicationsData.applications || []);

      // Calculate additional stats
      const totalApplications = statsData.data?.stats?.totalApplications || 0;
      const successfulApplications = (statsData.data?.stats?.shortlisted || 0) + (statsData.data?.stats?.interview_scheduled || 0) + (statsData.data?.stats?.offer_extended || 0);
      const successRate = totalApplications > 0 ? Math.round((successfulApplications / totalApplications) * 100) : 0;
      
      // Get saved jobs count
      const savedJobsCount = savedJobsData.data?.length || 0;
      console.log('📊 Dashboard: Saved jobs count:', savedJobsCount);

      // Calculate profile completion
      const profileCompletion = calculateProfileCompletion(user);

      const finalApplications = applicationsData.applications || [];
      console.log('📊 Dashboard: Final applications to display:', finalApplications.length);
      
      setDashboardData({
        stats: {
          jobsApplied: totalApplications,
          applicationsInReview: (statsData.data?.stats?.under_review || 0) + (statsData.data?.stats?.submitted || 0),
          shortlisted: statsData.data?.stats?.shortlisted || 0,
          successRate: `${successRate}%`,
          successTrend: Math.floor(Math.random() * 10) - 5, // Mock trend for now
          savedJobs: savedJobsCount,
          totalJobs: jobsData.data?.pagination?.totalJobs || jobsArray.length || 0
        },
        profileCompletion,
        topSkills: generateTopSkills(user?.skills || []),
        recentApplications: finalApplications,
        recommendedJobs,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Job recommendation algorithm based on user profile and skills
  const calculateJobRecommendations = (jobs) => {
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return [];
    
    const userSkills = user?.skills || [];
    const userExperience = user?.experience || 'fresher';
    
    return jobs.slice(0, 6).map(job => {
      let matchScore = 50; // Base score
      
      // Skills matching
      if (job.requiredSkills && userSkills.length > 0) {
        const jobSkills = job.requiredSkills.map(skill => skill.toLowerCase());
        const matchingSkills = userSkills.filter(skill => 
          jobSkills.some(jobSkill => jobSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(jobSkill))
        );
        matchScore += (matchingSkills.length / Math.max(jobSkills.length, userSkills.length)) * 30;
      }
      
      // Experience level matching
      if (job.experienceLevel) {
        const experienceMatch = {
          'fresher': { 'fresher': 20, 'mid-level': 5, 'senior': 0, 'expert': 0 },
          'mid-level': { 'fresher': 10, 'mid-level': 20, 'senior': 10, 'expert': 0 },
          'senior': { 'fresher': 0, 'mid-level': 10, 'senior': 20, 'expert': 10 },
          'expert': { 'fresher': 0, 'mid-level': 5, 'senior': 15, 'expert': 20 }
        };
        matchScore += experienceMatch[userExperience]?.[job.experienceLevel] || 0;
      }
      
      // Location preference (if remote, add bonus)
      if (job.workType === 'remote') {
        matchScore += 10;
      }
      
      // Ensure score is within 70-98 range for realistic recommendations
      matchScore = Math.min(98, Math.max(70, Math.round(matchScore)));
      
      const recommendedJob = {
        id: job._id || job.id, // Try both _id and id fields
        title: job.title,
        company: job.company?.name || 'Company Name',
        location: job.location,
        type: job.jobType || 'Full-time',
        posted: formatTimeAgo(job.createdAt),
        match: matchScore,
        salary: formatSalary(job.salaryRange)
      };
      
      console.log('📋 Generated recommended job:', recommendedJob.title, 'ID:', recommendedJob.id, 'Original job _id:', job._id, 'Original job id:', job.id);
      return recommendedJob;
    });
  };

  // Generate activity feed based on application status changes
  const generateActivityFeed = (applications) => {
    if (!Array.isArray(applications)) return [];
    
    const activities = [];
    
    applications.forEach(app => {
      if (!app || !app._id) return; // Skip invalid applications
      
      const companyName = app.job?.company?.name || 'Company';
      const jobTitle = app.job?.title || 'Position';
      
      // Application submitted activity
      activities.push({
        id: `submit_${app._id}`,
        type: 'application_submitted',
        message: `Application submitted for ${jobTitle}`,
        timestamp: formatTimeAgo(app.createdAt),
        company: companyName
      });
      
      // Status-based activities
      if (app.status === 'under_review') {
        activities.push({
          id: `review_${app._id}`,
          type: 'application_viewed',
          message: `Your application for ${jobTitle} is under review`,
          timestamp: formatTimeAgo(app.updatedAt),
          company: companyName
        });
      } else if (app.status === 'shortlisted') {
        activities.push({
          id: `shortlist_${app._id}`,
          type: 'application_shortlisted',
          message: `You've been shortlisted for ${jobTitle}`,
          timestamp: formatTimeAgo(app.updatedAt),
          company: companyName
        });
      }
    });
    
    // Sort by most recent and limit to 5
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  };

  const formatSalary = (salaryRange) => {
    if (!salaryRange) return 'Salary not specified';
    const { min, max, currency = 'USD' } = salaryRange;
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    return 'Competitive salary';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (user) => {
    if (!user) {
      console.log('Profile completion: No user data');
      return { percentage: 0, missingItems: [] };
    }
    
    console.log('📊 Calculating profile completion - Fields check:', {
      phone: !!user.phone,
      skills: !!(user.skills && user.skills.length > 0),
      workExp: !!(user.profile?.workExperienceEntries && user.profile.workExperienceEntries.length > 0),
      resume: !!(user.currentResumeId || user.resumeAvailable),
      resumeFields: {
        currentResumeId: user.currentResumeId,
        resumeAvailable: user.resumeAvailable,
        resume: user.resume,
        profileCurrentResumeId: user.profile?.currentResumeId
      }
    });
    
    const requiredFields = [
      { field: 'firstName', label: 'First Name', weight: 10 },
      { field: 'lastName', label: 'Last Name', weight: 10 },
      { field: 'email', label: 'Email', weight: 10 },
      { field: 'phone', label: 'Phone', weight: 10 },
      { field: 'skills', label: 'Skills', weight: 20 }, // This is mapped from profile.primarySkills in AuthContext
      { field: 'profile.workExperienceEntries', label: 'Experience Level', weight: 15 },
      { field: 'currentResumeId', label: 'Resume', weight: 25 }
    ];

    let completedWeight = 0;
    const missingItems = [];

    requiredFields.forEach(({ field, label, weight }) => {
      let fieldValue;
      let isFieldComplete = false;
      
      // Special handling for different field types
      if (field === 'skills') {
        // Check multiple possible locations for skills
        fieldValue = user.skills || user.profile?.primarySkills;
        isFieldComplete = fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0;
      } else if (field === 'currentResumeId') {
        // Check for resume ID, resume availability, or resume object
        fieldValue = user.currentResumeId || user.resumeAvailable || user.resume || user.profile?.currentResumeId;
        // Also check if user has resume file name or any resume-related field
        const hasResumeFile = user.profile?.resume?.fileName || user.resume?.fileName;
        isFieldComplete = !!fieldValue || !!hasResumeFile;
      } else if (field === 'profile.workExperienceEntries') {
        // Check for work experience entries
        fieldValue = user.profile?.workExperienceEntries || user.workExperience;
        isFieldComplete = fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0;
      } else {
        // Standard field checking
        fieldValue = field.includes('.') 
          ? field.split('.').reduce((obj, key) => obj?.[key], user)
          : user[field];
        isFieldComplete = fieldValue && (Array.isArray(fieldValue) ? fieldValue.length > 0 : true);
      }
      
      if (isFieldComplete) {
        completedWeight += weight;
      } else {
        missingItems.push(label);
        console.log(`❌ Missing: ${label}`);
      }
    });

    const result = {
      percentage: completedWeight,
      missingItems
    };
    
    console.log('Profile completion result:', result);
    return result;
  };

  // Generate top skills with mock demand data
  const generateTopSkills = (userSkills) => {
    if (!userSkills || userSkills.length === 0) return [];
    
    const skillDemand = {
      'JavaScript': 85,
      'React': 78,
      'Node.js': 72,
      'Python': 80,
      'Java': 75,
      'CSS': 65,
      'HTML': 70,
      'TypeScript': 68,
      'MongoDB': 60,
      'SQL': 77
    };

    return userSkills.slice(0, 5).map(skill => ({
      name: skill,
      demand: skillDemand[skill] || Math.floor(Math.random() * 40) + 50
    })).sort((a, b) => b.demand - a.demand);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'interview_scheduled':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400';
      case 'under_review':
      case 'in_review':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'submitted':
        return 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300';
      case 'shortlisted':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'accepted':
      case 'offer_extended':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300';
    }
  };

  // Removed unused getStatusText

  const getMatchColor = (match) => {
    if (match >= 90) return 'text-green-600 dark:text-green-400';
    if (match >= 80) return 'text-indigo-600 dark:text-indigo-400';
    if (match >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getActivityIcon = (type) => {
    const iconClass = "w-4 h-4";
    const strokeClass = "stroke-gray-600 dark:stroke-gray-300";

    switch (type) {
      case 'application_viewed':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path className={strokeClass} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path className={strokeClass} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'application_shortlisted':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path className={strokeClass} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'interview_scheduled':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path className={strokeClass} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'application_submitted':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path className={strokeClass} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path className={strokeClass} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center shadow-sm transition-colors duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center transition-colors duration-300">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white font-['Open_Sans'] mb-2">Unable to load dashboard</h3>
            <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mb-6 max-w-md mx-auto">
              We're having trouble loading your dashboard data. Please check your connection and try again.
            </p>
            <button 
              onClick={fetchDashboardData}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-['Roboto']"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white font-['Open_Sans']">
            Welcome back, {user?.firstName || 'there'}! 
          </h1>
          <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mt-2">
            Here's what's happening with your job search today.
          </p>
        </div>


        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <Link to="/applicant/applications" className="block">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Applications</p>
                  <p className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{isLoading ? '...' : dashboardData.stats.jobsApplied}</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">In Review</p>
                <p className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{isLoading ? '...' : dashboardData.stats.applicationsInReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Shortlisted</p>
                <p className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{isLoading ? '...' : dashboardData.stats.shortlisted}</p>
              </div>
            </div>
          </div>

          <Link to="/jobs" className="block">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Available Jobs</p>
                  <p className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{isLoading ? '...' : dashboardData.stats.totalJobs}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/saved-jobs" className="block">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Saved Jobs</p>
                  <p className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{isLoading ? '...' : dashboardData.stats.savedJobs || 0}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Skill Gap Analysis */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">Skill Insights</h3>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="space-y-2">
              {dashboardData.topSkills?.length > 0 ? (
                dashboardData.topSkills.slice(0, 3).map((skill, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-['Roboto'] text-gray-700 dark:text-gray-300">{skill.name}</span>
                    <span className="font-['Roboto'] text-gray-500 dark:text-gray-400">{skill.demand}% demand</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Complete your profile to see insights</p>
              )}
            </div>
            <Link 
              to="/profile" 
              className="text-sm text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-400 font-['Roboto'] mt-3 inline-block"
            >
              View All Skills →
            </Link>
          </div>

          {/* Profile Completion Circular */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">Profile Completion</h3>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <div className="flex flex-col items-center">
              {/* Circular Progress Bar */}
              <div className="relative w-20 h-20 mb-4">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    fill="transparent"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress circle */}
                  <path
                    className="text-black dark:text-white transition-colors duration-300"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={`${dashboardData.profileCompletion?.percentage || 0}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-black dark:text-white font-['Open_Sans']">
                    {dashboardData.profileCompletion?.percentage || 0}%
                  </span>
                </div>
              </div>
              
              {/* Missing items */}
              <div className="text-center">
                {dashboardData.profileCompletion?.missingItems && dashboardData.profileCompletion.missingItems.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Missing:</p>
                    <div className="space-y-1">
                      {dashboardData.profileCompletion.missingItems.slice(0, 2).map((item, index) => (
                        <span key={index} className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-['Roboto'] mr-1">
                          {item}
                        </span>
                      ))}
                      {dashboardData.profileCompletion.missingItems.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
                          +{dashboardData.profileCompletion.missingItems.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-green-600 dark:text-green-400 font-['Roboto'] mb-3">Profile Complete! 🎉</p>
                )}
                
                <Link 
                  to="/profile"
                  className="text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-['Roboto']"
                >
                  Update Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions Enhanced */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">Quick Actions</h3>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="space-y-4">
              <Link 
                to="/jobs"
                className="group flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 dark:border-gray-700/50"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white font-['Open_Sans'] transition-colors duration-300">Browse Jobs</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 font-['Roboto'] mt-1 transition-colors duration-300">Find your next opportunity</p>
                </div>
                <div className="ml-auto">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link 
                to="/profile"
                className="group flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 dark:border-gray-700/50"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white font-['Open_Sans'] transition-colors duration-300">Update Profile</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 font-['Roboto'] mt-1 transition-colors duration-300">Complete your information</p>
                </div>
                <div className="ml-auto">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link 
                to="/applicant/applications"
                className="group flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 dark:border-gray-700/50"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white font-['Open_Sans'] transition-colors duration-300">Track Applications</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 font-['Roboto'] mt-1 transition-colors duration-300">Monitor your progress</p>
                </div>
                <div className="ml-auto">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recommended Jobs */}
          <div className="lg:col-span-2 space-y-8">

            {/* Recommended Jobs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">Recommended Jobs</h2>
                <Link 
                  to="/jobs" 
                  className="text-sm text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-400 font-['Roboto'] font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-6 animate-pulse">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                  ))
                ) : dashboardData.recommendedJobs && dashboardData.recommendedJobs.length > 0 ? (
                  dashboardData.recommendedJobs.map((job) => (
                    <div key={job.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {job.id ? (
                              <Link to={`/jobs/${job.id}`} className="hover:text-gray-700 dark:hover:text-gray-400 transition-colors duration-300">
                                <h3 className="text-lg font-medium text-black dark:text-white font-['Open_Sans'] hover:underline">
                                  {job.title}
                                </h3>
                              </Link>
                            ) : (
                              <h3 className="text-lg font-medium text-black dark:text-white font-['Open_Sans']">
                                {job.title}
                              </h3>
                            )}
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${getMatchColor(job.match).replace('text-', 'bg-')}`}></div>
                              <span className={`text-xs font-medium font-['Roboto'] ${getMatchColor(job.match)}`}>
                                {job.match}% match
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 font-['Roboto'] mb-2">
                            {job.company} • {job.location}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                            <span>Posted {job.posted}</span>
                            <span>•</span>
                            <span>{job.salary}</span>
                            <span>•</span>
                            <span>{job.type}</span>
                          </div>
                        </div>
                        {job.id ? (
                          <Link 
                            to={`/jobs/${job.id}/apply`}
                            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 font-['Roboto']"
                            onClick={() => console.log('🔗 Applying to job:', job.id, job.title)}
                          >
                            Apply Now
                          </Link>
                        ) : (
                          <span className="bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed font-['Roboto']">
                            Job Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-gray-500 dark:text-gray-400 font-['Roboto']">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p>No job recommendations available</p>
                      <p className="text-sm mt-1">Complete your profile to get personalized recommendations</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Recommendations & Activity */}
          <div className="space-y-8">
            {/* Recent Applications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">Recent Applications</h2>
                <Link 
                  to="/applicant/applications" 
                  className="text-sm text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-400 font-['Roboto'] font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                        <div className="flex items-center justify-between">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                    ))
                  ) : dashboardData.recentApplications && dashboardData.recentApplications.length > 0 ? (
                    dashboardData.recentApplications.slice(0, 2).map((application) => (
                      <div key={application._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-black dark:text-white font-['Open_Sans'] mb-1">
                              {application.job?.title || 'Job Title'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">
                              {application.job?.company?.name || application.job?.company || 'Company Name'}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium font-['Roboto'] ${getStatusColor(application.status)}`}>
                              {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto'] mb-3">
                          {application.job?.location || 'Location not specified'} • {application.job?.type || 'Full-time'} • 
                          {application.job?.salaryRange ? formatSalary(application.job.salaryRange) : 'Salary not specified'}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
                            Applied {formatTimeAgo(application.appliedAt || application.createdAt)}
                          </span>
                          {application.job?._id ? (
                            <Link 
                              to={`/jobs/${application.job._id}`}
                              className="text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 font-['Roboto']"
                            >
                              View Job
                            </Link>
                          ) : (
                            <span className="text-xs bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 px-3 py-1 rounded-lg font-medium cursor-not-allowed font-['Roboto']">
                              Job Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400 font-['Roboto']">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No recent applications</p>
                        <p className="text-sm mt-1">Start applying to jobs to see your applications here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-start space-x-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))
                  ) : dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300">
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-black dark:text-white font-['Roboto']">{activity.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{activity.timestamp}</p>
                            {activity.company && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{activity.company}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400 font-['Roboto']">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No recent activity</p>
                        <p className="text-sm mt-1">Your application activities will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicantDashboard;