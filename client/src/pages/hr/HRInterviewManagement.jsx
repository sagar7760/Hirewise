import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HRLayout from '../../components/layout/HRLayout';

const HRInterviewManagement = () => {
  const [interviews, setInterviews] = useState([
    {
      id: 1,
      candidate: {
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567'
      },
      job: {
        id: 1,
        title: 'Senior Frontend Developer',
        department: 'Engineering'
      },
      interviewer: {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        title: 'Senior Engineering Manager'
      },
      scheduledDate: '2025-09-10',
      scheduledTime: '10:00',
      duration: 60,
      status: 'Scheduled',
      type: 'Technical',
      location: 'Conference Room A',
      notes: 'Focus on React and TypeScript skills',
      feedback: null
    },
    {
      id: 2,
      candidate: {
        name: 'Emily Davis',
        email: 'emily.davis@email.com',
        phone: '+1 (555) 987-6543'
      },
      job: {
        id: 2,
        title: 'Product Manager',
        department: 'Product'
      },
      interviewer: {
        id: 2,
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        title: 'VP of Product'
      },
      scheduledDate: '2025-09-10',
      scheduledTime: '14:00',
      duration: 45,
      status: 'Confirmed',
      type: 'Behavioral',
      location: 'Virtual Meeting',
      notes: 'Assess leadership and strategic thinking',
      feedback: null
    },
    {
      id: 3,
      candidate: {
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@email.com',
        phone: '+1 (555) 234-5678'
      },
      job: {
        id: 3,
        title: 'UX Designer',
        department: 'Design'
      },
      interviewer: {
        id: 3,
        name: 'Lisa Chen',
        email: 'lisa.chen@company.com',
        title: 'Design Director'
      },
      scheduledDate: '2025-09-11',
      scheduledTime: '11:00',
      duration: 90,
      status: 'Completed',
      type: 'Portfolio Review',
      location: 'Design Studio',
      notes: 'Review portfolio and design process',
      feedback: {
        rating: 8,
        comments: 'Strong portfolio with excellent UI skills. Good understanding of user research.',
        recommendation: 'Hire',
        strengths: ['Excellent visual design', 'Strong user empathy', 'Good communication'],
        concerns: ['Limited experience with complex systems', 'Need to develop leadership skills'],
        submittedAt: '2025-09-11T12:30:00'
      }
    },
    {
      id: 4,
      candidate: {
        name: 'David Kim',
        email: 'david.kim@email.com',
        phone: '+1 (555) 456-7890'
      },
      job: {
        id: 4,
        title: 'Data Scientist',
        department: 'Analytics'
      },
      interviewer: {
        id: 4,
        name: 'Robert Brown',
        email: 'robert.brown@company.com',
        title: 'Head of Data Science'
      },
      scheduledDate: '2025-09-09',
      scheduledTime: '15:00',
      duration: 75,
      status: 'Completed',
      type: 'Technical',
      location: 'Virtual Meeting',
      notes: 'Machine learning case study discussion',
      feedback: {
        rating: 9,
        comments: 'Exceptional technical skills and problem-solving ability. Great cultural fit.',
        recommendation: 'Strong Hire',
        strengths: ['Deep ML expertise', 'Excellent problem-solving', 'Great communication', 'Cultural fit'],
        concerns: ['Might be overqualified for current role'],
        submittedAt: '2025-09-09T16:15:00'
      }
    }
  ]);

  const [filteredInterviews, setFilteredInterviews] = useState(interviews);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [interviewers] = useState([
    { id: 1, name: 'Sarah Johnson', title: 'Senior Engineering Manager', department: 'Engineering' },
    { id: 2, name: 'Mike Wilson', title: 'VP of Product', department: 'Product' },
    { id: 3, name: 'Lisa Chen', title: 'Design Director', department: 'Design' },
    { id: 4, name: 'Robert Brown', title: 'Head of Data Science', department: 'Analytics' },
    { id: 5, name: 'Jennifer Liu', title: 'HR Manager', department: 'Human Resources' }
  ]);

  useEffect(() => {
    let filtered = interviews;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(interview => interview.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const today = new Date();
      const interviewDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(interview => {
            const schedDate = new Date(interview.scheduledDate);
            return schedDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(interview => {
            const schedDate = new Date(interview.scheduledDate);
            return schedDate >= today && schedDate <= weekFromNow;
          });
          break;
        case 'past':
          filtered = filtered.filter(interview => {
            const schedDate = new Date(interview.scheduledDate);
            return schedDate < today;
          });
          break;
      }
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(interview =>
        interview.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInterviews(filtered);
  }, [interviews, statusFilter, dateFilter, searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-gray-200 text-gray-800';
      case 'Confirmed':
        return 'bg-gray-600 text-white';
      case 'Completed':
        return 'bg-gray-800 text-white';
      case 'Cancelled':
        return 'bg-gray-400 text-white';
      case 'No Show':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'Strong Hire':
        return 'text-gray-900 font-semibold';
      case 'Hire':
        return 'text-gray-700';
      case 'No Hire':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const handleInterviewAction = (action, interviewId) => {
    switch (action) {
      case 'view':
        const interview = interviews.find(int => int.id === interviewId);
        setSelectedInterview(interview);
        setShowInterviewModal(true);
        break;
      case 'confirm':
        setInterviews(interviews.map(int =>
          int.id === interviewId ? { ...int, status: 'Confirmed' } : int
        ));
        break;
      case 'cancel':
        setInterviews(interviews.map(int =>
          int.id === interviewId ? { ...int, status: 'Cancelled' } : int
        ));
        break;
      case 'reschedule':
        // Open reschedule modal
        console.log('Reschedule interview:', interviewId);
        break;
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return {
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isUpcoming = (date, time) => {
    const interviewDateTime = new Date(`${date}T${time}`);
    return interviewDateTime > new Date();
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                Interview Management
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Schedule and manage candidate interviews
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Schedule Interview
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
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
                  placeholder="Search interviews..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="past">Past Interviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interviews Table */}
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
                    Interviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Type
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
                {filteredInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.scheduledDate, interview.scheduledTime);
                  const upcoming = isUpcoming(interview.scheduledDate, interview.scheduledTime);
                  
                  return (
                    <tr key={interview.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                            {interview.candidate.name}
                          </div>
                          <div className="text-sm text-gray-500 font-['Roboto']">
                            {interview.candidate.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-['Roboto']">{interview.job.title}</div>
                        <div className="text-sm text-gray-500 font-['Roboto']">{interview.job.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-['Roboto']">{interview.interviewer.name}</div>
                        <div className="text-sm text-gray-500 font-['Roboto']">{interview.interviewer.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-['Roboto']">{date}</div>
                        <div className="text-sm text-gray-500 font-['Roboto']">{time} ({interview.duration}min)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-['Roboto']">{interview.type}</div>
                        <div className="text-sm text-gray-500 font-['Roboto']">{interview.location}</div>
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
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {upcoming && interview.status === 'Scheduled' && (
                            <button
                              onClick={() => handleInterviewAction('confirm', interview.id)}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title="Confirm Interview"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}

                          {upcoming && interview.status !== 'Cancelled' && (
                            <>
                              <button
                                onClick={() => handleInterviewAction('reschedule', interview.id)}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                                title="Reschedule"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleInterviewAction('cancel', interview.id)}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                                title="Cancel Interview"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {filteredInterviews.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No interviews found</h3>
            <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
              No interviews match your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Interview Details Modal */}
      {showInterviewModal && selectedInterview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">
                  Interview Details
                </h3>
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Candidate</h4>
                  <p className="text-gray-900 font-['Roboto'] font-medium">{selectedInterview.candidate.name}</p>
                  <p className="text-gray-600 font-['Roboto']">{selectedInterview.candidate.email}</p>
                  <p className="text-gray-600 font-['Roboto']">{selectedInterview.candidate.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Job Position</h4>
                  <p className="text-gray-900 font-['Roboto'] font-medium">{selectedInterview.job.title}</p>
                  <p className="text-gray-600 font-['Roboto']">{selectedInterview.job.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Interviewer</h4>
                  <p className="text-gray-900 font-['Roboto'] font-medium">{selectedInterview.interviewer.name}</p>
                  <p className="text-gray-600 font-['Roboto']">{selectedInterview.interviewer.title}</p>
                  <p className="text-gray-600 font-['Roboto']">{selectedInterview.interviewer.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Schedule</h4>
                  <p className="text-gray-900 font-['Roboto'] font-medium">
                    {formatDateTime(selectedInterview.scheduledDate, selectedInterview.scheduledTime).date}
                  </p>
                  <p className="text-gray-600 font-['Roboto']">
                    {formatDateTime(selectedInterview.scheduledDate, selectedInterview.scheduledTime).time} 
                    ({selectedInterview.duration} minutes)
                  </p>
                  <p className="text-gray-600 font-['Roboto']">{selectedInterview.location}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 font-['Roboto'] mb-2">Interview Type & Notes</h4>
                <p className="text-gray-900 font-['Roboto'] mb-2">{selectedInterview.type}</p>
                <p className="text-gray-600 font-['Roboto']">{selectedInterview.notes}</p>
              </div>

              {selectedInterview.feedback && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-4">Interview Feedback</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                        {selectedInterview.feedback.rating}/10
                      </div>
                      <div className="text-sm text-gray-500 font-['Roboto']">Overall Rating</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold font-['Open_Sans'] ${getRecommendationColor(selectedInterview.feedback.recommendation)}`}>
                        {selectedInterview.feedback.recommendation}
                      </div>
                      <div className="text-sm text-gray-500 font-['Roboto']">Recommendation</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 font-['Roboto']">
                        {new Date(selectedInterview.feedback.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 font-['Roboto']">Submitted</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 font-['Roboto'] mb-2">Comments</h5>
                    <p className="text-gray-600 font-['Roboto']">{selectedInterview.feedback.comments}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 font-['Roboto'] mb-2">Strengths</h5>
                      <ul className="space-y-1">
                        {selectedInterview.feedback.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-600 font-['Roboto'] flex items-start">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 font-['Roboto'] mb-2">Areas of Concern</h5>
                      <ul className="space-y-1">
                        {selectedInterview.feedback.concerns.map((concern, index) => (
                          <li key={index} className="text-sm text-gray-600 font-['Roboto'] flex items-start">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedInterview.status === 'Completed' && selectedInterview.feedback && (
                  <Link
                    to={`/hr/candidates/${selectedInterview.candidate.name.replace(' ', '-').toLowerCase()}/decision`}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Make Decision
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">
                  Schedule New Interview
                </h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Candidate
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900">
                      <option value="">Select candidate...</option>
                      <option value="maria-garcia">Maria Garcia - Senior Frontend Developer</option>
                      <option value="david-kim">David Kim - Product Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Interviewer
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900">
                      <option value="">Select interviewer...</option>
                      {interviewers.map(interviewer => (
                        <option key={interviewer.id} value={interviewer.id}>
                          {interviewer.name} - {interviewer.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Duration (minutes)
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900">
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Interview Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900">
                      <option value="Technical">Technical</option>
                      <option value="Behavioral">Behavioral</option>
                      <option value="Portfolio Review">Portfolio Review</option>
                      <option value="Culture Fit">Culture Fit</option>
                      <option value="Final Round">Final Round</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Conference Room A or Virtual Meeting"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Interview focus areas, special instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Schedule Interview
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

export default HRInterviewManagement;
