import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const JobsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    workType: '', // Remote, Hybrid, On-site
    jobType: '', // Full-time, Part-time, Contract, Internship
    location: '',
    country: '',
    experience: '', // Entry, Mid, Senior
    salary: '', // Salary range
    company: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Mock jobs data with more diverse properties
  const [jobs] = useState([
    {
      id: 1,
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      postedDate: '30+ days ago',
      location: 'San Francisco, CA',
      country: 'United States',
      workType: 'Remote',
      jobType: 'Full-time',
      experience: 'Senior',
      salary: '$120k-180k'
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'Innovate Systems',
      postedDate: '25 days ago',
      location: 'New York, NY',
      country: 'United States',
      workType: 'Hybrid',
      jobType: 'Full-time',
      experience: 'Mid',
      salary: '$100k-150k'
    },
    {
      id: 3,
      title: 'Data Scientist',
      company: 'Global Dynamics',
      postedDate: '20 days ago',
      location: 'Austin, TX',
      country: 'United States',
      workType: 'Remote',
      jobType: 'Full-time',
      experience: 'Mid',
      salary: '$90k-140k'
    },
    {
      id: 4,
      title: 'UX/UI Designer',
      company: 'Future Tech Corp.',
      postedDate: '15 days ago',
      location: 'Seattle, WA',
      country: 'United States',
      workType: 'On-site',
      jobType: 'Full-time',
      experience: 'Mid',
      salary: '$80k-120k'
    },
    {
      id: 5,
      title: 'Marketing Specialist',
      company: 'Digital Edge Solutions',
      postedDate: '12 days ago',
      location: 'Los Angeles, CA',
      country: 'United States',
      workType: 'Remote',
      jobType: 'Part-time',
      experience: 'Entry',
      salary: '$50k-70k'
    },
    {
      id: 6,
      title: 'Business Analyst',
      company: 'Advanced Analytics Group',
      postedDate: '10 days ago',
      location: 'Chicago, IL',
      country: 'United States',
      workType: 'Hybrid',
      jobType: 'Full-time',
      experience: 'Mid',
      salary: '$85k-125k'
    },
    {
      id: 7,
      title: 'Content Writer',
      company: 'Creative Minds Agency',
      postedDate: '8 days ago',
      location: 'Boston, MA',
      country: 'United States',
      workType: 'Remote',
      jobType: 'Contract',
      experience: 'Entry',
      salary: '$40k-60k'
    },
    {
      id: 8,
      title: 'Project Coordinator',
      company: 'Strategic Innovations LLC',
      postedDate: '5 days ago',
      location: 'Denver, CO',
      country: 'United States',
      workType: 'On-site',
      jobType: 'Full-time',
      experience: 'Entry',
      salary: '$60k-80k'
    },
    {
      id: 9,
      title: 'IT Support Specialist',
      company: 'NextGen Solutions',
      postedDate: '3 days ago',
      location: 'Phoenix, AZ',
      country: 'United States',
      workType: 'Hybrid',
      jobType: 'Full-time',
      experience: 'Entry',
      salary: '$55k-75k'
    },
    {
      id: 10,
      title: 'Sales Representative',
      company: 'Dynamic Growth Partners',
      postedDate: '1 day ago',
      location: 'Miami, FL',
      country: 'United States',
      workType: 'Remote',
      jobType: 'Full-time',
      experience: 'Mid',
      salary: '$70k-100k'
    }
  ]);

  const totalJobs = 1234;
  const totalPages = 5;

  // Filter the jobs based on current filters
  const filteredJobs = jobs.filter(job => {
    // Search term filter
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !job.company.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Work type filter (single selection)
    if (filters.workType && job.workType !== filters.workType) {
      return false;
    }

    // Job type filter (single selection)
    if (filters.jobType && job.jobType !== filters.jobType) {
      return false;
    }

    // Location filter
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    // Country filter
    if (filters.country && job.country !== filters.country) {
      return false;
    }

    // Experience level filter
    if (filters.experience && job.experience !== filters.experience) {
      return false;
    }

    // Company filter
    if (filters.company && !job.company.toLowerCase().includes(filters.company.toLowerCase())) {
      return false;
    }

    return true;
  });

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleApply = (e, jobId) => {
    e.stopPropagation();
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSingleSelectFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      workType: '',
      jobType: '',
      location: '',
      country: '',
      experience: '',
      salary: '',
      company: ''
    });
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.workType) count++;
    if (filters.jobType) count++;
    if (filters.location) count++;
    if (filters.country) count++;
    if (filters.experience) count++;
    if (filters.company) count++;
    return count;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-6">
            Jobs in the United States
          </h1>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search jobs"
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
              {/* Work Type Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Work Type
                </label>
                <select
                  value={filters.workType}
                  onChange={(e) => handleSingleSelectFilter('workType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">Any Work Type</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              {/* Job Type Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Job Type
                </label>
                <select
                  value={filters.jobType}
                  onChange={(e) => handleSingleSelectFilter('jobType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">Any Job Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Experience Level Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Experience Level
                </label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleSingleSelectFilter('experience', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">Any Experience</option>
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                </select>
              </div>


              {/* Country Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => handleSingleSelectFilter('country', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">All Countries</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
                  {/* Location Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter city or state"
                  value={filters.location}
                  onChange={(e) => handleSingleSelectFilter('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white placeholder-gray-400"
                />
              </div>

              {/* Company Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={filters.company}
                  onChange={(e) => handleSingleSelectFilter('company', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 font-['Roboto'] underline"
                  >
                    Clear all filters ({getActiveFilterCount()})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Count */}
          <div className="mb-6">
            <p className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
              {filteredJobs.length.toLocaleString()} jobs
              {filteredJobs.length !== jobs.length && (
                <span className="text-gray-500 text-base font-normal">
                  {' '}(filtered from {jobs.length} total)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4 mb-8">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job.id)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
                      {job.title}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 font-['Roboto']">
                        Posted {job.postedDate}
                      </p>
                      <p className="text-sm text-gray-600 font-['Roboto']">
                        {job.company} • {job.location} • {job.workType}
                      </p>
                      <p className="text-sm text-gray-600 font-['Roboto']">
                        {job.jobType} • {job.experience} Level • {job.salary}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleApply(e, job.id)}
                    className="ml-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 font-['Roboto'] mb-4">
                Try adjusting your search criteria or filters to find more jobs.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md transition-colors ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors font-['Roboto'] ${
                  currentPage === page
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md transition-colors ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobsPage;
