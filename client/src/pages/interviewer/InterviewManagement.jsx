import React, { useState } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';
import TodaysInterviews from './TodaysInterviews';
import UpcomingInterviews from './UpcomingInterviews';
import PastInterviews from './PastInterviews';

const InterviewManagement = () => {
  const [activeTab, setActiveTab] = useState('today');

  const tabs = [
    { id: 'today', name: "Today's Interviews", icon: 'today' },
    { id: 'upcoming', name: 'Upcoming Interviews', icon: 'calendar' },
    { id: 'past', name: 'Past Interviews', icon: 'history' }
  ];

  const getTabIcon = (iconType) => {
    switch (iconType) {
      case 'today':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'history':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today':
        return <TodaysInterviewsContent />;
      case 'upcoming':
        return <UpcomingInterviewsContent />;
      case 'past':
        return <PastInterviewsContent />;
      default:
        return <TodaysInterviewsContent />;
    }
  };

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Interview Management</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">
            Manage your interview schedule and review completed interviews
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors font-['Roboto'] ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {getTabIcon(tab.icon)}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-0">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </InterviewerLayout>
  );
};

// Content components that extract the main content from existing pages
const TodaysInterviewsContent = () => {
  const [todaysInterviews] = useState([
    {
      id: 1,
      candidateName: 'Sarah Johnson',
      jobTitle: 'Frontend Developer',
      scheduledTime: '9:00 AM',
      duration: '60 min',
      interviewType: 'Technical',
      status: 'confirmed',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      department: 'Engineering',
      priority: 'high'
    },
    {
      id: 2,
      candidateName: 'Mike Chen',
      jobTitle: 'React Developer',
      scheduledTime: '11:30 AM',
      duration: '45 min',
      interviewType: 'Technical',
      status: 'confirmed',
      meetingLink: 'https://zoom.us/j/123456789',
      department: 'Engineering',
      priority: 'medium'
    },
    {
      id: 3,
      candidateName: 'Emily Davis',
      jobTitle: 'UI/UX Designer',
      scheduledTime: '2:15 PM',
      duration: '60 min',
      interviewType: 'Portfolio Review',
      status: 'pending_confirmation',
      meetingLink: 'https://teams.microsoft.com/l/meetup-join',
      department: 'Design',
      priority: 'medium'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-gray-100 text-gray-700';
      case 'pending_confirmation':
        return 'bg-orange-100 text-orange-800';
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
      default:
        return 'Unknown';
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6 pt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Today</p>
              <p className="text-2xl font-bold text-black font-['Open_Sans']">{todaysInterviews.length}</p>
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
                {todaysInterviews.filter(i => i.status === 'confirmed').length}
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
                {todaysInterviews.filter(i => i.status === 'pending_confirmation').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Interviews List */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-black font-['Open_Sans'] mb-4">
          Today's Schedule ({todaysInterviews.length} interviews)
        </h2>

        <div className="space-y-4">
          {todaysInterviews.map((interview) => (
            <div key={interview.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
                
                <div className="flex flex-col gap-2 ml-4">
                  <button 
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
                    onClick={() => window.open(interview.meetingLink, '_blank')}
                  >
                    Join Meeting
                  </button>
                  <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {todaysInterviews.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-black font-['Open_Sans']">No interviews today</h3>
            <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
              You have a free day with no scheduled interviews.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const UpcomingInterviewsContent = () => {
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
    }
  ]);

  const filteredInterviews = upcomingInterviews.filter(interview => {
    const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'confirmed') return matchesSearch && interview.status === 'confirmed';
    if (filter === 'pending') return matchesSearch && interview.status === 'pending_confirmation';
    
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
      default:
        return 'Unknown';
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 px-6 pt-6">
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
      <div className="bg-gray-50 border-t border-gray-200 p-6 mb-6">
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
            </select>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-black font-['Open_Sans'] mb-4">
          Upcoming Interviews ({filteredInterviews.length})
        </h2>

        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <div key={interview.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:bg-gray-50 transition-colors">
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
            <h3 className="mt-2 text-sm font-medium text-black font-['Open_Sans']">No upcoming interviews found</h3>
            <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
              {searchTerm ? 'Try adjusting your search criteria.' : 'You don\'t have any upcoming interviews scheduled.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const PastInterviewsContent = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [pastInterviews] = useState([
    {
      id: 1,
      candidateName: 'Sarah Johnson',
      jobTitle: 'Frontend Developer',
      interviewDate: '2024-01-08',
      interviewTime: '10:00 AM',
      duration: '60 min',
      interviewType: 'Technical',
      department: 'Engineering',
      status: 'completed',
      overallRating: 4,
      recommendation: 'hire',
      nextSteps: 'proceed-next-round',
      feedbackSubmitted: true,
      notes: 'Strong technical skills, good problem-solving approach.',
      strengths: 'React expertise, clean code, good architectural thinking',
      improvements: 'Could improve knowledge of state management patterns'
    },
    {
      id: 2,
      candidateName: 'Mike Chen',
      jobTitle: 'Full Stack Developer',
      interviewDate: '2024-01-05',
      interviewTime: '2:00 PM',
      duration: '45 min',
      interviewType: 'Technical',
      department: 'Engineering',
      status: 'completed',
      overallRating: 5,
      recommendation: 'strong-hire',
      nextSteps: 'final-interview',
      feedbackSubmitted: true,
      notes: 'Exceptional candidate with strong full-stack experience.',
      strengths: 'Full-stack expertise, system design, leadership potential',
      improvements: 'No major concerns'
    }
  ]);

  const filteredInterviews = pastInterviews.filter(interview => {
    const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'recommended') return matchesSearch && ['hire', 'strong-hire'].includes(interview.recommendation);
    if (filter === 'not-recommended') return matchesSearch && ['no-hire', 'strong-no-hire'].includes(interview.recommendation);
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'strong-hire':
        return 'bg-gray-100 text-gray-700';
      case 'hire':
        return 'bg-gray-100 text-gray-700';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800';
      case 'no-hire':
      case 'strong-no-hire':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case 'strong-hire':
        return 'Strong Hire';
      case 'hire':
        return 'Hire';
      case 'maybe':
        return 'Maybe';
      case 'no-hire':
        return 'No Hire';
      case 'strong-no-hire':
        return 'Strong No Hire';
      default:
        return 'Pending';
    }
  };

  const StarDisplay = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-gray-700' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 px-6 pt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Completed</p>
              <p className="text-2xl font-bold text-black font-['Open_Sans']">{pastInterviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Roboto']">Recommended</p>
              <p className="text-2xl font-bold text-black font-['Open_Sans']">
                {pastInterviews.filter(i => ['hire', 'strong-hire'].includes(i.recommendation)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3 3 7-7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Roboto']">Not Recommended</p>
              <p className="text-2xl font-bold text-black font-['Open_Sans']">
                {pastInterviews.filter(i => ['no-hire', 'strong-no-hire'].includes(i.recommendation)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Roboto']">Avg. Rating</p>
              <p className="text-2xl font-bold text-black font-['Open_Sans']">
                {(pastInterviews.reduce((acc, i) => acc + i.overallRating, 0) / pastInterviews.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-50 border-t border-gray-200 p-6 mb-6">
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
              <option value="recommended">Recommended</option>
              <option value="not-recommended">Not Recommended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-black font-['Open_Sans'] mb-4">
          Interview History ({filteredInterviews.length})
        </h2>

        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <div key={interview.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:bg-gray-50 transition-colors">
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getRecommendationColor(interview.recommendation)}`}>
                          {getRecommendationText(interview.recommendation)}
                        </span>
                      </div>
                      <p className="text-gray-600 font-['Roboto'] mb-3">{interview.jobTitle}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500 font-['Roboto']">Date:</span>
                          <p className="text-black font-['Roboto'] font-medium">{formatDate(interview.interviewDate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-['Roboto']">Time:</span>
                          <p className="text-black font-['Roboto'] font-medium">{interview.interviewTime}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-['Roboto']">Type:</span>
                          <p className="text-black font-['Roboto'] font-medium">{interview.interviewType}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-['Roboto']">Rating:</span>
                          <StarDisplay rating={interview.overallRating} />
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-700 font-['Roboto'] line-clamp-2">
                          <span className="font-medium">Notes:</span> {interview.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 ml-4">
                  <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']">
                    View Feedback
                  </button>
                  <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']">
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInterviews.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-black font-['Open_Sans']">No interviews found</h3>
            <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
              {searchTerm ? 'Try adjusting your search criteria.' : 'You haven\'t completed any interviews yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewManagement;