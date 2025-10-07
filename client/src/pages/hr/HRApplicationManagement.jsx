import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';
import { useHRApplications } from '../../hooks/useHRApplications';
import { SkeletonTable } from '../../components/common/Skeleton';
import { useApiRequest } from '../../hooks/useApiRequest';

const HRApplicationManagement = () => {
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get('jobId');
  
  const { makeJsonRequest, makeRequest } = useApiRequest();
  
  // Use custom hook for applications management
  const {
    applications,
    pagination,
    loading,
    error,
    fetchApplications,
    updateApplicationStatus,
    clearCache
  } = useHRApplications();

  // Local state for UI
  const [selectedJob, setSelectedJob] = useState(jobIdFromUrl || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Immediate input value
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [sortBy, setSortBy] = useState('appliedDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageType, setPageType] = useState(jobIdFromUrl ? 'filtered' : 'all'); // Track page type
  const [currentJobTitle, setCurrentJobTitle] = useState(''); // Store current job title for filtered view
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState(null);
  // Schedule Interview modal state (reusing Interview Management modal pattern)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    interviewerId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'video',
    location: '',
    notes: ''
  });
  const [interviewers, setInterviewers] = useState([]);
  const [slotState, setSlotState] = useState({ loading: false, slots: [], error: null });
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  // External feedback fetch state for Application Details modal
  const [externalFeedback, setExternalFeedback] = useState(null);
  const [fetchingFeedback, setFetchingFeedback] = useState(false);
  // Background detection for table status override (applicationId -> boolean hasFeedback)
  const [feedbackByAppId, setFeedbackByAppId] = useState({});

  // Handle URL parameter for job filtering
  useEffect(() => {
    console.log('URL Parameter Effect:', { jobIdFromUrl, jobsLength: jobs.length });
    if (jobIdFromUrl) {
      setSelectedJob(jobIdFromUrl);
      setPageType('filtered');
      
      // Find and set the job title when jobs are loaded
      if (jobs.length > 0) {
        // Try both _id and id fields to handle different API responses
        const job = jobs.find(j => j._id === jobIdFromUrl || j.id === jobIdFromUrl);
        console.log('Found job:', job);
        if (job) {
          setCurrentJobTitle(job.title);
        } else {
          console.log('Job not found. Available jobs:', jobs.map(j => ({ _id: j._id, id: j.id, title: j.title })));
        }
      }
    } else {
      setPageType('all');
      setCurrentJobTitle('');
    }
  }, [jobIdFromUrl, jobs]);

  // Refetch when jobIdFromUrl changes (after initial load) to ensure filter applies
  useEffect(() => {
    if (!initialLoad) {
      const fetchParams = {
        page: 1,
        limit: 20,
        job: jobIdFromUrl ? jobIdFromUrl : (selectedJob !== 'all' ? selectedJob : undefined),
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder
      };
      console.log('Refetch due to jobIdFromUrl change:', fetchParams);
      fetchApplications(fetchParams);
    }
  }, [jobIdFromUrl]);

  // Debounced search effect with improved UX
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setIsSearching(true);
        setSearchTerm(searchInput);
      }
    }, 300); // Reduced to 300ms for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchTerm]);

  // Reset searching state when search term changes and request completes
  useEffect(() => {
    if (!loading && isSearching) {
      setIsSearching(false);
      // Maintain focus on search input after search completes
      if (searchInputRef && document.activeElement !== searchInputRef) {
        setTimeout(() => {
          searchInputRef.focus();
          // Restore cursor position to end
          const length = searchInputRef.value.length;
          searchInputRef.setSelectionRange(length, length);
        }, 100);
      }
    }
  }, [loading, isSearching, searchInputRef]);

  // Keyboard shortcut to focus search (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !showApplicationModal) {
        e.preventDefault();
        if (searchInputRef) {
          searchInputRef.focus();
          searchInputRef.select(); // Select all text for easy replacement
        }
      }
      // Escape key to clear search
      if (e.key === 'Escape' && document.activeElement === searchInputRef) {
        setSearchInput('');
        searchInputRef.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef, showApplicationModal]);

  // Fetch jobs for filter dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoadingJobs(true);
        const response = await makeJsonRequest('/api/hr/jobs?limit=100');
        if (response.success) {
          setJobs(response.data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [makeJsonRequest]);

  // Initial load
  useEffect(() => {
    const fetchParams = {
      page: 1,
      limit: 20,
      job: selectedJob !== 'all' ? selectedJob : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
      sortBy,
      sortOrder
    };

    fetchApplications(fetchParams);
    setInitialLoad(false);
  }, []);

  // Fetch applications when filters change (but not on initial load)
  useEffect(() => {
    if (!initialLoad) {
      const fetchParams = {
        page: 1, // Always start from page 1 when filters change
        limit: 20,
        job: selectedJob !== 'all' ? selectedJob : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder
      };

      console.log('Fetching applications with params:', fetchParams);

      // Only trigger search state if search term changed
      if (searchTerm !== searchInput && searchTerm) {
        setIsSearching(true);
      }

      fetchApplications(fetchParams);
      // Reset to first page when filters change
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }
  }, [selectedJob, statusFilter, searchTerm, sortBy, sortOrder, initialLoad]);

  // Fetch applications when page changes (but not when filters change)
  useEffect(() => {
    if (currentPage > 1 && !initialLoad) {
      const fetchParams = {
        page: currentPage,
        limit: 20,
        job: selectedJob !== 'all' ? selectedJob : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder
      };

      fetchApplications(fetchParams);
    }
  }, [currentPage, initialLoad]);



  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'under_review':
        return 'bg-gray-200 text-gray-800';
      case 'shortlisted':
        return 'bg-gray-800 text-white';
      case 'rejected':
        return 'bg-gray-400 text-white';
      case 'interview_scheduled':
        return 'bg-gray-600 text-white';
      case 'completed':
        return 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'submitted':
        return 'bg-gray-700 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatStatus = (status) => {
    return String(status).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'text-gray-900 font-semibold';
    if (score >= 7.0) return 'text-gray-700';
    return 'text-gray-500';
  };

  // Map interviewer recommendation to color classes (reuse from HRInterviewManagement)
  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'strongly_recommend':
      case 'Strong Hire':
        return 'text-green-600 dark:text-green-400 font-semibold';
      case 'recommend':
      case 'Hire':
        return 'text-gray-700 dark:text-gray-300';
      case 'do_not_recommend':
      case 'No Hire':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Normalize feedback from various possible shapes on the application object
  const normalizeFeedbackFromApplication = (app) => {
    if (!app) return null;
    const rawCandidates = [
      app.feedback,
      app.existingFeedback,
      app.interviewerFeedback,
      app.latestFeedback,
      app.interview?.feedback,
      app.interview?.existingFeedback,
      app.latestInterview?.feedback,
      app.latestInterview?.existingFeedback,
      // If applications carry an interviews list, prefer the latest with any feedback fields
      ...(Array.isArray(app.interviews) ? app.interviews.map(iv => iv?.feedback || iv?.existingFeedback).filter(Boolean) : [])
    ].filter(Boolean);

    // Score a feedback object by how many meaningful fields it has
    const scoreFeedback = (f) => {
      if (!f || typeof f !== 'object') return 0;
      let score = 0;
      const fields = [
        'overallRating', 'technicalSkills', 'problemSolving', 'candidateExperienceRating',
        'recommendation', 'additionalNotes', 'submittedAt'
      ];
      fields.forEach(k => { if (f[k] !== undefined && f[k] !== null && f[k] !== '') score++; });
      if (Array.isArray(f.strengths) && f.strengths.length) score++;
      if (Array.isArray(f.weaknesses) && f.weaknesses.length) score++;
      // Alternate key aliases
      if (f.technical) score++;
      if (f.problem_solving) score++;
      if (f.candidateExperience || f.experienceRating) score++;
      return score;
    };

    // Choose the richest feedback object
    const fb = rawCandidates.sort((a, b) => scoreFeedback(b) - scoreFeedback(a))[0];
    if (!fb || scoreFeedback(fb) === 0) return null;

    // Map aliases to canonical
    const overallRating = fb.overallRating ?? fb.overall ?? fb.rating?.overall;
    const technicalSkills = fb.technicalSkills ?? fb.technical ?? fb.ratings?.technical;
    const problemSolving = fb.problemSolving ?? fb.problem_solving ?? fb.ratings?.problemSolving;
    const candidateExperienceRating = fb.candidateExperienceRating ?? fb.candidateExperience ?? fb.experienceRating ?? fb.ratings?.candidateExperience;
    const strengths = Array.isArray(fb.strengths) ? fb.strengths : (Array.isArray(fb.positives) ? fb.positives : []);
    const weaknesses = Array.isArray(fb.weaknesses) ? fb.weaknesses : (Array.isArray(fb.concerns) ? fb.concerns : (Array.isArray(fb.areasOfImprovement) ? fb.areasOfImprovement : []));
    const recommendation = fb.recommendation;
    const additionalNotes = fb.additionalNotes ?? fb.notes ?? '';
    const submittedAt = fb.submittedAt ?? fb.createdAt ?? fb.updatedAt;

    return {
      overallRating,
      technicalSkills,
      problemSolving,
      candidateExperienceRating,
      strengths,
      weaknesses,
      recommendation,
      additionalNotes,
      submittedAt
    };
  };

  const handleApplicationAction = async (action, applicationId) => {
    switch (action) {
      case 'view':
        const application = applications.find(app => app.id === applicationId);
        console.log('Full application data:', JSON.stringify(application, null, 2));
        setSelectedApplication(application);
        setShowApplicationModal(true);
        break;
      case 'shortlist':
        await handleStatusChange(applicationId, 'shortlisted');
        break;
      case 'reject':
        await handleStatusChange(applicationId, 'rejected');
        break;
      case 'schedule':
        // Open schedule modal instead of directly changing status
        const app = applications.find(a => a.id === applicationId);
        if (app) setSelectedApplication(app);
        setScheduleForm(prev => ({
          ...prev,
          applicationId,
          interviewerId: '',
          date: '',
          time: '',
          duration: '60',
          type: 'video',
          location: '',
          notes: ''
        }));
        setScheduleError(null);
        setSlotState({ loading: false, slots: [], error: null });
        setShowScheduleModal(true);
        break;
    }
  };

  // Fetch interviewers for dropdown
  useEffect(() => {
    const fetchInterviewers = async () => {
      try {
        const res = await makeJsonRequest('/api/hr/interviewers');
        if (res?.success && Array.isArray(res.data)) {
          setInterviewers(res.data.map(i => ({ id: i.id || i._id, name: i.name, email: i.email })));
        }
      } catch (e) {
        // silent fail
      }
    };
    fetchInterviewers();
  }, [makeJsonRequest]);

  const loadAvailableSlots = async () => {
    const { interviewerId, date, duration } = scheduleForm;
    if (!interviewerId || !date) return;
    setSlotState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await makeJsonRequest(`/api/hr/interviews/available-slots/${interviewerId}?date=${date}&duration=${duration}`);
      if (res?.success) {
        setSlotState({ loading: false, slots: res.data?.availableSlots || [], error: null });
      } else {
        setSlotState({ loading: false, slots: [], error: res?.message || 'Failed to load slots' });
      }
    } catch (err) {
      setSlotState({ loading: false, slots: [], error: err.message || 'Failed to load slots' });
    }
  };

  const resetScheduleForm = () => setScheduleForm({ applicationId: '', interviewerId: '', date: '', time: '', duration: '60', type: 'video', location: '', notes: '' });

  const submitSchedule = async (e) => {
    e.preventDefault();
    if (submittingSchedule) return;
    setSubmittingSchedule(true);
    setScheduleError(null);
    try {
      const { applicationId, interviewerId, date, time, duration, type, location, notes } = scheduleForm;
      if (!applicationId || !interviewerId || !date || !time) {
        throw new Error('Please fill required fields');
      }
      // Backend requires future date (not today)
      const today = new Date();
      const selected = new Date(date);
      const todayYMD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (selected <= todayYMD) {
        throw new Error('Please select a date after today');
      }
      const payload = {
        applicationId,
        interviewerId,
        scheduledDate: date,
        scheduledTime: time,
        duration: parseInt(duration, 10),
        type,
        location: location || undefined,
        notes: notes || undefined
      };
      const res = await makeJsonRequest('/api/hr/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res?.success) throw new Error(res?.message || 'Failed to schedule');
      setShowScheduleModal(false);
      resetScheduleForm();
      setSlotState({ loading: false, slots: [], error: null });
      // Update application status locally/backend
      await handleStatusChange(applicationId, 'interview_scheduled');
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setScheduleError(apiErrors.map(e => e.message).join(', '));
      } else {
        setScheduleError(err.message || 'Failed to schedule interview');
      }
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const result = await updateApplicationStatus(applicationId, newStatus);
      if (result.success) {
        // Status updated successfully - the hook already updates local state
        console.log('Application status updated successfully');
      } else {
        console.error('Failed to update status:', result.error);
        // Could show toast notification here
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      // Could show toast notification here
    }
  };

  const handleExportRequest = () => {
    const hasFilters = selectedJob !== 'all' || statusFilter !== 'all' || searchTerm;
    
    if (!hasFilters) {
      // Show confirmation dialog for full export
      setShowExportConfirm(true);
    } else {
      // Direct export for filtered results
      exportApplications('csv');
    }
  };

  const exportApplications = (format) => {
    const dataToExport = applications; // This will be the filtered/paginated results from backend
    
    if (format === 'csv') {
      const csvContent = [
        ['Name', 'Email', 'Phone', 'Job Title', 'Department', 'Resume Score', 'Status', 'Experience', 'Skills', 'Applied Date'],
        ...dataToExport.map(app => [
          app.candidate.name,
          app.candidate.email,
          app.candidate.phone,
          app.job.title,
          app.job.department,
          app.resumeScore,
          formatStatus(app.status),
          app.experience,
          Array.isArray(app.skills) ? app.skills.join('; ') : '',
          new Date(app.appliedDate).toLocaleDateString()
        ])
      ].map(row => row.map(cell => {
        // Escape commas and quotes in CSV
        const cellStr = String(cell || '');
        return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
      }).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Helper: score/validate feedback object
  const hasMeaningfulFeedback = (f) => {
    if (!f || typeof f !== 'object') return false;
    if (f.submittedAt || f.overallRating != null || f.recommendation) return true;
    if (Array.isArray(f.strengths) && f.strengths.length) return true;
    if (Array.isArray(f.weaknesses) && f.weaknesses.length) return true;
    return false;
  };

  // Background: for visible applications, detect if any interview has feedback to override status to Completed
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!applications || applications.length === 0) return;
      const targets = applications.filter(a => a && a.status === 'interview_scheduled');
      if (targets.length === 0) return;
      // Skip those where inline normalization already finds feedback
      const needFetch = targets.filter(a => !normalizeFeedbackFromApplication(a));
      if (needFetch.length === 0) return;
      const updates = {};
      await Promise.all(needFetch.map(async (a) => {
        const id = a.id;
        const urls = [
          `/api/hr/interviews?applicationId=${id}&limit=3`,
          `/api/hr/interviews?application=${id}&limit=3`,
          `/api/hr/interviews?appId=${id}&limit=3`
        ];
        let found = false;
        for (const u of urls) {
          try {
            const res = await makeJsonRequest(u);
            if (res?.success) {
              const list = Array.isArray(res.data?.interviews) ? res.data.interviews : (Array.isArray(res.data) ? res.data : []);
              for (const iv of list) {
                const f = iv?.feedback || iv?.existingFeedback;
                if (hasMeaningfulFeedback(f)) { found = true; break; }
              }
            }
          } catch (e) { /* ignore */ }
          if (found) break;
        }
        updates[id] = found;
      }));
      if (!cancelled && Object.keys(updates).length) {
        setFeedbackByAppId(prev => ({ ...prev, ...updates }));
      }
    };
    run();
    return () => { cancelled = true; };
  }, [applications, makeJsonRequest]);

  // Derive feedback once per render for the currently selected application
  const inlineFeedback = selectedApplication ? normalizeFeedbackFromApplication(selectedApplication) : null;
  const appFeedback = externalFeedback || inlineFeedback;
  const feedbackStrengths = Array.isArray(appFeedback?.strengths) ? appFeedback.strengths : [];
  const feedbackWeaknesses = Array.isArray(appFeedback?.weaknesses) ? appFeedback.weaknesses : [];

  // When opening the Application Details modal, try to fetch interview feedback if not present inline
  useEffect(() => {
    let cancelled = false;
    const fetchFeedback = async () => {
      if (!showApplicationModal || !selectedApplication) return;
      // If we already have inline feedback with data, skip fetch
      const hasInline = inlineFeedback && (
        inlineFeedback.overallRating != null || inlineFeedback.recommendation || (inlineFeedback.strengths?.length) || (inlineFeedback.weaknesses?.length)
      );
      if (hasInline) { setExternalFeedback(null); return; }
      setFetchingFeedback(true);
      setExternalFeedback(null);
      const candidates = [];
      const tryUrls = [
        `/api/hr/interviews?applicationId=${selectedApplication.id}&limit=5`,
        `/api/hr/interviews?application=${selectedApplication.id}&limit=5`,
        `/api/hr/interviews?appId=${selectedApplication.id}&limit=5`
      ];
      for (const url of tryUrls) {
        try {
          const res = await makeJsonRequest(url);
          if (res?.success) {
            const list = Array.isArray(res.data?.interviews) ? res.data.interviews : (Array.isArray(res.data) ? res.data : []);
            if (list.length) candidates.push(...list);
          }
        } catch (e) { /* silent */ }
        if (candidates.length) break;
      }
      if (!cancelled && candidates.length) {
        // Select interview with richest feedback
        const withFb = candidates.map(iv => iv?.feedback || iv?.existingFeedback).filter(Boolean);
        if (withFb.length) {
          const pickRichest = (arr) => arr.sort((a,b)=>{
            const score = (f)=>{
              let s=0; ['overallRating','technicalSkills','problemSolving','candidateExperienceRating','recommendation','additionalNotes','submittedAt'].forEach(k=>{ if(f?.[k]!=null && f?.[k]!=='' ) s++; });
              if (Array.isArray(f?.strengths) && f.strengths.length) s++;
              if (Array.isArray(f?.weaknesses) && f.weaknesses.length) s++;
              return s;
            };
            return score(b)-score(a);
          })[0];
          const fb = pickRichest(withFb);
          if (!cancelled && fb) {
            const normalized = {
              overallRating: fb.overallRating ?? fb.overall ?? fb.rating?.overall,
              technicalSkills: fb.technicalSkills ?? fb.technical ?? fb.ratings?.technical,
              problemSolving: fb.problemSolving ?? fb.problem_solving ?? fb.ratings?.problemSolving,
              candidateExperienceRating: fb.candidateExperienceRating ?? fb.candidateExperience ?? fb.experienceRating ?? fb.ratings?.candidateExperience,
              strengths: Array.isArray(fb.strengths) ? fb.strengths : (Array.isArray(fb.positives) ? fb.positives : []),
              weaknesses: Array.isArray(fb.weaknesses) ? fb.weaknesses : (Array.isArray(fb.concerns) ? fb.concerns : (Array.isArray(fb.areasOfImprovement) ? fb.areasOfImprovement : [])),
              recommendation: fb.recommendation,
              additionalNotes: fb.additionalNotes ?? fb.notes ?? '',
              submittedAt: fb.submittedAt ?? fb.createdAt ?? fb.updatedAt
            };
            setExternalFeedback(normalized);
          }
        }
      }
      if (!cancelled) setFetchingFeedback(false);
    };
    fetchFeedback();
    return () => { cancelled = true; };
  }, [showApplicationModal, selectedApplication]);

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                {pageType === 'filtered' ? 'Job Applications' : 'Application Management'}
              </h1>
              {pageType === 'filtered' && currentJobTitle && (
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-1 font-['Open_Sans'] transition-colors duration-300">
                  {currentJobTitle}
                </h2>
              )}
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">
                {pageType === 'filtered' 
                  ? 'Applications for the selected job position' 
                  : 'Review and manage candidate applications'
                }
              </p>
              {pageType === 'filtered' && (
                <div className="mt-2">
                  <Link 
                    // Corrected route path to show all applications
                    to="/hr/applications"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-300"
                  >
                    ← View all applications
                  </Link>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExportRequest}
                disabled={loading || applications.length === 0}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={setSearchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setIsSearching(false); // Reset searching state on new input
                  }}
                  onFocus={(e) => {
                    // Ensure cursor is at the end when focused
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }}
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 transition-colors duration-300"
                  placeholder="Search candidates, jobs, or skills... (Ctrl+F to focus)"
                  disabled={false} // Never disable the search input to maintain interactivity
                  autoComplete="off"
                />
                {/* Enhanced search status indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {searchInput !== searchTerm && searchInput.length > 0 ? (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 dark:border-gray-500 mr-1"></div>
                      <span className="font-medium">Typing...</span>
                    </div>
                  ) : isSearching ? (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 dark:border-gray-400 mr-1"></div>
                      <span className="font-medium">Searching...</span>
                    </div>
                  ): null}
                </div>
              </div>
            </div>

            {/* Job Filter */}
            <div>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                disabled={loading || loadingJobs || pageType === 'filtered'}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 ${
                  pageType === 'filtered' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''
                }`}
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job._id || job.id} value={job.id || job._id}>{job.title}</option>
                ))}
              </select>
              {pageType === 'filtered' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 transition-colors duration-300">Filter set from job selection</p>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={loading}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              <option value="appliedDate">Applied Date</option>
              <option value="resumeScore">Resume Score</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              disabled={loading}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400 font-['Roboto'] transition-colors duration-300">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300 font-['Roboto'] transition-colors duration-300">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      clearCache();
                      const fetchParams = {
                        page: currentPage,
                        limit: 20,
                        job: selectedJob !== 'all' ? selectedJob : undefined,
                        status: statusFilter !== 'all' ? statusFilter : undefined,
                        search: searchTerm || undefined,
                        sortBy,
                        sortOrder
                      };
                      fetchApplications(fetchParams);
                    }}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      clearCache();
                      window.location.reload();
                    }}
                    className="text-sm bg-gray-200 text-blue-800 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors ml-2"
                  >
                    Force Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applications Table */}
        {loading ? (
          <SkeletonTable rows={10} columns={7} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto'] transition-colors duration-300">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto'] transition-colors duration-300">
                    Job Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto'] transition-colors duration-300">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto'] transition-colors duration-300">
                    Resume Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto'] transition-colors duration-300">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto'] transition-colors duration-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto'] transition-colors duration-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                {applications.map((application) => {
                  // derive completed when any feedback exists inline or from background check
                  const inlineFb = normalizeFeedbackFromApplication(application);
                  const derivedStatus = (inlineFb || feedbackByAppId[application.id]) ? 'completed' : application.status;
                  return (
                  <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors duration-300">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Open_Sans'] transition-colors duration-300">
                            {application.candidate.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                            {application.candidate.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">
                            {application.experience}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-['Roboto'] transition-colors duration-300">{application.job.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">{application.job.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">
                        {new Date(application.appliedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-['Roboto'] ${getScoreColor(application.resumeScore)}`}>
                        {application.resumeScore}/10
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {application.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full transition-colors duration-300">
                            {skill}
                          </span>
                        ))}
                        {application.skills.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full transition-colors duration-300">
                            +{application.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(derivedStatus)}`}>
                        {formatStatus(derivedStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleApplicationAction('view', application.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {(application.status === 'under_review' || application.status === 'submitted') && (
                          <>
                            <button
                              onClick={() => handleApplicationAction('shortlist', application.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300"
                              title="Shortlist"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleApplicationAction('reject', application.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300"
                              title="Reject"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                        {application.status === 'shortlisted' && (
                          <button
                            onClick={() => handleApplicationAction('schedule', application.id)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300"
                            title="Schedule Interview"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 transition-colors duration-300">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                    Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 20, pagination.totalApplications)}
                    </span> of{' '}
                    <span className="font-medium">{pagination.totalApplications}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage || loading}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let page;
                      if (pagination.totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        page = pagination.totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-300 ${
                            page === currentPage
                              ? 'z-10 bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          } ${loading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage || loading}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Empty State */}
        {!loading && applications.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
              No applications match your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 bg-gray-600 dark:bg-black/70 bg-opacity-50 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-3/4 max-w-4xl shadow-lg rounded-lg bg-white dark:bg-gray-800 transition-colors duration-300">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                    {selectedApplication.candidate.name}
                  </h3>
                  <div className="flex items-center mt-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appFeedback ? 'completed' : selectedApplication.status)}`}>
                      {formatStatus(appFeedback ? 'completed' : selectedApplication.status)}
                    </span>
                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">
                      Applied on {new Date(selectedApplication.appliedDate || selectedApplication.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2 transition-colors duration-300">Contact Information</h4>
                  <p className="text-gray-900 dark:text-white font-['Roboto'] transition-colors duration-300">{selectedApplication.candidate.email}</p>
                  <p className="text-gray-900 dark:text-white font-['Roboto'] transition-colors duration-300">
                    {selectedApplication.candidate.phone || 'Phone not provided'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2 transition-colors duration-300">Job Applied For</h4>
                  <p className="text-gray-900 dark:text-white font-['Roboto'] transition-colors duration-300">{selectedApplication.job.title}</p>
                  <p className="text-gray-600 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">{selectedApplication.job.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2 transition-colors duration-300">Experience</h4>
                  <p className="text-gray-900 dark:text-white font-['Roboto'] transition-colors duration-300">{selectedApplication.experience}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2 transition-colors duration-300">Resume Score</h4>
                  <p className={`text-lg font-['Roboto'] ${getScoreColor(selectedApplication.resumeScore)}`}>
                    {selectedApplication.resumeScore}/10
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2 transition-colors duration-300">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.skills && selectedApplication.skills.length > 0 ? (
                    selectedApplication.skills.map((skill, index) => (
                      <span key={index} className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full transition-colors duration-300">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 font-['Roboto'] text-sm transition-colors duration-300">No skills information available</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-4 transition-colors duration-300">AI Analysis</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                      {selectedApplication.aiAnalysis.skillsMatch}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">Skills Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                      {selectedApplication.aiAnalysis.experienceMatch}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">Experience Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                      {selectedApplication.aiAnalysis.overallFit}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300">Overall Fit</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300 mb-2">Strengths</h5>
                    <ul className="space-y-1">
                      {selectedApplication.aiAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-600 font-['Roboto'] flex items-start">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] transition-colors duration-300 mb-2">Concerns</h5>
                    <ul className="space-y-1">
                      {selectedApplication.aiAnalysis.concerns.map((concern, index) => (
                        <li key={index} className="text-sm text-gray-600 font-['Roboto'] flex items-start">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Interview Feedback (if available) */}
              <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-4">Interview Feedback</h4>
                {!appFeedback ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">No interviewer feedback submitted yet.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Overall Rating */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{appFeedback.overallRating ?? '—'}/5</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Overall Rating</div>
                      </div>
                      {/* Recommendation */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                        <div className={`text-lg font-semibold font-['Open_Sans'] ${getRecommendationColor(appFeedback.recommendation)}`}>
                          {(() => {
                            const map = { strongly_recommend: 'Strong Hire', recommend: 'Hire', neutral: 'Maybe', do_not_recommend: 'No Hire', strongly_do_not_recommend: 'Strong No Hire' };
                            const val = appFeedback.recommendation;
                            return map[val] || val || '—';
                          })()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Recommendation</div>
                      </div>
                      {/* Submitted */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">{appFeedback.submittedAt ? new Date(appFeedback.submittedAt).toLocaleString() : '—'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Submitted</div>
                      </div>
                    </div>

                    {/* Score Breakdown (no candidate experience) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Technical Skills</h5>
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={appFeedback.technicalSkills} />
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-['Roboto']">{appFeedback.technicalSkills ?? '—'}/5</span>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Problem Solving</h5>
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={appFeedback.problemSolving} />
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-['Roboto']">{appFeedback.problemSolving ?? '—'}/5</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths / Areas of Concern */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Strengths</h5>
                        {feedbackStrengths.length > 0 ? (
                          <ul className="space-y-1">
                            {feedbackStrengths.map((s, idx) => (
                              <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] flex items-start">
                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">No strengths provided.</p>
                        )}
                      </div>
                      {feedbackWeaknesses.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Areas of Concern</h5>
                          <ul className="space-y-1">
                            {feedbackWeaknesses.map((w, idx) => (
                              <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] flex items-start">
                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Comments at bottom */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Comments</h5>
                      <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{appFeedback.additionalNotes || '—'}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <button
                    onClick={async () => {
                      try {
                        // Make authenticated request to get resume
                        const response = await makeRequest(`/api/hr/applications/${selectedApplication.id}/resume`);
                        
                        if (response.ok) {
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank', 'noopener,noreferrer');
                          
                          // Clean up the blob URL after a delay to free memory
                          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                        } else {
                          const errorData = await response.json();
                          alert(errorData.message || 'Error loading resume. Please try again.');
                        }
                      } catch (error) {
                        console.error('Error opening resume:', error);
                        alert('Error opening resume. Please try again.');
                      }
                    }}
                    disabled={!selectedApplication.resumeUrl}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark:bg-white dark:text-black cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!selectedApplication.resumeUrl ? "Resume not available" : "View candidate resume"}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Resume
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark;bg-black dark:text-white dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  
                  {/* Show action buttons based on current status */}
                  {(selectedApplication.status === 'under_review' || selectedApplication.status === 'submitted') && (
                    <>
                      <button
                        onClick={() => {
                          handleApplicationAction('reject', selectedApplication.id);
                          setShowApplicationModal(false);
                        }}
                        className="px-6 py-2 bg-black hover:text-red-500 text-white rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleApplicationAction('shortlist', selectedApplication.id);
                          setShowApplicationModal(false);
                        }}
                        className="bg-black hover:text-green-500 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Shortlist
                      </button>
                    </>
                  )}
                  
                  {selectedApplication.status === 'shortlisted' && (
                    <>
                      <button
                        onClick={() => {
                          handleApplicationAction('reject', selectedApplication.id);
                          setShowApplicationModal(false);
                        }}
                        className="px-6 py-2 bg-black hover:text-red-500 text-white rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleApplicationAction('schedule', selectedApplication.id);
                          setShowApplicationModal(false);
                        }}
                        className="bg-black hover:text-blue-500 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                        </svg>
                        Schedule Interview
                      </button>
                    </>
                  )}
                  
                  {(selectedApplication.status === 'interview_scheduled' && !appFeedback) && (
                    <div className="flex items-center px-4 py-2 bg-gray-100 text-blue-700 rounded-lg">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Interview Scheduled
                    </div>
                  )}

                  {(appFeedback) && (
                    <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Completed
                    </div>
                  )}
                  
                  {selectedApplication.status === 'rejected' && (
                    <div className="flex items-center px-4 py-2 bg-gray-100 text-red-500 rounded-lg">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Application Rejected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showScheduleModal && selectedApplication && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black/70 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
            <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-2xl shadow-lg rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
                    Schedule Interview
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Candidate + Job summary */}
                <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Candidate</div>
                      <div className="text-gray-900 dark:text-white font-['Open_Sans']">{selectedApplication?.candidate?.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedApplication?.candidate?.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Job</div>
                      <div className="text-gray-900 dark:text-white font-['Open_Sans']">{selectedApplication?.job?.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedApplication?.job?.department}</div>
                    </div>
                  </div>
                </div>

                {scheduleError && (
                  <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 font-['Roboto'] text-sm transition-colors duration-300">{scheduleError}</div>
                )}

                <form className="space-y-4" onSubmit={submitSchedule}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Interviewer</label>
                      <select
                        value={scheduleForm.interviewerId}
                        onChange={e => setScheduleForm(f => ({ ...f, interviewerId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                      >
                        <option value="">Select interviewer...</option>
                        {interviewers.map(intv => (
                          <option key={intv.id} value={intv.id}>{intv.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Date</label>
                      <input
                        type="date"
                        min={new Date(Date.now()+24*60*60*1000).toISOString().slice(0,10)}
                        value={scheduleForm.date}
                        onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Time</label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          value={scheduleForm.time}
                          onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                        />
                        <button
                          type="button"
                          onClick={loadAvailableSlots}
                          disabled={!scheduleForm.interviewerId || !scheduleForm.date || slotState.loading}
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg font-['Roboto'] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                        >
                          {slotState.loading ? 'Loading...' : 'Slots'}
                        </button>
                      </div>
                      {slotState.error && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-['Roboto']">{slotState.error}</p>
                      )}
                      {slotState.slots.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                          {slotState.slots.slice(0, 30).map(s => (
                            <button
                              type="button"
                              key={s.startTime}
                              onClick={() => setScheduleForm(f => ({ ...f, time: s.startTime }))}
                              className={`px-2 py-1 rounded text-xs border ${scheduleForm.time === s.startTime ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                            >
                              {s.startTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Duration (minutes)</label>
                      <select
                        value={scheduleForm.duration}
                        onChange={e => setScheduleForm(f => ({ ...f, duration: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                      >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Interview Type</label>
                      <select
                        value={scheduleForm.type}
                        onChange={e => setScheduleForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                      >
                        <option value="phone">Phone</option>
                        <option value="video">Video</option>
                        <option value="in-person">In-Person</option>
                        <option value="panel">Panel</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Location</label>
                    <input
                      type="text"
                      value={scheduleForm.location}
                      onChange={e => setScheduleForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="Conference Room A or Virtual Meeting"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Notes</label>
                    <textarea
                      rows={3}
                      value={scheduleForm.notes}
                      onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Interview focus areas, special instructions..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingSchedule || !(scheduleForm.applicationId && scheduleForm.interviewerId && scheduleForm.date && scheduleForm.time)}
                      className={`px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors text-white dark:text-black ${(!(scheduleForm.applicationId && scheduleForm.interviewerId && scheduleForm.date && scheduleForm.time) || submittingSchedule) ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'}`}
                    >
                      {submittingSchedule ? 'Scheduling...' : 'Schedule Interview'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </HRLayout>
  );
};

export default HRApplicationManagement;

// Small helper to render 1–5 stars (mirrors HRInterviewManagement)
const StarDisplay = ({ rating }) => {
  const val = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  return (
    <div className="flex items-center">
      {[1,2,3,4,5].map(star => (
        <svg key={star} className={`w-4 h-4 ${star <= val ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};
