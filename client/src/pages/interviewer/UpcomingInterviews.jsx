import React, { useState } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';

const UpcomingInterviews = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [upcomingInterviews] = useState([
    {
      id: 1,
      candidateName: 'Alex Rodriguez',
      jobTitle: 'Senior React Developer',
      scheduledDate: '2024-01-15',
      scheduledTime: '9:00 AM',
      duration: '60 min',
      interviewType: 'Technical',
      status: 'confirmed',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      department: 'Engineering'
    },
    {
      id: 2,
      candidateName: 'Jennifer Kim',
      jobTitle: 'Product Manager',
      scheduledDate: '2024-01-15',
      scheduledTime: '2:30 PM',
      duration: '45 min',
      interviewType: 'Behavioral',
      status: 'pending_confirmation',
      meetingLink: 'https://zoom.us/j/123456789',
      department: 'Product'
    },
    {
      id: 3,
      candidateName: 'David Thompson',
      jobTitle: 'DevOps Engineer',
      scheduledDate: '2024-01-16',
      scheduledTime: '11:00 AM',
      duration: '90 min',
      interviewType: 'Technical',
      status: 'confirmed',
      meetingLink: 'https://teams.microsoft.com/l/meetup-join',
      department: 'Engineering'
    },
    {
      id: 4,
      candidateName: 'Maria Garcia',
      jobTitle: 'UX Designer',
      scheduledDate: '2024-01-17',
      scheduledTime: '10:15 AM',
      duration: '75 min',
      interviewType: 'Portfolio Review',
      status: 'confirmed',
      meetingLink: 'https://meet.google.com/xyz-uvw-rst',
      department: 'Design'
    },
    {
      id: 5,
      candidateName: 'Robert Wang',
      jobTitle: 'Data Scientist',
      scheduledDate: '2024-01-18',
      scheduledTime: '3:00 PM',
      duration: '60 min',
      interviewType: 'Case Study',
      status: 'tentative',
      meetingLink: 'https://zoom.us/j/987654321',
      department: 'Data Science'
    }
  ]);

  const filteredInterviews = upcomingInterviews.filter(interview => {
    const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'confirmed') return matchesSearch && interview.status === 'confirmed';
    if (filter === 'pending') return matchesSearch && interview.status === 'pending_confirmation';
    if (filter === 'tentative') return matchesSearch && interview.status === 'tentative';
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysFromNow = (dateString) => {
    const today = new Date();
    const interviewDate = new Date(dateString);
    const diffTime = interviewDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `in ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-gray-100 text-gray-700';
      case 'pending_confirmation':
        return 'bg-orange-100 text-orange-800';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending_confirmation':
        return 'Pending';
      case 'tentative':
        return 'Tentative';
      default:
        return 'Unknown';
    }
  };

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Upcoming Interviews</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">
            Manage your scheduled interviews for the coming days
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Upcoming</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">{upcomingInterviews.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Confirmed</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">
                  {upcomingInterviews.filter(i => i.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Pending</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">
                  {upcomingInterviews.filter(i => i.status === 'pending_confirmation').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">This Week</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">
                  {upcomingInterviews.filter(i => {
                    const today = new Date();
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const interviewDate = new Date(i.scheduledDate);
                    return interviewDate >= today && interviewDate <= weekFromNow;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by candidate name or job title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black bg-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Interviews</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending Confirmation</option>
                <option value="tentative">Tentative</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black font-['Open_Sans']">
              Upcoming Interviews ({filteredInterviews.length})
            </h2>
            <p className="text-sm text-gray-600 font-['Roboto']">Your scheduled interviews</p>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredInterviews.map((interview) => (
              <div key={interview.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-700">
                            {interview.candidateName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-black font-['Open_Sans']">
                            {interview.candidateName}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getStatusColor(interview.status)}`}>
                            {getStatusText(interview.status)}
                          </span>
                        </div>
                        <p className="text-gray-600 font-['Roboto'] mb-2">{interview.jobTitle}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Date:</span>
                            <p className="text-black font-['Roboto'] font-medium">
                              {formatDate(interview.scheduledDate)}
                            </p>
                            <p className="text-gray-500 text-xs font-['Roboto']">
                              {getDaysFromNow(interview.scheduledDate)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Time:</span>
                            <p className="text-black font-['Roboto'] font-medium">{interview.scheduledTime}</p>
                            <p className="text-gray-500 text-xs font-['Roboto']">{interview.duration}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Type:</span>
                            <p className="text-black font-['Roboto'] font-medium">{interview.interviewType}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Department:</span>
                            <p className="text-black font-['Roboto'] font-medium">{interview.department}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 ml-4">
                    <button 
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
                      onClick={() => window.open(interview.meetingLink, '_blank')}
                    >
                      Join Meeting
                    </button>
                    <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']">
                      View Details
                    </button>
                    <div className="relative">
                      <button className="bg-white text-black border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredInterviews.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No upcoming interviews found</h3>
              <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                {searchTerm ? 'Try adjusting your search criteria.' : 'You don\'t have any upcoming interviews scheduled.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </InterviewerLayout>
  );
};

export default UpcomingInterviews;