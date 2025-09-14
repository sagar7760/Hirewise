import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const AllJobsPage = () => {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'active',
      applications: 45,
      shortlisted: 8,
      hired: 2,
      postedBy: 'Sarah Johnson',
      postedDate: '2024-03-01',
      salary: '$120,000 - $150,000'
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      type: 'Full-time',
      status: 'active',
      applications: 32,
      shortlisted: 6,
      hired: 1,
      postedBy: 'Michael Chen',
      postedDate: '2024-02-28',
      salary: '$130,000 - $160,000'
    },
    {
      id: 3,
      title: 'UX Designer',
      department: 'Design',
      location: 'New York, NY',
      type: 'Full-time',
      status: 'active',
      applications: 28,
      shortlisted: 5,
      hired: 0,
      postedBy: 'Emma Davis',
      postedDate: '2024-03-05',
      salary: '$90,000 - $120,000'
    },
    {
      id: 4,
      title: 'Data Scientist',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'closed',
      applications: 52,
      shortlisted: 12,
      hired: 3,
      postedBy: 'David Wilson',
      postedDate: '2024-02-15',
      salary: '$140,000 - $170,000'
    },
    {
      id: 5,
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Austin, TX',
      type: 'Part-time',
      status: 'active',
      applications: 18,
      shortlisted: 3,
      hired: 0,
      postedBy: 'Sarah Johnson',
      postedDate: '2024-03-10',
      salary: '$50,000 - $65,000'
    }
  ]);

  const [selectedJob, setSelectedJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHR, setFilterHR] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const hrs = ['Sarah Johnson', 'Michael Chen', 'Emma Davis', 'David Wilson'];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesHR = filterHR === 'all' || job.postedBy === filterHR;
    
    return matchesSearch && matchesStatus && matchesHR;
  });

  const handleJobAction = (jobId, action) => {
    if (action === 'close') {
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: 'closed' } : job
      ));
    } else if (action === 'reopen') {
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: 'active' } : job
      ));
    }
    console.log(`Job ${jobId} ${action}d`);
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
        return 'bg-gray-200 text-gray-800';
      case 'closed':
        return 'bg-gray-100 text-gray-600';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.status === 'active').length;
  const totalApplications = jobs.reduce((sum, job) => sum + job.applications, 0);
  const totalHired = jobs.reduce((sum, job) => sum + job.hired, 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
            All Jobs Overview
          </h1>
          <p className="text-gray-600 font-['Roboto']">
            Monitor all job postings across your organization.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{activeJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Hired</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{totalHired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                Search Jobs
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                  placeholder="Search by title, department, or location"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                Posted By
              </label>
              <select
                value={filterHR}
                onChange={(e) => setFilterHR(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
              >
                <option value="all">All HRs</option>
                {hrs.map(hr => (
                  <option key={hr} value={hr}>{hr}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterHR('all');
                }}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium font-['Roboto'] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
              Jobs ({filteredJobs.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Job Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Posted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Posted Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                          {job.title}
                        </div>
                        <div className="text-sm text-gray-500 font-['Roboto']">
                          {job.department} • {job.location} • {job.type}
                        </div>
                        <div className="text-sm text-gray-500 font-['Roboto'] mt-1">
                          {job.salary}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                        {job.postedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-['Roboto']">
                        <div className="flex items-center space-x-4">
                          <span>{job.applications} Applied</span>
                          <span className="text-gray-700">{job.shortlisted} Shortlisted</span>
                          <span className="text-gray-600">{job.hired} Hired</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-['Roboto']">
                      {formatDate(job.postedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="text-gray-700 hover:text-gray-900 transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {job.status === 'active' ? (
                          <button
                            onClick={() => handleJobAction(job.id, 'close')}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                            title="Close Job"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJobAction(job.id, 'reopen')}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                            title="Reopen Job"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
                    Job Details
                  </h3>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 font-['Open_Sans']">
                      {selectedJob.title}
                    </h4>
                    <p className="text-sm text-gray-600 font-['Roboto']">
                      {selectedJob.department} • {selectedJob.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 font-['Roboto']">Posted by:</span>
                      <p className="text-gray-900 font-['Roboto']">{selectedJob.postedBy}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 font-['Roboto']">Type:</span>
                      <p className="text-gray-900 font-['Roboto']">{selectedJob.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 font-['Roboto']">Salary:</span>
                      <p className="text-gray-900 font-['Roboto']">{selectedJob.salary}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 font-['Roboto']">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getStatusColor(selectedJob.status)}`}>
                        {selectedJob.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-700 font-['Roboto'] mb-2">Application Statistics:</h5>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-800 font-['Open_Sans']">{selectedJob.applications}</p>
                        <p className="text-xs text-gray-600 font-['Roboto']">Applied</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-700 font-['Open_Sans']">{selectedJob.shortlisted}</p>
                        <p className="text-xs text-gray-600 font-['Roboto']">Shortlisted</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-700 font-['Open_Sans']">{selectedJob.hired}</p>
                        <p className="text-xs text-gray-600 font-['Roboto']">Hired</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium font-['Roboto'] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to detailed job management
                      console.log('Navigate to job details page for job:', selectedJob.id);
                    }}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Manage Job
                  </button>
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
