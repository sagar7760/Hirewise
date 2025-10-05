import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useApiRequest } from '../../hooks/useApiRequest';
import { SkeletonTable } from '../../components/common/Skeleton';

const AllJobsPage = () => {
  const { makeJsonRequest } = useApiRequest();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedJob, setSelectedJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHR, setFilterHR] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterJobType, setFilterJobType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [departments, setDepartments] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [openMenuJobId, setOpenMenuJobId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const rootRef = useRef(null);

  const [hrs, setHrs] = useState([]);

  const buildQuery = () => {
    const params = [];
    if (filterStatus !== 'all') params.push(`status=${encodeURIComponent(filterStatus)}`);
    if (filterDepartment !== 'all') params.push(`department=${encodeURIComponent(filterDepartment)}`);
    if (filterJobType !== 'all') params.push(`jobType=${encodeURIComponent(filterJobType)}`);
    if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
    if (fromDate) params.push(`fromDate=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`toDate=${encodeURIComponent(toDate)}`);
    if (sortBy) params.push(`sortBy=${encodeURIComponent(sortBy)}`);
    if (sortOrder) params.push(`sortOrder=${encodeURIComponent(sortOrder)}`);
    params.push(`page=${page}`);
    params.push(`limit=${limit}`);
    return params.length ? `?${params.join('&')}` : '';
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery();
      const data = await makeJsonRequest(`/api/admin/jobs${query}`);
      if (data?.jobs) {
        setJobs(data.jobs);
        setHrs(data.postedBy || []);
        setDepartments(data.departments || []);
        // Ensure remote & hybrid appear in job type filter even if not returned distinctly yet
        let incomingJobTypes = data.jobTypes || [];
        const lower = incomingJobTypes.map(j => (j || '').toLowerCase());
        ['remote','hybrid'].forEach(opt => { if(!lower.includes(opt)) incomingJobTypes.push(opt); });
        setJobTypes(incomingJobTypes);
        if (data.pagination) setPagination(data.pagination);
        // reset selections when data set changes
        setSelectedJobs(new Set());
      }
    } catch (e) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    const handleClick = (e) => {
      if (!openMenuJobId) return;
      if (!e.target.closest('[data-job-actions]')) {
        setOpenMenuJobId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenuJobId]);
  useEffect(() => { setPage(1); }, [filterStatus, filterDepartment, filterJobType, searchTerm, fromDate, toDate, sortBy, sortOrder, limit]);
  useEffect(() => { loadJobs(); /* eslint-disable-next-line */ }, [filterStatus, filterDepartment, filterJobType, searchTerm, fromDate, toDate, sortBy, sortOrder, page, limit]);

  // postedBy filter is client-side only to avoid server roundtrip when just inspecting subset
  const filteredJobs = jobs.filter(job => (filterHR === 'all' || job.postedBy === filterHR));

  const handleJobAction = async (jobId, action) => {
    const newStatus = action === 'close' ? 'closed' : 'active';
    try {
      const response = await makeJsonRequest(`/api/admin/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response?.job) {
        setJobs(jobs.map(j => j.id === jobId ? response.job : j));
      }
    } catch (e) {
      setError(e.message || 'Failed to update job status');
    }
  };

  const updateJobStatusDirect = async (jobId, status) => {
    try {
      const response = await makeJsonRequest(`/api/admin/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response?.job) {
        setJobs(prev => prev.map(j => j.id === jobId ? response.job : j));
      }
    } catch (e) {
      setError(e.message || 'Failed to update job status');
    } finally {
      setOpenMenuJobId(null);
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedJobs.size === 0) return;
    try {
      await makeJsonRequest('/api/admin/jobs/bulk/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: Array.from(selectedJobs), status })
      });
      setJobs(jobs.map(j => selectedJobs.has(j.id) ? { ...j, status } : j));
      setSelectedJobs(new Set());
    } catch (e) {
      setError(e.message || 'Bulk update failed');
    }
  };

  const toggleSelectJob = (jobId) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) setSelectedJobs(new Set());
    else setSelectedJobs(new Set(filteredJobs.map(j => j.id)));
  };

  const openJobDetail = async (job) => {
    setSelectedJob(job); // show immediately
    try {
      const detail = await makeJsonRequest(`/api/admin/jobs/${job.id}`);
      if (detail?.job) setSelectedJob(prev => ({ ...prev, ...detail.job }));
    } catch (_) { /* silent */ }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'closed':
        return 'bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'draft':
        return 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'inactive':
        return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const totalJobs = pagination.totalItems || jobs.length;
  const activeJobs = jobs.filter(job => job.status === 'active').length; // page-scoped
  const totalApplications = jobs.reduce((sum, job) => sum + (job.applications || 0), 0); // page-scoped; could use server totals later
  const totalHired = jobs.reduce((sum, job) => sum + (job.hired || 0), 0); // page-scoped

  return (
    <AdminLayout>
    <div ref={rootRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-2 transition-colors duration-300">
            All Jobs Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
            Monitor all job postings across your organization.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg transition-colors duration-300">{error}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Jobs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg transition-colors duration-300">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{totalJobs}</p>
              </div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg transition-colors duration-300">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{activeJobs}</p>
              </div>
            </div>
          </div>

          {/* Total Applications */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg transition-colors duration-300">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{totalApplications}</p>
              </div>
            </div>
          </div>

          {/* Total Hired */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg transition-colors duration-300">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Roboto']">Total Hired</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{totalHired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters (Reorganized) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mb-6 transition-colors duration-300">
          {/* Top row: search + quick status pills */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e)=> setSearchTerm(e.target.value)}
                placeholder="Search by title, department, or location"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['all','active','closed','draft','inactive'].map(s => (
                <button
                  key={s}
                  onClick={()=> { setFilterStatus(s); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-sm font-['Roboto'] border transition-colors ${filterStatus===s ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={()=> setShowAdvanced(prev=>!prev)}
                className="px-3 py-2 text-sm font-['Roboto'] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
              >
                <svg className={`w-4 h-4 stroke-current ${showAdvanced?'rotate-90':''} transition-transform`} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                {showAdvanced? 'Hide Filters' : 'More Filters'}
              </button>
              <button
                onClick={()=> {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterHR('all');
                  setFilterDepartment('all');
                  setFilterJobType('all');
                  setFromDate('');
                  setToDate('');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                  setPage(1);
                }}
                className="px-3 py-2 text-sm font-['Roboto'] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >Clear</button>
            </div>
          </div>

          {/* Active filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filterDepartment !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-['Roboto']">
                Dept: {filterDepartment}
                <button onClick={()=> setFilterDepartment('all')} className="hover:text-gray-900 dark:hover:text-white">✕</button>
              </span>
            )}
            {filterJobType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-['Roboto']">
                Type: {filterJobType}
                <button onClick={()=> setFilterJobType('all')} className="hover:text-gray-900 dark:hover:text-white">✕</button>
              </span>
            )}
            {filterHR !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-['Roboto']">
                HR: {filterHR}
                <button onClick={()=> setFilterHR('all')} className="hover:text-gray-900 dark:hover:text-white">✕</button>
              </span>
            )}
            {(fromDate || toDate) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-['Roboto']">
                Date: {fromDate || '…'} → {toDate || '…'}
                <button onClick={()=> { setFromDate(''); setToDate(''); }} className="hover:text-gray-900 dark:hover:text-white">✕</button>
              </span>
            )}
            {!(filterDepartment !== 'all' || filterJobType !== 'all' || filterHR !== 'all' || fromDate || toDate) && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">No additional filters applied.</span>
            )}
          </div>

          {/* Advanced filters collapsible */}
          {showAdvanced && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Department</label>
                <select value={filterDepartment} onChange={(e)=> setFilterDepartment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                  <option value="all">All Departments</option>
                  {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Job Type</label>
                <select value={filterJobType} onChange={(e)=> setFilterJobType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                  <option value="all">All Types</option>
                  {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Posted By</label>
                <select value={filterHR} onChange={(e)=> setFilterHR(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                  <option value="all">All HRs</option>
                  {hrs.map(hr => <option key={hr} value={hr}>{hr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">From</label>
                <input type="date" value={fromDate} onChange={(e)=> setFromDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">To</label>
                <input type="date" value={toDate} onChange={(e)=> setToDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Sort</label>
                <select value={`${sortBy}:${sortOrder}`} onChange={(e)=> { const [sb,so] = e.target.value.split(':'); setSortBy(sb); setSortOrder(so);} } className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700">
                  <option value="createdAt:desc">Newest</option>
                  <option value="createdAt:asc">Oldest</option>
                  <option value="title:asc">Title A-Z</option>
                  <option value="title:desc">Title Z-A</option>
                  <option value="applications:desc">Applications High-Low</option>
                  <option value="applications:asc">Applications Low-High</option>
                  <option value="status:asc">Status A-Z</option>
                  <option value="status:desc">Status Z-A</option>
                </select>
              </div>
            </div>
          )}

          {/* Pagination controls (moved inside filter card bottom) */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">Page {pagination.page} of {pagination.totalPages} • {pagination.totalItems} jobs</div>
            <div className="flex items-center space-x-2">
              <button disabled={page <= 1} onClick={()=> setPage(p => Math.max(1, p-1))} className={`px-3 py-1 rounded border text-sm transition-colors ${page <= 1 ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Prev</button>
              <button disabled={page >= pagination.totalPages} onClick={()=> setPage(p => Math.min(pagination.totalPages, p+1))} className={`px-3 py-1 rounded border text-sm transition-colors ${page >= pagination.totalPages ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Next</button>
              <select value={limit} onChange={(e)=> setLimit(parseInt(e.target.value) || 10)} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white dark:bg-gray-700">
                {[10,20,50].map(l => <option key={l} value={l}>{l}/page</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {selectedJobs.size > 0 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm transition-colors duration-300">
              <div className="font-['Roboto'] text-gray-700 dark:text-gray-300">{selectedJobs.size} selected</div>
              <div className="flex gap-2">
                <button onClick={()=> handleBulkAction('active')} className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200">Activate</button>
                <button onClick={()=> handleBulkAction('closed')} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500">Close</button>
                <button onClick={()=> setSelectedJobs(new Set())} className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Clear</button>
              </div>
            </div>
          )}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
              Jobs ({filteredJobs.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <SkeletonTable rows={6} columns={6} />
            ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-3">
                    <input type="checkbox" onChange={toggleSelectAll} checked={filteredJobs.length > 0 && selectedJobs.size === filteredJobs.length} className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Job Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Posted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Posted Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <input type="checkbox" checked={selectedJobs.has(job.id)} onChange={()=> toggleSelectJob(job.id)} className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                          {job.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                          {job.department} • {job.location} • {job.type}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mt-1">
                          {job.salary}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                        {job.postedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-900 dark:text-white">{job.applications} Applied</span>
                          <span className="text-gray-700 dark:text-gray-300">{job.shortlisted} Shortlisted</span>
                          <span className="text-gray-600 dark:text-gray-400">{job.hired} Hired</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] transition-colors duration-300 ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                      {formatDate(job.postedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium overflow-visible">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openJobDetail(job)}
                          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <div className="relative inline-block text-left" data-job-actions>
                          <button
                            onClick={() => setOpenMenuJobId(openMenuJobId === job.id ? null : job.id)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none transition-colors"
                            title="Actions"
                          >
                            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                            </svg>
                          </button>
                          {openMenuJobId === job.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black/10 dark:ring-white/10 z-50 transition-colors duration-300">
                              <div className="py-1 text-sm flex flex-col" role="menu" aria-label="Job actions">
                                <button
                                  disabled={job.status === 'active'}
                                  onClick={() => updateJobStatusDirect(job.id, 'active')}
                                  className={`w-full text-left px-4 py-2 font-['Roboto'] flex items-center gap-2 transition-colors ${job.status==='active' ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                  role="menuitem"
                                >
                                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Publish
                                  {job.status==='active' && <svg className="w-3 h-3 ml-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                </button>
                                <button
                                  disabled={job.status === 'closed'}
                                  onClick={() => updateJobStatusDirect(job.id, 'closed')}
                                  className={`w-full text-left px-4 py-2 font-['Roboto'] flex items-center gap-2 transition-colors ${job.status==='closed' ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                  role="menuitem"
                                >
                                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Close
                                  {job.status==='closed' && <svg className="w-3 h-3 ml-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                </button>
                                <button
                                  disabled={job.status === 'inactive'}
                                  onClick={() => updateJobStatusDirect(job.id, 'inactive')}
                                  className={`w-full text-left px-4 py-2 font-['Roboto'] flex items-center gap-2 transition-colors ${job.status==='inactive' ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                  role="menuitem"
                                >
                                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Archive
                                  {job.status==='inactive' && <svg className="w-3 h-3 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-gray-700/60 dark:bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="relative mt-16 w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 pt-6 pb-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
                    Job Details
                  </h3>
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getStatusColor(selectedJob.status)}`}>{selectedJob.status}</span>
                </div>
                  <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                      {selectedJob.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">
                      {selectedJob.department} • {selectedJob.location}
                    </p>
                  </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 font-['Roboto']">Posted by:</span>
                        <p className="text-gray-900 dark:text-white font-['Roboto']">{selectedJob.postedBy}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 font-['Roboto']">Type:</span>
                        <p className="text-gray-900 dark:text-white font-['Roboto']">{selectedJob.type}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300 font-['Roboto']">Salary:</span>
                        <p className="text-gray-900 dark:text-white font-['Roboto'] mt-0.5">{selectedJob.salary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Application Statistics</h5>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-800 dark:text-white font-['Open_Sans']">{selectedJob.applicationStats?.total ?? selectedJob.applications}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-['Roboto']">Applied</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 font-['Open_Sans']">{selectedJob.applicationStats?.shortlisted ?? selectedJob.shortlisted}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-['Roboto']">Shortlisted</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 font-['Open_Sans']">{selectedJob.applicationStats?.hired ?? selectedJob.hired}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-['Roboto']">Hired</p>
                        </div>
                      </div>
                    </div>
                    {selectedJob.applicationStats?.byStatus && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-['Roboto'] grid grid-cols-2 gap-2">
                        {Object.entries(selectedJob.applicationStats.byStatus).map(([k,v]) => (
                          <div key={k} className="flex justify-between"><span>{k}</span><span className="font-medium text-gray-800 dark:text-gray-200">{v}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Extended Details */}
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-8">
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-['Roboto'] tracking-wide">Core Details</h5>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-['Roboto']">
                      <div><dt className="text-gray-500 dark:text-gray-400">Experience</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.experienceLevel || '—'}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Location Type</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.locationType || '—'}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Deadline</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : '—'}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Max Applicants</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.maxApplicants || '—'}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Views</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.views ?? '—'}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Created</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : '—'}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Published</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.publishedAt ? new Date(selectedJob.publishedAt).toLocaleDateString() : '—'}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Resume Required</dt><dd className="text-gray-900 dark:text-white font-medium">{selectedJob.resumeRequired ? 'Yes' : 'No'}</dd></div>
                    </dl>
                  </div>
                  {selectedJob.qualification?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-['Roboto'] mb-2">Qualifications</h5>
                      <ul className="flex flex-wrap gap-2 text-xs font-['Roboto']">{selectedJob.qualification.map(q => <li key={q} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">{q}</li>)}</ul>
                    </div>
                  )}
                  {(selectedJob.requiredSkills?.length > 0 || selectedJob.preferredSkills?.length > 0) && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedJob.requiredSkills?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-['Roboto'] mb-2">Required Skills</h5>
                          <ul className="flex flex-wrap gap-2 text-xs font-['Roboto']">{selectedJob.requiredSkills.map(s => <li key={s} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">{s}</li>)}</ul>
                        </div>
                      )}
                      {selectedJob.preferredSkills?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-['Roboto'] mb-2">Preferred Skills</h5>
                          <ul className="flex flex-wrap gap-2 text-xs font-['Roboto']">{selectedJob.preferredSkills.map(s => <li key={s} className="px-2 py-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded">{s}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedJob.defaultInterviewRounds?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-['Roboto'] mb-2">Interview Rounds</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">{selectedJob.defaultInterviewRounds.map((r,i) => <li key={i}>{r}</li>)}</ol>
                    </div>
                  )}
                  {selectedJob.description && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-['Roboto'] mb-2">Description</h5>
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-['Roboto'] whitespace-pre-line max-h-60 overflow-y-auto pr-1">{selectedJob.description}</p>
                    </div>
                  )}
                  {selectedJob.salaryRange && (selectedJob.salaryRange.min || selectedJob.salaryRange.max) && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-['Roboto'] mb-2">Salary Details</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">{selectedJob.salaryRange.min ? selectedJob.salaryRange.min : ''}{selectedJob.salaryRange.min && selectedJob.salaryRange.max ? ' - ' : ''}{selectedJob.salaryRange.max ? selectedJob.salaryRange.max : ''}{selectedJob.salaryRange.currency ? ` ${selectedJob.salaryRange.currency}` : ''}{selectedJob.salaryRange.period ? ` / ${selectedJob.salaryRange.period}` : ''}{selectedJob.salaryRange.format ? ` (${selectedJob.salaryRange.format})` : ''}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setSelectedJob(null)} className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-['Roboto'] hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AllJobsPage;