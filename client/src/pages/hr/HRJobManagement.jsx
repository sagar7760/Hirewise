import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';
import { useApiRequest } from '../../hooks/useApiRequest';
import { SkeletonTable } from '../../components/common/Skeleton';

const HRJobManagement = () => {
  const { makeJsonRequest } = useApiRequest();
  const navigate = useNavigate();
  
  // State management
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState(''); // Immediate input value
  const [searchTerm, setSearchTerm] = useState(''); // Debounced search term for API
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, job: null });
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [limit] = useState(10);
  
  // Summary statistics
  const [summary, setSummary] = useState({
    totalJobs: 0,
    totalActive: 0,
    totalDraft: 0,
    totalInactive: 0,
    totalClosed: 0,
    myJobs: 0,
    totalApplicants: 0
  });

  // Fetch jobs from backend
  const fetchJobs = async (page = 1, search = '', statusFilter = '', filterType = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(filterType && { filter: filterType })
      });
      
      const response = await makeJsonRequest(`/api/hr/jobs?${params}`);
      
      if (response.success) {
        // The API returns jobs directly in response.data, not response.data.jobs
        const jobsData = response.data || [];
        setJobs(jobsData);
        setFilteredJobs(jobsData);
        setCurrentPage(response.pagination?.currentPage || 1);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalJobs(response.pagination?.totalJobs || 0);
        setSummary(response.summary || summary);
      } else {
        setError(response.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect with improved UX
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        setIsSearching(true);
      }
    }, 300); // Reduced to 300ms for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchTerm]);

  // Reset searching state when search term changes and request completes
  useEffect(() => {
    if (!loading && isSearching) {
      const timer = setTimeout(() => {
        setIsSearching(false);
        // Focus back to search input if it exists
        if (searchInputRef && document.activeElement !== searchInputRef) {
          // Only focus if user isn't actively typing
          if (searchInput === searchTerm) {
            searchInputRef.focus();
            searchInputRef.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, isSearching, searchInputRef]);

  // Keyboard shortcut to focus search (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !showJobModal && !deleteConfirmModal.show) {
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
  }, [searchInputRef, showJobModal, deleteConfirmModal.show]);

  // Initial load
  useEffect(() => {
    const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
    const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
    
    fetchJobs(1, searchTerm, statusFilter, filterType);
    setCurrentPage(1);
    setInitialLoad(false);
  }, []);

  // Combined effect for filter/search changes (but not on initial load)
  useEffect(() => {
    if (!initialLoad) {
      const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
      const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
      
      fetchJobs(1, searchTerm, statusFilter, filterType);
      setCurrentPage(1);
    }
  }, [filter, searchTerm, initialLoad]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (deleteConfirmModal.show) {
          setDeleteConfirmModal({ show: false, job: null });
        }
        if (showJobModal) {
          setShowJobModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [deleteConfirmModal.show, showJobModal]);

  // Handle pagination
  const handlePageChange = (page) => {
    const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
    const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
    
    fetchJobs(page, searchTerm, statusFilter, filterType);
  };

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'inactive':
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300';
      case 'closed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300';
    }
  };

  const handleJobAction = async (action, jobId) => {
    try {
      switch (action) {
        case 'view':
          const job = jobs.find(j => j.id === jobId);
          setSelectedJob(job);
          setShowJobModal(true);
          break;
          
        case 'edit':
          // Navigate to edit job page
          navigate(`/hr/jobs/${jobId}/edit`);
          break;
          
        case 'applications':
          // Navigate to application management page with job filter
          // Corrected route path to match defined route in App.jsx (/hr/applications)
          navigate(`/hr/applications?jobId=${jobId}`);
          break;
      }
    } catch (error) {
      console.error('Job action error:', error);
      setError(error.message || 'Action failed');
    }
  };

  // Handle job deletion
  const handleDeleteJob = async (jobId) => {
    try {
      setLoading(true);
      const deleteResponse = await makeJsonRequest(`/api/hr/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.success) {
        // Close modal
        setDeleteConfirmModal({ show: false, job: null });
        
        // Refresh jobs list
        const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
        const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
        fetchJobs(currentPage, searchTerm, statusFilter, filterType);
      } else {
        setError(deleteResponse.message || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                Job Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Create, edit, and manage job postings
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/hr/jobs/create"
                className="inline-flex items-center px-6 py-3 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-medium font-['Roboto'] transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Job
              </Link>
            </div>
          </div>
          
          {/* Summary Statistics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {loading ? (
              // Skeleton loading for summary cards
              Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                </div>
              ))
            ) : (
              <>
                {/* Total Jobs */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">Total Jobs</div>
                  <div className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{summary.totalJobs}</div>
                </div>
                {/* Active */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">Active</div>
                  <div className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{summary.totalActive}</div>
                </div>
                {/* Draft */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">Draft</div>
                  <div className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{summary.totalDraft}</div>
                </div>
                {/* Closed */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">Closed</div>
                  <div className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{summary.totalClosed}</div>
                </div>
                {/* Archived (Inactive) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">Archived</div>
                  <div className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{summary.totalInactive}</div>
                </div>
                {/* My Jobs */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">My Jobs</div>
                  <div className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{summary.myJobs}</div>
                </div>
                {/* Total Applicants */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">Total Applicants</div>
                  <div className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{summary.totalApplicants}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 transition-colors duration-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 font-['Roboto']">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400 font-['Roboto']">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
                      const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
                      fetchJobs(currentPage, searchTerm, statusFilter, filterType);
                    }}
                    className="text-sm bg-red-100 dark:bg-red-700 text-red-800 dark:text-white px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6 transition-colors duration-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={setSearchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                  }}
                  onFocus={(e) => {
                    if (e.target.value && !e.target.selectionStart) {
                      e.target.select();
                    }
                  }}
                  className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors disabled:opacity-50"
                  placeholder="Search jobs by title, department... (Ctrl+F to focus)"
                  disabled={false}
                  autoComplete="off"
                />
                {/* Loading/Typing Indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {searchInput !== searchTerm && searchInput.length > 0 ? (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 dark:border-gray-300 mr-1"></div>
                      <span className="font-medium">Typing...</span>
                    </div>
                  ) : isSearching ? (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 dark:border-gray-300 mr-1"></div>
                      <span className="font-medium">Searching...</span>
                    </div>
                  ): null}
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'all' 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                All Jobs
              </button>
              <button
                onClick={() => setFilter('my-jobs')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'my-jobs' 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                My Jobs
              </button>
              <button
                onClick={() => setFilter('active')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'active' 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('draft')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'draft' 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <SkeletonTable rows={10} columns={7} />
        )}

        {/* Jobs Table */}
        {!loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Job Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Applicants
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Posted Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div>
                          <Link
                            // Corrected route path
                            to={`/hr/applications?jobId=${job.id}`}
                            className="text-sm font-medium text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-['Open_Sans'] transition-colors cursor-pointer"
                          >
                            {job.title}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{job.salary}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-['Roboto']">by {job.postedByName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">{job.department}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{job.jobType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">{job.applicants}</div>
                            {job.recentApplications > 0 && (
                              <div className="text-xs text-green-700 dark:text-green-400 font-['Roboto']">
                                +{job.recentApplications} this week
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                          {new Date(job.postedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                          {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleJobAction('view', job.id)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {job.createdBy === 'me' && job.status.toLowerCase() !== 'inactive' && (
                            <button
                              onClick={() => handleJobAction('edit', job.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                              title="Edit Job"
                            >
                              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {job.applicants > 0 && (
                            <button
                              onClick={() => handleJobAction('applications', job.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                              title="View Applications"
                            >
                              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                           {/* Delete button (only show if few or no applications, otherwise prompt to close) */}
                          <button
                            onClick={() => setDeleteConfirmModal({ show: true, job })}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                            title="Delete Job"
                          >
                             <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 transition-colors duration-300">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">
                      Showing <span className="font-medium">{((currentPage - 1) * limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * limit, totalJobs)}
                      </span> of{' '}
                      <span className="font-medium">{totalJobs}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Page Numbers - simplified display for brevity */}
                      <button
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Page {currentPage}
                      </button>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
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

        {!loading && filteredJobs.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                {searchInput || filter !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by creating a new job posting.'
                }
              </p>
              <div className="mt-6">
                <Link
                  to="/hr/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 dark:text-black transition-colors"
                >
                  <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Job
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        {showJobModal && selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black/70 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
            <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-xl rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
              {/* Modal Content - Needs full dark mode optimization, similar to AdminProfile modal */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
                    {selectedJob.title}
                  </h3>
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Job Detail Lines */}
                  {[
                    { title: 'Department', value: selectedJob.department },
                    { title: 'Job Type', value: selectedJob.jobType },
                    { title: 'Location', value: `${selectedJob.location} (${selectedJob.locationType})` },
                    { title: 'Salary Range', value: selectedJob.salary },
                    { title: 'Status', value: (<span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedJob.status)}`}>{selectedJob.status}</span>) },
                    { title: 'Applicants', value: `${selectedJob.applicants} total` },
                    { title: 'Posted By', value: selectedJob.postedByName },
                    { title: 'Views', value: selectedJob.views || 0 },
                    { title: 'Experience Level', value: selectedJob.experienceLevel },
                    { title: 'Deadline', value: new Date(selectedJob.applicationDeadline).toLocaleDateString() },
                  ].map(detail => (
                    <div key={detail.title}>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-1">{detail.title}</h4>
                      <p className="text-gray-900 dark:text-white font-['Roboto']">{detail.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-2">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300 font-['Roboto'] whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  {selectedJob.applicants > 0 && (
                    <Link
                      to={`/hr/applications?jobId=${selectedJob.id}`}
                      className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                    >
                      View Applications ({selectedJob.applicants})
                    </Link>
                  )}
                  {selectedJob.createdBy === 'me' && selectedJob.status.toLowerCase() !== 'inactive' && (
                    <Link
                      to={`/hr/jobs/${selectedJob.id}/edit`}
                      className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                    >
                      Edit Job
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmModal.show && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 transition-colors duration-300"
            onClick={() => setDeleteConfirmModal({ show: false, job: null })}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl dark:border dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                    Delete Job Posting
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] mb-2">
                  Are you sure you want to permanently delete this job posting?
                </p>
                {deleteConfirmModal.job && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white font-['Roboto']">
                      {deleteConfirmModal.job.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-['Roboto']">
                      {deleteConfirmModal.job.department} • {deleteConfirmModal.job.jobType}
                    </p>
                    {deleteConfirmModal.job.applicants > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400 font-['Roboto'] mt-2 bg-red-50 dark:bg-red-900/30 p-2 rounded">
                        ⚠️ This job has {deleteConfirmModal.job.applicants} application(s). Jobs with applications cannot be deleted for data integrity. Consider closing the job instead.
                      </p>
                    )}
                  </div>
                )}
                <p className="text-sm text-red-600 dark:text-red-400 font-['Roboto'] mt-3">
                  <strong>This action cannot be undone.</strong> All associated data will be permanently removed.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmModal({ show: false, job: null })}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {deleteConfirmModal.job && deleteConfirmModal.job.applicants > 0 ? (
                  <button
                    onClick={() => {
                      // Placeholder for actual close job logic
                      handleJobAction('close', deleteConfirmModal.job.id);
                      setDeleteConfirmModal({ show: false, job: null });
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50"
                  >
                    Close Job Instead
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeleteJob(deleteConfirmModal.job.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50 disabled:bg-red-300 dark:disabled:bg-red-900"
                  >
                    {loading ? 'Deleting...' : 'Delete Job'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
};

export default HRJobManagement;