import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';

const HRJobManagement = () => {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      status: 'Active',
      applicants: 45,
      postedDate: '2025-09-01',
      deadline: '2025-09-30',
      createdBy: 'me',
      description: 'Looking for an experienced frontend developer...',
      requirements: ['React', 'TypeScript', 'CSS'],
      salary: '$80,000 - $120,000'
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      status: 'Active',
      applicants: 32,
      postedDate: '2025-09-03',
      deadline: '2025-10-03',
      createdBy: 'other',
      description: 'Seeking a strategic product manager...',
      requirements: ['Product Strategy', 'Analytics', 'Leadership'],
      salary: '$90,000 - $130,000'
    },
    {
      id: 3,
      title: 'UX Designer',
      department: 'Design',
      status: 'Draft',
      applicants: 0,
      postedDate: '2025-09-05',
      deadline: '2025-10-05',
      createdBy: 'me',
      description: 'Creative UX designer needed...',
      requirements: ['Figma', 'User Research', 'Prototyping'],
      salary: '$70,000 - $100,000'
    },
    {
      id: 4,
      title: 'Data Scientist',
      department: 'Analytics',
      status: 'Active',
      applicants: 28,
      postedDate: '2025-09-06',
      deadline: '2025-10-06',
      createdBy: 'other',
      description: 'Data scientist for advanced analytics...',
      requirements: ['Python', 'Machine Learning', 'SQL'],
      salary: '$85,000 - $125,000'
    },
    {
      id: 5,
      title: 'DevOps Engineer',
      department: 'Engineering',
      status: 'Archived',
      applicants: 67,
      postedDate: '2025-08-15',
      deadline: '2025-09-15',
      createdBy: 'me',
      description: 'DevOps engineer for infrastructure...',
      requirements: ['AWS', 'Docker', 'Kubernetes'],
      salary: '$75,000 - $110,000'
    }
  ]);

  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    let filtered = jobs;

    // Apply filter
    if (filter === 'my-jobs') {
      filtered = filtered.filter(job => job.createdBy === 'me');
    } else if (filter === 'active') {
      filtered = filtered.filter(job => job.status === 'Active');
    } else if (filter === 'draft') {
      filtered = filtered.filter(job => job.status === 'Draft');
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, filter, searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-gray-200 text-gray-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-600';
      case 'Archived':
        return 'bg-gray-800 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleJobAction = (action, jobId) => {
    switch (action) {
      case 'view':
        const job = jobs.find(j => j.id === jobId);
        setSelectedJob(job);
        setShowJobModal(true);
        break;
      case 'edit':
        // Navigate to edit job page
        console.log('Edit job:', jobId);
        break;
      case 'archive':
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status: 'Archived' } : job
        ));
        break;
      case 'publish':
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status: 'Active' } : job
        ));
        break;
      case 'duplicate':
        const jobToDuplicate = jobs.find(j => j.id === jobId);
        const newJob = {
          ...jobToDuplicate,
          id: Date.now(),
          title: `${jobToDuplicate.title} (Copy)`,
          status: 'Draft',
          applicants: 0,
          postedDate: new Date().toISOString().split('T')[0]
        };
        setJobs([...jobs, newJob]);
        break;
    }
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                Job Management
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Create, edit, and manage job postings
              </p>
            </div>
            <Link
              to="/hr/jobs/create"
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Job
            </Link>
          </div>
        </div>
        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  placeholder="Search jobs..."
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'all' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Jobs
              </button>
              <button
                onClick={() => setFilter('my-jobs')}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'my-jobs' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Jobs
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'active' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  filter === 'draft' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Applicants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Posted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">{job.title}</div>
                        <div className="text-xs text-gray-500 font-['Roboto']">{job.salary}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-['Roboto']">{job.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-['Roboto']">{job.applicants}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-['Roboto']">
                        {new Date(job.postedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-['Roboto']">
                        {new Date(job.deadline).toLocaleDateString()}
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
                        {job.createdBy === 'me' && job.status !== 'Archived' && (
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
                        <div className="relative group">
                          <button className="text-gray-600 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            {job.status === 'Draft' && (
                              <button
                                onClick={() => handleJobAction('publish', job.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto']"
                              >
                                Publish Job
                              </button>
                            )}
                            <button
                              onClick={() => handleJobAction('duplicate', job.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto']"
                            >
                              Duplicate Job
                            </button>
                            {job.status !== 'Archived' && job.applicants === 0 && (
                              <button
                                onClick={() => handleJobAction('archive', job.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-['Roboto']"
                              >
                                Archive Job
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
              Get started by creating a new job posting.
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
        )}
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">
                  {selectedJob.title}
                </h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  <p className="text-gray-900 font-['Roboto']">{selectedJob.applicants}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Description</h4>
                <p className="text-gray-900 font-['Roboto']">{selectedJob.description}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requirements.map((req, index) => (
                    <span key={index} className="inline-flex px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                      {req}
                    </span>
                  ))}
                </div>
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
                    View Applications
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
};

export default HRJobManagement;
