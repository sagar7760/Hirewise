import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';

const HRApplicationManagement = () => {
  const [applications, setApplications] = useState([
    {
      id: 1,
      candidate: {
        name: 'Maria Garcia',
        email: 'maria.garcia@email.com',
        phone: '+1 (555) 123-4567',
        avatar: null
      },
      job: {
        id: 1,
        title: 'Senior Frontend Developer',
        department: 'Engineering'
      },
      appliedDate: '2025-09-08',
      resumeScore: 8.5,
      status: 'Under Review',
      experience: '5 years',
      skills: ['React', 'TypeScript', 'CSS', 'Node.js'],
      resumeUrl: '/resumes/maria-garcia.pdf',
      aiAnalysis: {
        skillsMatch: 92,
        experienceMatch: 88,
        overallFit: 90,
        strengths: ['Strong React experience', 'TypeScript expertise', 'Full-stack capabilities'],
        concerns: ['Limited leadership experience', 'No AWS experience mentioned']
      }
    },
    {
      id: 2,
      candidate: {
        name: 'David Kim',
        email: 'david.kim@email.com',
        phone: '+1 (555) 987-6543',
        avatar: null
      },
      job: {
        id: 2,
        title: 'Product Manager',
        department: 'Product'
      },
      appliedDate: '2025-09-08',
      resumeScore: 9.2,
      status: 'Shortlisted',
      experience: '7 years',
      skills: ['Product Strategy', 'Analytics', 'Leadership', 'Agile'],
      resumeUrl: '/resumes/david-kim.pdf',
      aiAnalysis: {
        skillsMatch: 95,
        experienceMatch: 92,
        overallFit: 94,
        strengths: ['Excellent leadership track record', 'Strong analytical skills', 'Product vision'],
        concerns: ['No B2B experience', 'Limited technical background']
      }
    },
    {
      id: 3,
      candidate: {
        name: 'Jennifer Lee',
        email: 'jennifer.lee@email.com',
        phone: '+1 (555) 456-7890',
        avatar: null
      },
      job: {
        id: 4,
        title: 'Data Scientist',
        department: 'Analytics'
      },
      appliedDate: '2025-09-07',
      resumeScore: 7.8,
      status: 'Under Review',
      experience: '4 years',
      skills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
      resumeUrl: '/resumes/jennifer-lee.pdf',
      aiAnalysis: {
        skillsMatch: 85,
        experienceMatch: 78,
        overallFit: 82,
        strengths: ['Strong technical skills', 'ML expertise', 'Academic background'],
        concerns: ['Limited business experience', 'No big data tools experience']
      }
    },
    {
      id: 4,
      candidate: {
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@email.com',
        phone: '+1 (555) 234-5678',
        avatar: null
      },
      job: {
        id: 1,
        title: 'Senior Frontend Developer',
        department: 'Engineering'
      },
      appliedDate: '2025-09-06',
      resumeScore: 6.9,
      status: 'Rejected',
      experience: '3 years',
      skills: ['JavaScript', 'React', 'CSS'],
      resumeUrl: '/resumes/alex-rodriguez.pdf',
      aiAnalysis: {
        skillsMatch: 75,
        experienceMatch: 65,
        overallFit: 70,
        strengths: ['Good JavaScript fundamentals', 'React experience'],
        concerns: ['Limited experience', 'No TypeScript knowledge', 'Weak backend skills']
      }
    }
  ]);

  const [filteredApplications, setFilteredApplications] = useState(applications);
  const [selectedJob, setSelectedJob] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [sortBy, setSortBy] = useState('appliedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const jobs = [
    { id: 1, title: 'Senior Frontend Developer' },
    { id: 2, title: 'Product Manager' },
    { id: 3, title: 'UX Designer' },
    { id: 4, title: 'Data Scientist' }
  ];

  useEffect(() => {
    let filtered = applications;

    // Filter by job
    if (selectedJob !== 'all') {
      filtered = filtered.filter(app => app.job.id === parseInt(selectedJob));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'resumeScore':
          aValue = a.resumeScore;
          bValue = b.resumeScore;
          break;
        case 'appliedDate':
          aValue = new Date(a.appliedDate);
          bValue = new Date(b.appliedDate);
          break;
        case 'name':
          aValue = a.candidate.name;
          bValue = b.candidate.name;
          break;
        default:
          aValue = a.appliedDate;
          bValue = b.appliedDate;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, selectedJob, statusFilter, searchTerm, sortBy, sortOrder]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Under Review':
        return 'bg-gray-200 text-gray-800';
      case 'Shortlisted':
        return 'bg-gray-800 text-white';
      case 'Rejected':
        return 'bg-gray-400 text-white';
      case 'Interview Scheduled':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'text-gray-900 font-semibold';
    if (score >= 7.0) return 'text-gray-700';
    return 'text-gray-500';
  };

  const handleApplicationAction = (action, applicationId) => {
    switch (action) {
      case 'view':
        const application = applications.find(app => app.id === applicationId);
        setSelectedApplication(application);
        setShowApplicationModal(true);
        break;
      case 'shortlist':
        setApplications(applications.map(app =>
          app.id === applicationId ? { ...app, status: 'Shortlisted' } : app
        ));
        break;
      case 'reject':
        setApplications(applications.map(app =>
          app.id === applicationId ? { ...app, status: 'Rejected' } : app
        ));
        break;
      case 'schedule':
        setApplications(applications.map(app =>
          app.id === applicationId ? { ...app, status: 'Interview Scheduled' } : app
        ));
        break;
    }
  };

  const exportApplications = (format) => {
    const shortlistedApps = applications.filter(app => app.status === 'Shortlisted');
    
    if (format === 'csv') {
      const csvContent = [
        ['Name', 'Email', 'Phone', 'Job Title', 'Resume Score', 'Experience', 'Skills'],
        ...shortlistedApps.map(app => [
          app.candidate.name,
          app.candidate.email,
          app.candidate.phone,
          app.job.title,
          app.resumeScore,
          app.experience,
          app.skills.join('; ')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shortlisted-candidates.csv';
      a.click();
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
                Application Management
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Review and manage candidate applications
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => exportApplications('csv')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
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
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
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
                  placeholder="Search candidates, jobs, or skills..."
                />
              </div>
            </div>

            {/* Job Filter */}
            <div>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-sm font-medium text-gray-700 font-['Roboto']">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 text-sm"
            >
              <option value="appliedDate">Applied Date</option>
              <option value="resumeScore">Resume Score</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Job Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Resume Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 font-['Open_Sans']">
                            {application.candidate.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                            {application.candidate.name}
                          </div>
                          <div className="text-sm text-gray-500 font-['Roboto']">
                            {application.experience} experience
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-['Roboto']">{application.job.title}</div>
                      <div className="text-sm text-gray-500 font-['Roboto']">{application.job.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-['Roboto']">
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
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            {skill}
                          </span>
                        ))}
                        {application.skills.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{application.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleApplicationAction('view', application.id)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {application.status === 'Under Review' && (
                          <>
                            <button
                              onClick={() => handleApplicationAction('shortlist', application.id)}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title="Shortlist"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleApplicationAction('reject', application.id)}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title="Reject"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                        {application.status === 'Shortlisted' && (
                          <button
                            onClick={() => handleApplicationAction('schedule', application.id)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredApplications.length === 0 && (
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">
                  {selectedApplication.candidate.name}
                </h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Contact Information</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedApplication.candidate.email}</p>
                  <p className="text-gray-900 font-['Roboto']">{selectedApplication.candidate.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Job Applied For</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedApplication.job.title}</p>
                  <p className="text-gray-600 font-['Roboto']">{selectedApplication.job.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Experience</h4>
                  <p className="text-gray-900 font-['Roboto']">{selectedApplication.experience}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Resume Score</h4>
                  <p className={`text-lg font-['Roboto'] ${getScoreColor(selectedApplication.resumeScore)}`}>
                    {selectedApplication.resumeScore}/10
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.skills.map((skill, index) => (
                    <span key={index} className="inline-flex px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-4">AI Analysis</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                      {selectedApplication.aiAnalysis.skillsMatch}%
                    </div>
                    <div className="text-sm text-gray-500 font-['Roboto']">Skills Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                      {selectedApplication.aiAnalysis.experienceMatch}%
                    </div>
                    <div className="text-sm text-gray-500 font-['Roboto']">Experience Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                      {selectedApplication.aiAnalysis.overallFit}%
                    </div>
                    <div className="text-sm text-gray-500 font-['Roboto']">Overall Fit</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 font-['Roboto'] mb-2">Strengths</h5>
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
                    <h5 className="text-sm font-medium text-gray-700 font-['Roboto'] mb-2">Concerns</h5>
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

              <div className="flex justify-between">
                <div>
                  <a
                    href={selectedApplication.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Resume
                  </a>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedApplication.status === 'Under Review' && (
                    <>
                      <button
                        onClick={() => {
                          handleApplicationAction('reject', selectedApplication.id);
                          setShowApplicationModal(false);
                        }}
                        className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium font-['Roboto'] transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleApplicationAction('shortlist', selectedApplication.id);
                          setShowApplicationModal(false);
                        }}
                        className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                      >
                        Shortlist
                      </button>
                    </>
                  )}
                  {selectedApplication.status === 'Shortlisted' && (
                    <button
                      onClick={() => {
                        handleApplicationAction('schedule', selectedApplication.id);
                        setShowApplicationModal(false);
                      }}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                    >
                      Schedule Interview
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
};

export default HRApplicationManagement;
