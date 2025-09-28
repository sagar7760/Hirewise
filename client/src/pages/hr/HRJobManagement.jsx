import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';
import { useApiRequest } from '../../hooks/useApiRequest';

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
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, job: null });
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [jobApplications, setJobApplications] = useState({});
  const [loadingApplications, setLoadingApplications] = useState({});
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
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(filterType === 'my-jobs' && { filter: 'my-jobs' }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const response = await makeJsonRequest(`/api/hr/jobs?${queryParams}`);
      
      if (response.success) {
        setJobs(response.data);
        setFilteredJobs(response.data);
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
        setTotalJobs(response.pagination.totalJobs);
        setSummary(response.summary);
      } else {
        setError(response.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

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
      
      // Only trigger search state if search term changed
      if (searchTerm !== searchInput && searchTerm) {
        setIsSearching(true);
      }
      
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
        if (openDropdownId) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [deleteConfirmModal.show, showJobModal, openDropdownId]);

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
        return 'bg-black text-white';
      case 'draft':
        return 'bg-gray-700 text-white';
      case 'inactive':
      case 'archived':
      case 'closed':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleJobAction = async (action, jobId) => {
    // Close dropdown when action is performed
    setOpenDropdownId(null);
    
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
          
        case 'archive':
          const archiveResponse = await makeJsonRequest(`/api/hr/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'inactive' })
          });
          
          if (archiveResponse.success) {
            // Refresh jobs list
            const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
            const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
            fetchJobs(currentPage, searchTerm, statusFilter, filterType);
          } else {
            setError(archiveResponse.message || 'Failed to archive job');
          }
          break;
          
        case 'publish':
          const publishResponse = await makeJsonRequest(`/api/hr/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
          });
          
          if (publishResponse.success) {
            // Refresh jobs list
            const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
            const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
            fetchJobs(currentPage, searchTerm, statusFilter, filterType);
          } else {
            setError(publishResponse.message || 'Failed to publish job');
          }
          break;
          
        case 'activate':
          const activateResponse = await makeJsonRequest(`/api/hr/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
          });
          
          if (activateResponse.success) {
            // Refresh jobs list
            const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
            const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
            fetchJobs(currentPage, searchTerm, statusFilter, filterType);
          } else {
            setError(activateResponse.message || 'Failed to activate job');
          }
          break;
          
        case 'close':
          const closeResponse = await makeJsonRequest(`/api/hr/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed' })
          });
          
          if (closeResponse.success) {
            // Refresh jobs list
            const statusFilter = filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '';
            const filterType = filter === 'my-jobs' ? 'my-jobs' : '';
            fetchJobs(currentPage, searchTerm, statusFilter, filterType);
          } else {
            setError(closeResponse.message || 'Failed to close job');
          }
          break;
          
        case 'delete':
          const jobToDelete = jobs.find(job => job.id === jobId);
          if (jobToDelete) {
            setDeleteConfirmModal({ show: true, job: jobToDelete });
            setOpenDropdownId(null); // Close dropdown
          }
          break;
          
        case 'applications':
          // Toggle applications view inline
          await toggleJobApplications(jobId);
          break;
      }
    } catch (error) {
      console.error('Job action error:', error);
      setError(error.message || 'Action failed');
    }
  };

  // Toggle dropdown visibility
  const toggleDropdown = (jobId) => {
    setOpenDropdownId(openDropdownId === jobId ? null : jobId);
  };

  // Fetch applications for a specific job
  const fetchJobApplications = async (jobId) => {
    if (jobApplications[jobId]) {
      return; // Already fetched
    }
    
    try {
      setLoadingApplications(prev => ({ ...prev, [jobId]: true }));
      
      const response = await makeJsonRequest(`/api/hr/jobs/${jobId}/applications`);
      
      if (response.success) {
        setJobApplications(prev => ({
          ...prev,
          [jobId]: response.data.applications || response.data || []
        }));
      } else {
        console.error('Failed to fetch applications:', response.message);
        setJobApplications(prev => ({ ...prev, [jobId]: [] }));
      }
    } catch (error) {
      console.error('Error fetching job applications:', error);
      setJobApplications(prev => ({ ...prev, [jobId]: [] }));
    } finally {
      setLoadingApplications(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Toggle job applications view
  const toggleJobApplications = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      await fetchJobApplications(jobId);
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
        
        // Show success message (you could use a toast notification here)
        console.log('Job deleted successfully');
      } else {
        // Show specific error from backend
        if (deleteResponse.message && deleteResponse.message.includes('applications')) {
          // If it's an application-related error, show a more helpful message
          setError(`${deleteResponse.message} You can close the job instead of deleting it.`);
        } else {
          setError(deleteResponse.message || 'Failed to delete job');
        }
        setDeleteConfirmModal({ show: false, job: null });
      }
    } catch (error) {
      console.error('Delete job error:', error);
      setError(error.message || 'Failed to delete job. Please try again.');
      setDeleteConfirmModal({ show: false, job: null });
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                Job Management
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Create, edit, and manage job postings
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/hr/jobs/create"
                className="inline-flex items-center px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium font-['Roboto'] transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Job
              </Link>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-sm text-gray-500 font-['Roboto'] mb-1">Total Jobs</div>
              <div className="text-2xl font-bold text-black font-['Open_Sans']">{summary.totalJobs}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-sm text-gray-500 font-['Roboto'] mb-1">Active</div>
              <div className="text-2xl font-bold text-black font-['Open_Sans']">{summary.totalActive}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-sm text-gray-500 font-['Roboto'] mb-1">Draft</div>
              <div className="text-2xl font-bold text-black font-['Open_Sans']">{summary.totalDraft}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-sm text-gray-500 font-['Roboto'] mb-1">Closed</div>
              <div className="text-2xl font-bold text-black font-['Open_Sans']">{summary.totalClosed}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-sm text-gray-500 font-['Roboto'] mb-1">Archived</div>
              <div className="text-2xl font-bold text-black font-['Open_Sans']">{summary.totalInactive}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-sm text-gray-500 font-['Roboto'] mb-1">My Jobs</div>
              <div className="text-2xl font-bold text-black font-['Open_Sans']">{summary.myJobs}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-sm text-gray-500 font-['Roboto'] mb-1">Total Applicants</div>
              <div className="text-2xl font-bold text-black font-['Open_Sans']">{summary.totalApplicants}</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 font-['Roboto']">Error</h3>
                <div className="mt-2 text-sm text-red-700 font-['Roboto']">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      fetchJobs(currentPage, searchTerm, 
                        filter === 'active' ? 'active' : filter === 'draft' ? 'draft' : '',
                        filter === 'my-jobs' ? 'my-jobs' : ''
                      );
                    }}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 transition-colors disabled:opacity-50"
                  placeholder="Search jobs by title, department... (Ctrl+F to focus)"
                  disabled={false} // Never disable the search input to maintain interactivity
                  autoComplete="off"
                />
                {/* Enhanced search status indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {searchInput !== searchTerm && searchInput.length > 0 ? (
                    <div className="flex items-center text-xs text-gray-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                      <span className="font-medium">Typing...</span>
                    </div>
                  ) : isSearching ? (
                    <div className="flex items-center text-xs text-gray-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                      <span className="font-medium">Searching...</span>
                    </div>
                  ): null}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'all' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                All Jobs
              </button>
              <button
                onClick={() => setFilter('my-jobs')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'my-jobs' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                My Jobs
              </button>
              <button
                onClick={() => setFilter('active')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'active' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('draft')}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'draft' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3 text-gray-600 font-['Roboto']">Loading jobs...</span>
            </div>
          </div>
        )}

        {/* Jobs Table */}
        {!loading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Job Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Applicants
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Posted Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <React.Fragment key={job.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div>
                            <Link
                              to={`/hr/jobs/${job.id}/applications`}
                              className="text-sm font-medium text-black hover:text-blue-800 font-['Open_Sans'] transition-colors cursor-pointer"
                            >
                              {job.title}
                            </Link>
                            <div className="text-xs text-gray-500 font-['Roboto']">{job.salary}</div>
                            <div className="text-xs text-gray-400 font-['Roboto']">by {job.postedByName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-['Roboto']">{job.department}</div>
                          <div className="text-xs text-gray-500 font-['Roboto']">{job.jobType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-sm text-gray-900 font-['Roboto']">{job.applicants}</div>
                              {job.recentApplications > 0 && (
                                <div className="text-xs text-gray-700 font-['Roboto']">
                                  +{job.recentApplications} this week
                                </div>
                              )}
                            </div>
                            {job.applicants > 0 && (
                              <button
                                onClick={() => toggleJobApplications(job.id)}
                                className="text-black hover:text-gray-400 transition-colors"
                                title={expandedJobId === job.id ? "Hide Applications" : "Show Applications"}
                              >
                                <svg 
                                  className={`w-4 h-4 transform transition-transform ${expandedJobId === job.id ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 font-['Roboto']">
                            {new Date(job.postedDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 font-['Roboto']">
                            {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleJobAction('view', job.id)}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {job.createdBy === 'me' && job.status.toLowerCase() !== 'inactive' && (
                              <button
                                onClick={() => handleJobAction('edit', job.id)}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                                title="Edit Job"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            <div className="relative dropdown-container">
                              <button 
                                onClick={() => toggleDropdown(job.id)}
                                className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              {openDropdownId === job.id && (
                                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                {/* View Applications */}
                                {job.applicants > 0 && (
                                  <button
                                    onClick={() => handleJobAction('applications', job.id)}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto'] transition-colors"
                                  >
                                    {expandedJobId === job.id ? 'Hide' : 'Show'} Applications ({job.applicants})
                                  </button>
                                )}
                                
                                {/* Publish for Draft Jobs */}
                                {job.status.toLowerCase() === 'draft' && (
                                  <button
                                    onClick={() => handleJobAction('publish', job.id)}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 font-['Roboto'] transition-colors"
                                  >
                                    Publish Job
                                  </button>
                                )}
                                
                                {/* Archive for Active/Draft Jobs */}
                                {(job.status.toLowerCase() === 'active' || job.status.toLowerCase() === 'draft') && (
                                  <button
                                    onClick={() => handleJobAction('archive', job.id)}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto'] transition-colors"
                                  >
                                    Archive Job
                                  </button>
                                )}

                                {/* Close for Active Jobs */}
                                {job.status.toLowerCase() === 'active' && (
                                  <button
                                    onClick={() => handleJobAction('close', job.id)}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 font-['Roboto'] transition-colors"
                                  >
                                    Close Job
                                  </button>
                                )}
                                
                                
                                
                                {/* Activate for Inactive/Closed Jobs */}
                                {(job.status.toLowerCase() === 'inactive' || job.status.toLowerCase() === 'closed') && (
                                  <button
                                    onClick={() => handleJobAction('activate', job.id)}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 font-['Roboto'] transition-colors"
                                  >
                                    Activate Job
                                  </button>
                                )}
                                
                                {/* Delete Job - Only for jobs with no applications */}
                                {job.applicants === 0 && (
                                  <>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                      onClick={() => handleJobAction('delete', job.id)}
                                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-['Roboto'] transition-colors"
                                    >
                                      Delete Job
                                    </button>
                                  </>
                                )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expandable Applications Section */}
                      {expandedJobId === job.id && (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 bg-gray-50 border-t">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-lg font-medium text-gray-900 font-['Open_Sans']">
                                  Applications for "{job.title}"
                                </h4>
                                <Link
                                  to={`/hr/jobs/${job.id}/applications`}
                                  className="text-sm text-black hover:text-gray-600 font-['Roboto']"
                                >
                                  View Full Page →
                                </Link>
                              </div>
                              
                              {loadingApplications[job.id] ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                  <span className="ml-3 text-gray-600 font-['Roboto']">Loading applications...</span>
                                </div>
                              ) : jobApplications[job.id] && Array.isArray(jobApplications[job.id]) && jobApplications[job.id].length > 0 ? (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Candidate
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Applied Date
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                          </th>
                                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {Array.isArray(jobApplications[job.id]) && jobApplications[job.id].slice(0, 5).map((application, index) => {
                                          // Get candidate name properly
                                          const candidateName = application.applicant 
                                            ? `${application.applicant.firstName || ''} ${application.applicant.lastName || ''}`.trim()
                                            : (application.personalInfo 
                                              ? `${application.personalInfo.firstName || ''} ${application.personalInfo.lastName || ''}`.trim()
                                              : 'Anonymous');
                                          
                                          const candidateEmail = application.applicant?.email || application.personalInfo?.email || 'No email';
                                          
                                          return (
                                          <tr key={application.id || application._id || index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                  <span className="text-xs font-medium text-gray-600">
                                                    {candidateName !== 'Anonymous' ? candidateName.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AN'}
                                                  </span>
                                                </div>
                                                <div className="ml-3">
                                                  <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                                                    {candidateName}
                                                  </div>
                                                  <div className="text-xs text-gray-500 font-['Roboto']">
                                                    {candidateEmail}
                                                  </div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="text-sm text-gray-900 font-['Roboto']">
                                                {new Date(application.createdAt || Date.now()).toLocaleDateString()}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                application.status === 'shortlisted' ? 'bg-gray-800 text-white' :
                                                application.status === 'under_review' ? 'bg-gray-700 text-white' :
                                                application.status === 'rejected' ? 'bg-gray-500 text-white' :
                                                application.status === 'interview_scheduled' ? 'bg-gray-900 text-white' :
                                                'bg-gray-100 text-gray-600'
                                              }`}>
                                                {application.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Submitted'}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                              <div className="flex items-center justify-end space-x-2">
                                                <button
                                                  className="text-gray-600 hover:text-gray-900 transition-colors"
                                                  title="View Details"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                  </svg>
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                  {Array.isArray(jobApplications[job.id]) && jobApplications[job.id].length > 5 && (
                                    <div className="px-4 py-3 bg-gray-50 text-center">
                                      <Link
                                        to={`/hr/jobs/${job.id}/applications`}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-['Roboto']"
                                      >
                                        View all {jobApplications[job.id].length} applications →
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <h5 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No applications yet</h5>
                                  <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                                    Applications for this job will appear here once candidates start applying.
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 font-['Roboto']">
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
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-black border-black text-white'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {!loading && filteredJobs.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                {searchInput || filter !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by creating a new job posting.'
                }
              </p>
              <div className="mt-6">
                <Link
                  to="/hr/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Job
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-xl rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">
                  {selectedJob.title}
                </h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Department</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedJob.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Job Type</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedJob.jobType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Location</h4>
                  <p className="text-gray-900 font-['Roboto']">
                    {selectedJob.location} ({selectedJob.locationType})
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Salary Range</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedJob.salary}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Status</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Applicants</h4>
                  <div>
                    <p className="text-gray-900 font-['Roboto']">{selectedJob.applicants} total</p>
                    {selectedJob.recentApplications > 0 && (
                      <p className="text-sm text-green-600 font-['Roboto']">
                        {selectedJob.recentApplications} new this week
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Posted By</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedJob.postedByName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Views</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedJob.views || 0}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Description</h4>
                <p className="text-gray-900 font-['Roboto'] whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-3">Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requirements.map((req, index) => (
                      <span key={index} className="inline-flex px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-full font-['Roboto'] border border-gray-200">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requiredSkills.map((skill, index) => (
                      <span key={index} className="inline-flex px-3 py-1.5 text-sm bg-blue-50 text-blue-800 rounded-full font-['Roboto'] border border-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.preferredSkills && selectedJob.preferredSkills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-3">Preferred Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.preferredSkills.map((skill, index) => (
                      <span key={index} className="inline-flex px-3 py-1.5 text-sm bg-green-50 text-green-800 rounded-full font-['Roboto'] border border-green-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {selectedJob.qualification && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Qualification</h4>
                    <p className="text-gray-900 font-['Roboto']">{selectedJob.qualification}</p>
                  </div>
                )}
                {selectedJob.experienceLevel && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Experience Level</h4>
                    <p className="text-gray-900 font-['Roboto']">{selectedJob.experienceLevel}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedJob.applicants > 0 && (
                  <Link
                    to={`/hr/jobs/${selectedJob.id}/applications`}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    View Applications ({selectedJob.applicants})
                  </Link>
                )}
                {selectedJob.createdBy === 'me' && selectedJob.status.toLowerCase() !== 'inactive' && (
                  <Link
                    to={`/hr/jobs/${selectedJob.id}/edit`}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setDeleteConfirmModal({ show: false, job: null })}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans']">
                  Delete Job Posting
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 font-['Roboto'] mb-2">
                Are you sure you want to permanently delete this job posting?
              </p>
              {deleteConfirmModal.job && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 font-['Roboto']">
                    {deleteConfirmModal.job.title}
                  </p>
                  <p className="text-sm text-gray-600 font-['Roboto']">
                    {deleteConfirmModal.job.department} • {deleteConfirmModal.job.jobType}
                  </p>
                  {deleteConfirmModal.job.applicants > 0 && (
                    <p className="text-sm text-red-600 font-['Roboto'] mt-2 bg-red-50 p-2 rounded">
                      ⚠️ This job has {deleteConfirmModal.job.applicants} application(s). Jobs with applications cannot be deleted for data integrity. Consider closing the job instead.
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-red-600 font-['Roboto'] mt-3">
                <strong>This action cannot be undone.</strong> All associated data will be permanently removed.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmModal({ show: false, job: null })}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {deleteConfirmModal.job && deleteConfirmModal.job.applicants > 0 ? (
                <button
                  onClick={() => {
                    setDeleteConfirmModal({ show: false, job: null });
                    handleJobAction('close', deleteConfirmModal.job.id);
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50"
                >
                  Close Job Instead
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteJob(deleteConfirmModal.job.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50 disabled:bg-red-300"
                >
                  {loading ? 'Deleting...' : 'Delete Job'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
};

export default HRJobManagement;
