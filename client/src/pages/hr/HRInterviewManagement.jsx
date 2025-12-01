import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AIInterviewFeedbackSummary from '../../components/common/AIInterviewFeedbackSummary';
import { Link } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';
import { useApiRequest } from '../../hooks/useApiRequest';

const HRInterviewManagement = () => {
  // Replace static mock data with dynamic state
  const { makeJsonRequest } = useApiRequest();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters / pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // maps: today -> today, week -> this_week (server), past -> client filter
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalInterviews: 0 });
  const [summary, setSummary] = useState({ todayInterviews: 0, upcomingInterviews: 0 });

  // Modal state
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ applicationId: '', interviewerId: '', date: '', time: '', duration: '60', type: 'video', location: '', notes: '' });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, id: null, date: '', time: '', duration: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [interviewers, setInterviewers] = useState([]); // populated via /api/hr/interviewers
  const [candidates, setCandidates] = useState([]); // derived from applications API
  const [candidateSearch, setCandidateSearch] = useState('');
  const candidateSearchTimer = useRef();
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [showCandidateList, setShowCandidateList] = useState(false);
  const candidateResultsRef = useRef(null);
  const [candidateHighlight, setCandidateHighlight] = useState(-1);
  const [candidateJobFilter, setCandidateJobFilter] = useState('all');
  const [jobsForFilter, setJobsForFilter] = useState([]);
  // AI analysis state for interview modal (calls application-level endpoint)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiCached, setAiCached] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Clear AI summary when changing the selected interview/modal to prevent cross-bleed
  useEffect(() => {
    // If the currently selected interview has an application.aiFeedback, preload it as cached
    const stored = selectedInterview?.application?.aiFeedback || selectedInterview?.aiFeedback;
    if (stored) {
      setAiData(stored);
      setAiCached(true);
    } else {
      setAiData(null);
      setAiCached(false);
    }
    setAiError(null);
    setAiLoading(false);
  }, [selectedInterview?.id, showInterviewModal]);

  // Map backend statuses to display labels
  const statusDisplayMap = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
    no_show: 'No Show'
  };

  const reverseStatusDisplayMap = Object.fromEntries(Object.entries(statusDisplayMap).map(([k,v]) => [v, k]));

  const normalizeInterview = (i) => {
    const applicant = i.application?.applicant || {};
    const job = i.application?.job || {};
    const interviewer = i.interviewer || {};
    const hasFeedback = !!(i?.feedback && (i.feedback.submittedAt || i.feedback.overallRating != null || i.feedback.recommendation || (Array.isArray(i.feedback.strengths) && i.feedback.strengths.length)));
    return {
      id: i._id,
      applicationId: i.application?._id || i.application?.id,
      application: { aiFeedback: i.application?.aiFeedback },
      candidate: {
        name: [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') || 'Unknown',
        email: applicant.email || 'N/A',
        phone: applicant.phone || 'N/A'
      },
      job: {
        id: job._id,
        title: job.title || 'Unknown Role',
        department: job.department || job.employmentType || '—'
      },
      interviewer: {
        id: interviewer._id,
        name: [interviewer.firstName, interviewer.lastName].filter(Boolean).join(' ') || '—',
        email: interviewer.email || '—',
        title: interviewer.title || ''
      },
      scheduledDate: i.scheduledDate,
      scheduledTime: i.scheduledTime,
      duration: i.duration,
  status: hasFeedback ? 'Completed' : (statusDisplayMap[i.status] || i.status),
      type: i.type,
      location: i.location || i.meetingDetails?.location || i.meetingDetails?.meetingLink || '—',
      notes: i.notes || i.agenda || '',
      feedback: i.feedback && i.feedback.submittedAt ? {
        // Canonical fields
        overallRating: i.feedback.overallRating,
        technicalSkills: i.feedback.technicalSkills,
        problemSolving: i.feedback.problemSolving,
        candidateExperienceRating: i.feedback.candidateExperienceRating,
        strengths: Array.isArray(i.feedback.strengths) ? i.feedback.strengths : [],
        weaknesses: Array.isArray(i.feedback.weaknesses) ? i.feedback.weaknesses : [],
        recommendation: i.feedback.recommendation,
        additionalNotes: i.feedback.additionalNotes || '',
        submittedAt: i.feedback.submittedAt
      } : null
    };
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (statusFilter !== 'all') params.set('status', reverseStatusDisplayMap[statusFilter] || statusFilter.toLowerCase());
    // Date filter mapping
    if (dateFilter === 'today') params.set('dateRange', 'today');
    else if (dateFilter === 'week') params.set('dateRange', 'this_week');
    // 'past' handled client side
    return params.toString();
  };

  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQueryString();
      const res = await makeJsonRequest(`/api/hr/interviews?${qs}`);
      if (res?.success) {
        const raw = res.data?.interviews || [];
        let normalized = raw.map(normalizeInterview).map(iv => {
          if (iv.feedback) return { ...iv, status: 'Completed' };
          return iv;
        });
        // Client-side past filter (scheduledDate < now)
        if (dateFilter === 'past') {
          const now = new Date();
          normalized = normalized.filter(iv => new Date(iv.scheduledDate) < now);
        }
        // Client-side search
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          normalized = normalized.filter(iv =>
            iv.candidate.name.toLowerCase().includes(term) ||
            iv.job.title.toLowerCase().includes(term) ||
            (iv.interviewer.name && iv.interviewer.name.toLowerCase().includes(term))
          );
        }
        setInterviews(normalized);
        if (res.data?.pagination) setPagination(res.data.pagination);
        if (res.data?.summary) setSummary(res.data.summary);
      } else {
        setError(res?.message || 'Failed to load interviews');
      }
    } catch (e) {
      setError(e.message || 'Error fetching interviews');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters/page change (exclude searchTerm for now; search is client side)
  useEffect(() => {
    fetchInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter, page]);

  // Re-filter on search term change without refetch
  const filteredInterviews = useMemo(() => {
    if (!searchTerm) return interviews;
    const term = searchTerm.toLowerCase();
    return interviews.filter(iv =>
      iv.candidate.name.toLowerCase().includes(term) ||
      iv.job.title.toLowerCase().includes(term) ||
      (iv.interviewer.name && iv.interviewer.name.toLowerCase().includes(term))
    );
  }, [interviews, searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': 
      case 'Rescheduled': 
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'Confirmed': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'In Progress': 
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'Completed': 
        return 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'Cancelled': 
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'No Show': 
        return 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300';
      default: 
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  const handleInterviewAction = async (action, interviewId) => {
    const interview = interviews.find(int => int.id === interviewId);
    if (!interview) return;
    if (action === 'view') { setSelectedInterview(interview); setShowInterviewModal(true); return; }
    if (action === 'reschedule') { openReschedule(interview); return; }

    // Optimistic update helper
    const updateStatusLocal = (newStatusDisplay) => {
      setInterviews(prev => prev.map(int => int.id === interviewId ? { ...int, status: newStatusDisplay } : int));
    };

    try {
      switch (action) {
        case 'cancel': {
          const backendStatus = 'cancelled';
          updateStatusLocal(statusDisplayMap[backendStatus]);
          await makeJsonRequest(`/api/hr/interviews/${interviewId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: backendStatus, cancellationReason: 'Cancelled via UI' })
          });
          break;
        }
        default:
          break;
      }
    } catch (e) {
      // Revert optimistic change on error by refetching
      console.error('Action error:', e);
      fetchInterviews();
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return { date: '—', time: '—' };
    const dateObj = new Date(date);
    // If scheduledTime is present combine; else use existing time param
    let timeStr = time;
    if (!timeStr && dateObj instanceof Date && !isNaN(dateObj)) {
      timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return {
      date: dateObj.toLocaleDateString(),
      time: timeStr || '—'
    };
  };

  const isUpcoming = (date, time) => {
    if (!date) return false;
    const dateOnly = new Date(date);
    if (time) {
      const [hh, mm] = time.split(':');
      dateOnly.setHours(parseInt(hh || '0'), parseInt(mm || '0'));
    }
    return dateOnly > new Date();
  };

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

  // Debounced search handling
  const searchInputRef = useRef(null);
  const [rawSearch, setRawSearch] = useState('');
  useEffect(()=>{ setRawSearch(searchTerm); },[]);
  const debounceTimer = useRef();
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setRawSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(()=> setSearchTerm(value), 400);
  };

  // Fetch minimal candidates (applications) for scheduling (shortlisted + under_review)
  const fetchCandidates = useCallback(async (searchTerm='') => {
    try {
      setCandidateLoading(true);
      const qs = new URLSearchParams();
      qs.set('limit','20');
      qs.set('status','shortlisted');
      if (candidateJobFilter && candidateJobFilter !== 'all') qs.set('job', candidateJobFilter);
      if (searchTerm) qs.set('search', searchTerm);
      const res = await makeJsonRequest(`/api/hr/applications?${qs.toString()}`);
      if (res?.success && Array.isArray(res.data)) {
        const list = res.data.map(a => ({
          id: a.id || a._id,
          name: a.candidate?.name || `${a.applicantDetails?.firstName || ''} ${a.applicantDetails?.lastName || ''}`.trim() || 'Candidate',
          email: a.candidate?.email || a.applicantDetails?.email,
          jobId: a.job?.id || a.jobDetails?._id,
          jobTitle: a.job?.title || a.jobDetails?.title
        }));
        setCandidates(list);
      } else if (searchTerm) {
        setCandidates([]);
      }
    } catch(err){ if (searchTerm) setCandidates([]); }
    finally { setCandidateLoading(false); }
  }, [makeJsonRequest]);

  // Fetch interviewers (new HR endpoint) & candidates
  const fetchInterviewers = useCallback(async () => {
    try {
      const res = await makeJsonRequest('/api/hr/interviewers');
      if (res?.success && Array.isArray(res.data)) {
        setInterviewers(res.data.map(i => ({ id: i.id, name: i.name, email: i.email })));
      }
    } catch(err){ /* silent */ }
  }, [makeJsonRequest]);

  useEffect(()=>{ fetchCandidates(); fetchInterviewers(); }, [fetchCandidates, fetchInterviewers]);

  // Fetch jobs for candidate job filter (lightweight subset via /api/hr/jobs limit=100)
  useEffect(()=>{
    const loadJobs = async () => {
      try { const res = await makeJsonRequest('/api/hr/jobs?limit=100'); if (res?.success && Array.isArray(res.data)) { setJobsForFilter(res.data.map(j => ({ id: j._id || j.id, title: j.title }))); } } catch(err) { /* silent */ }
    };
    loadJobs();
  }, [makeJsonRequest]);

  const handleCandidateSearchChange = (e) => {
    const val = e.target.value;
    setCandidateSearch(val);
    clearTimeout(candidateSearchTimer.current);
    candidateSearchTimer.current = setTimeout(()=> fetchCandidates(val.trim()), 400);
    setShowCandidateList(true);
    setCandidateHighlight(-1);
  };

  const handleCandidateKeyDown = (e) => {
    if (!showCandidateList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCandidateHighlight(h => Math.min(candidates.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCandidateHighlight(h => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      if (candidateHighlight >= 0 && candidateHighlight < candidates.length) {
        const c = candidates[candidateHighlight];
        setScheduleForm(f => ({ ...f, applicationId: c.id }));
        setCandidateSearch(`${c.name} (${c.email})`);
        setShowCandidateList(false);
      }
    } else if (e.key === 'Escape') {
      setShowCandidateList(false);
    }
  };

  const selectCandidate = (c) => {
    setScheduleForm(f=>({...f, applicationId:c.id}));
    setCandidateSearch(`${c.name} (${c.email})`);
    setShowCandidateList(false);
  };

  // Hide list when clicking outside
  useEffect(()=>{
    const onClick = (evt) => {
      if (candidateResultsRef.current && !candidateResultsRef.current.contains(evt.target)) {
        setShowCandidateList(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Available slots state (suggestions based on interviewer + date + duration)
  const [slotState, setSlotState] = useState({ loading:false, slots:[], error:null });
  const loadAvailableSlots = async () => {
    const { interviewerId, date, duration } = scheduleForm;
    if (!interviewerId || !date) return;
    setSlotState(s => ({ ...s, loading:true, error:null }));
    try {
      const res = await makeJsonRequest(`/api/hr/interviews/available-slots/${interviewerId}?date=${date}&duration=${duration}`);
      if (res?.success) {
        setSlotState({ loading:false, slots:res.data?.availableSlots || [], error:null });
      } else {
        setSlotState({ loading:false, slots:[], error: res?.message || 'Failed to load slots' });
      }
    } catch(err){ setSlotState({ loading:false, slots:[], error: err.message }); }
  };

  const resetScheduleForm = () => setScheduleForm({ applicationId: '', interviewerId: '', date: '', time: '', duration: '60', type: 'video', location: '', notes: '' });

  const submitSchedule = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { applicationId, interviewerId, date, time, duration, type, location, notes } = scheduleForm;
      if (!applicationId || !interviewerId || !date || !time) {
        throw new Error('Please fill required fields');
      }
      // Prevent scheduling in the past
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      if (scheduledDateTime <= now) {
        throw new Error('Cannot schedule interview in the past. Please select a future date and time.');
      }
      const payload = {
        applicationId,
        interviewerId,
        scheduledDate: date,
        scheduledTime: time,
        duration: parseInt(duration,10),
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
      setSlotState({ loading:false, slots:[], error:null });
      fetchInterviews();
      // addToast('Interview scheduled successfully','success'); // Assuming addToast is globally available or defined below
    } catch(err){
      // Surface server validation messages when available
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setError(apiErrors.map(e => e.message).join(', '));
      } else {
        setError(err.message);
      }
      // addToast(err.message || 'Failed to schedule','error');
    } finally { setSubmitting(false); }
  };

  const openReschedule = (interview) => {
    setRescheduleModal({
      open: true,
      id: interview.id,
      date: interview.scheduledDate ? new Date(interview.scheduledDate).toISOString().slice(0,10) : '',
      time: interview.scheduledTime || '',
      duration: String(interview.duration || 60),
      reason: '' // Re-init reason
    });
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const { id, date, time, duration, reason } = rescheduleModal;
      if (!id || !date || !time) throw new Error('Missing fields');
      
      // Prevent rescheduling to past time
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      if (scheduledDateTime <= now) {
        throw new Error('Cannot reschedule to a past time. Please select a future date and time.');
      }
      const res = await makeJsonRequest(`/api/hr/interviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: date, scheduledTime: time, duration: parseInt(duration,10), rescheduleReason: reason || 'HR reschedule' })
      });
      if (!res?.success) throw new Error(res?.message || 'Failed to reschedule');
      setRescheduleModal({ open:false, id:null, date:'', time:'', duration:'', reason:'' });
      fetchInterviews();
    } catch(err){ setError(err.message); } finally { setSubmitting(false); }
  };

  // Decision actions (Hire/Reject) on completed interview with feedback
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const makeDecision = async (decision) => {
    if (!selectedInterview?.applicationId) {
      setError('Missing application reference for this interview');
      return;
    }
    if (decisionSubmitting) return;
    const isHire = decision === 'hire';
    const targetStatus = isHire ? 'offer_extended' : 'rejected';
    try {
      setDecisionSubmitting(true);
      const res = await makeJsonRequest(`/api/hr/applications/${selectedInterview.applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
      if (res?.success) {
        setShowInterviewModal(false);
      } else {
        throw new Error(res?.message || 'Failed to update application status');
      }
    } catch (err) {
      setError(err.message || 'Unable to make decision');
    } finally {
      setDecisionSubmitting(false);
    }
  };

  // Validation flags
  const isScheduleValid = !!(scheduleForm.applicationId && scheduleForm.interviewerId && scheduleForm.date && scheduleForm.time);
  const isRescheduleValid = !!(rescheduleModal.id && rescheduleModal.date && rescheduleModal.time && rescheduleModal.duration);

  // Safe feedback lists for the details modal (avoid mapping undefined)
  const strengthsList = Array.isArray(selectedInterview?.feedback?.strengths)
    ? selectedInterview.feedback.strengths
    : [];
  const weaknessesList = Array.isArray(selectedInterview?.feedback?.weaknesses)
    ? selectedInterview.feedback.weaknesses
    : [];


  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                Interview Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Schedule and manage candidate interviews
              </p>
              {/* Summary chips */}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-['Roboto'] text-gray-700 dark:text-gray-300 transition-colors duration-300">Today: {summary.todayInterviews}</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-['Roboto'] text-gray-700 dark:text-gray-300 transition-colors duration-300">Upcoming: {summary.upcomingInterviews}</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-['Roboto'] text-gray-700 dark:text-gray-300 transition-colors duration-300">Total: {pagination.totalInterviews}</span>
              </div>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Schedule Interview
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={rawSearch}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Search interviews..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
              >
                <option value="all">All Status</option>
                {Object.values(statusDisplayMap).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => { setPage(1); setDateFilter(e.target.value); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="past">Past Interviews</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 font-['Roboto'] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >Prev</button>
              <span className="text-sm font-['Roboto'] text-gray-600 dark:text-gray-300">{pagination.currentPage} / {pagination.totalPages}</span>
              <button
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 font-['Roboto'] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >Next</button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 rounded bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 font-['Roboto'] text-sm transition-colors duration-300">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
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
                    Interviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading && (
                  [...Array(5)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" /><div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2" /><div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2" /><div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2" /><div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 mb-2" /><div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                    </tr>
                  ))
                )}
                {!loading && filteredInterviews.map(interview => {
                  const { date, time } = formatDateTime(interview.scheduledDate, interview.scheduledTime);
                  const upcoming = isUpcoming(interview.scheduledDate, interview.scheduledTime);
                  return (
                    <tr key={interview.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                            {interview.candidate.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                            {interview.candidate.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">{interview.job.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">{interview.job.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">{interview.interviewer.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">{interview.interviewer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">{date}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">{time} ({interview.duration}min)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">{interview.type}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">{interview.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleInterviewAction('view', interview.id)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {upcoming && interview.status !== 'Cancelled' && (
                            <>
                              <button
                                onClick={() => handleInterviewAction('reschedule', interview.id)}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                title="Reschedule"
                              >
                                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleInterviewAction('cancel', interview.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                title="Cancel Interview"
                              >
                                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filteredInterviews.length === 0 && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">No interviews found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
              No interviews match your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Interview Details Modal */}
      {showInterviewModal && selectedInterview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black/70 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
                  Interview Details
                </h3>
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Candidate Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Candidate</h4>
                  <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.candidate.email}</p>
                  <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.candidate.phone}</p>
                </div>
                {/* Job Position */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Job Position</h4>
                  <p className="text-gray-900 dark:text-white font-['Roboto'] font-medium">{selectedInterview.job.title}</p>
                  <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.job.department}</p>
                </div>
                {/* Interviewer */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Interviewer</h4>
                  <p className="text-gray-900 dark:text-white font-['Roboto'] font-medium">{selectedInterview.interviewer.name}</p>
                  <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.interviewer.title}</p>
                  <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.interviewer.email}</p>
                </div>
                {/* Schedule */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Schedule</h4>
                  <p className="text-gray-900 dark:text-white font-['Roboto'] font-medium">
                    {formatDateTime(selectedInterview.scheduledDate, selectedInterview.scheduledTime).date}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">
                    {formatDateTime(selectedInterview.scheduledDate, selectedInterview.scheduledTime).time} 
                    ({selectedInterview.duration} minutes)
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.location}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Interview Type & Notes</h4>
                <p className="text-gray-900 dark:text-white font-['Roboto'] mb-2">{selectedInterview.type}</p>
                <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.notes}</p>
              </div>

              {selectedInterview.feedback && (
                <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-4">Interview Feedback</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Rating */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">
                        {selectedInterview.feedback.overallRating ?? '—'}/5
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Overall Rating</div>
                    </div>
                    {/* Recommendation */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                      <div className={`text-lg font-semibold font-['Open_Sans'] ${getRecommendationColor(selectedInterview.feedback.recommendation)}`}>
                        {(() => {
                          const map = { strongly_recommend: 'Strong Hire', recommend: 'Hire', neutral: 'Maybe', do_not_recommend: 'No Hire', strongly_do_not_recommend: 'Strong No Hire' };
                          const val = selectedInterview.feedback.recommendation;
                          return map[val] || val || '—';
                        })()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Recommendation</div>
                    </div>
                    {/* Submitted Date */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.feedback.submittedAt ? new Date(selectedInterview.feedback.submittedAt).toLocaleString() : '—'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Submitted</div>
                    </div>
                  </div>

                  {/* Score Breakdown (no candidate experience) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Technical Skills</h5>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={selectedInterview.feedback.technicalSkills} />
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-['Roboto']">{selectedInterview.feedback.technicalSkills ?? '—'}/5</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Problem Solving</h5>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={selectedInterview.feedback.problemSolving} />
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-['Roboto']">{selectedInterview.feedback.problemSolving ?? '—'}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths / Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Strengths</h5>
                      {strengthsList.length > 0 ? (
                        <ul className="space-y-1">
                          {strengthsList.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] flex items-start">
                              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">No strengths provided.</p>
                      )}
                    </div>
                    {/* Areas of Concern (Weaknesses) */}
                    {weaknessesList.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Areas of Concern</h5>
                        <ul className="space-y-1">
                          {weaknessesList.map((concern, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] flex items-start">
                              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Comments at bottom */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Comments</h5>
                    <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">{selectedInterview.feedback.additionalNotes || '—'}</p>
                  </div>
                </div>
              )}

              {/* AI Analysis action and result via shared component (compact variant) */}
              <AIInterviewFeedbackSummary
                data={aiData}
                loading={aiLoading}
                cached={aiCached}
                error={aiError}
                onAnalyze={async () => {
                  if (!selectedInterview?.applicationId) return;
                  setAiError(null); setAiLoading(true);
                  try {
                    const res = await makeJsonRequest(`/api/hr/applications/${selectedInterview.applicationId}/ai-feedback-analysis`, { method: 'POST' });
                    if (res?.success) { setAiData(res.data); setAiCached(!!res.cached); }
                    else { setAiError(res?.message || 'Failed to analyze'); }
                  } catch (e) {
                    setAiError(e.message || 'Error running AI analysis');
                  } finally { setAiLoading(false); }
                }}
                variant="compact"
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                {selectedInterview.status === 'Completed' && selectedInterview.feedback && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (window.confirm('Proceed to extend an offer to this candidate?')) makeDecision('hire'); }}
                      disabled={decisionSubmitting}
                      className={`px-6 py-2 rounded-lg font-medium font-['Roboto'] text-white dark:text-black ${decisionSubmitting ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'}`}
                    >
                      {decisionSubmitting ? 'Processing...' : 'Hire (Extend Offer)'}
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Are you sure you want to reject this candidate?')) makeDecision('reject'); }}
                      disabled={decisionSubmitting}
                      className={`px-6 py-2 rounded-lg font-medium font-['Roboto'] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${decisionSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {decisionSubmitting ? 'Processing...' : 'Reject Candidate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black/70 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-2xl shadow-lg rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
                  Schedule New Interview
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
              
              <form className="space-y-4" onSubmit={submitSchedule}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto']">
                      Candidate
                    </label>
                    <div className="relative" ref={candidateResultsRef}>
                      <div className="flex gap-2 mb-1">
                        <select value={candidateJobFilter} onChange={(e)=>{ setCandidateJobFilter(e.target.value); fetchCandidates(candidateSearch.trim()); setShowCandidateList(true); }} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                          <option value="all">All Jobs</option>
                          {jobsForFilter.map(j => <option key={j.id} value={j.id}>{j.title?.slice(0,40)}</option>)}
                        </select>
                        {candidateLoading && <span className="self-center text-xs text-gray-500 dark:text-gray-400 font-['Roboto'] animate-pulse">Loading...</span>}
                      </div>
                      <input
                        type="text"
                        value={candidateSearch}
                        onChange={handleCandidateSearchChange}
                        onFocus={()=>{ if (candidates.length>0) setShowCandidateList(true); }}
                        onKeyDown={handleCandidateKeyDown}
                        placeholder="Search name or email..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      {showCandidateList && (
                        <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg divide-y dark:divide-gray-700" role="listbox">
                          {candidates.length === 0 && !candidateLoading && candidateSearch && (
                            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">No matches</div>
                          )}
                          {candidates.map((c, idx) => {
                            const selected = scheduleForm.applicationId === c.id;
                            const highlighted = idx === candidateHighlight;
                            return (
                              <button
                                type="button"
                                key={c.id}
                                onClick={()=>selectCandidate(c)}
                                className={`w-full text-left px-3 py-2 text-sm font-['Roboto'] flex flex-col transition-colors ${highlighted ? 'bg-black dark:bg-white text-white dark:text-black' : selected ? 'bg-gray-100 dark:bg-gray-700/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                role="option"
                                aria-selected={selected}
                              >
                                <span className="font-medium truncate">{c.name}</span>
                                <span className={`text-xs ${highlighted ? 'text-gray-200 dark:text-gray-800' : 'text-gray-500 dark:text-gray-400'}`}>{c.email} • {c.jobTitle}</span>
                              </button>
                            );
                          })}
                          {candidateLoading && <div className="p-2 text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">Loading...</div>}
                        </div>
                      )}
                      {scheduleForm.applicationId && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-['Roboto']">Selected application ID: {scheduleForm.applicationId}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Interviewer</label>
                    <select value={scheduleForm.interviewerId} onChange={e=>setScheduleForm(f=>({...f, interviewerId:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                      <option value="">Select interviewer...</option>
                      {interviewers.map(interviewer => (
                        <option key={interviewer.id} value={interviewer.id}>{interviewer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Date</label>
                    <input type="date" min={new Date().toISOString().slice(0,10)} value={scheduleForm.date} onChange={e=>setScheduleForm(f=>({...f, date:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Time</label>
                    <div className="flex gap-2">
                      <input type="time" value={scheduleForm.time} onChange={e=>setScheduleForm(f=>({...f, time:e.target.value}))} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700" />
                      <button type="button" onClick={loadAvailableSlots} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg font-['Roboto'] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40" disabled={!scheduleForm.interviewerId || !scheduleForm.date || slotState.loading}>
                        {slotState.loading ? 'Loading...' : 'Slots'}
                      </button>
                    </div>
                    {slotState.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-['Roboto']">{slotState.error}</p>}
                    {slotState.slots.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                        {slotState.slots.slice(0,30).map(s => (
                          <button type="button" key={s.startTime} onClick={()=>setScheduleForm(f=>({...f, time:s.startTime}))} className={`px-2 py-1 rounded text-xs border ${scheduleForm.time===s.startTime? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>{s.startTime}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Duration (minutes)</label>
                    <select value={scheduleForm.duration} onChange={e=>setScheduleForm(f=>({...f, duration:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Interview Type</label>
                    <select value={scheduleForm.type} onChange={e=>setScheduleForm(f=>({...f, type:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                      <option value="phone">Phone</option>
                      <option value="video">Video</option>
                      <option value="in-person">In-Person</option>
                      <option value="panel">Panel</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Location</label>
                  <input type="text" value={scheduleForm.location} onChange={e=>setScheduleForm(f=>({...f, location:e.target.value}))} placeholder="Conference Room A or Virtual Meeting" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Notes</label>
                  <textarea rows={3} value={scheduleForm.notes} onChange={e=>setScheduleForm(f=>({...f, notes:e.target.value}))} placeholder="Interview focus areas, special instructions..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500" />
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
                    disabled={submitting || !isScheduleValid}
                    className={`px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors text-white dark:text-black ${(!isScheduleValid || submitting) ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'}`}
                  >
                    {submitting ? 'Scheduling...' : isScheduleValid ? 'Schedule Interview' : 'Fill Required Fields'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal.open && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black/70 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-md shadow-lg rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Reschedule Interview</h3>
              <button onClick={()=>setRescheduleModal({ open:false, id:null, date:'', time:'', duration:'', reason:'' })} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={submitReschedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-['Roboto']">Date</label>
                <input type="date" min={new Date().toISOString().slice(0,10)} value={rescheduleModal.date} onChange={e=>setRescheduleModal(m=>({...m, date:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-['Roboto']">Time</label>
                <input type="time" value={rescheduleModal.time} onChange={e=>setRescheduleModal(m=>({...m, time:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-['Roboto']">Duration (minutes)</label>
                <select value={rescheduleModal.duration} onChange={e=>setRescheduleModal(m=>({...m, duration:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white dark:bg-gray-700">
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                  <option value="90">90</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-['Roboto']">Reason</label>
                <input type="text" value={rescheduleModal.reason || ''} onChange={e=>setRescheduleModal(m=>({...m, reason:e.target.value}))} placeholder="(Optional) reason for reschedule" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setRescheduleModal({ open:false, id:null, date:'', time:'', duration:'', reason:'' })} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting || !isRescheduleValid} className={`px-5 py-2 rounded font-medium font-['Roboto'] text-white dark:text-black ${(!isRescheduleValid || submitting) ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'}`}>{submitting? 'Saving...' : isRescheduleValid ? 'Save Changes' : 'Fill Required'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HRLayout>
  );
};

export default HRInterviewManagement;

// Small helper to render 1–5 stars
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