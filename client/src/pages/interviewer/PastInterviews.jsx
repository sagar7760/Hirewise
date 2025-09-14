import React, { useState } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';

const PastInterviews = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null);

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
      notes: 'Strong technical skills, good problem-solving approach. Excellent communication during technical discussions.',
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
      notes: 'Exceptional candidate with strong full-stack experience. Demonstrated excellent problem-solving skills.',
      strengths: 'Full-stack expertise, system design, leadership potential',
      improvements: 'No major concerns'
    },
    {
      id: 3,
      candidateName: 'Emily Davis',
      jobTitle: 'UI/UX Designer',
      interviewDate: '2024-01-03',
      interviewTime: '4:30 PM',
      duration: '60 min',
      interviewType: 'Portfolio Review',
      department: 'Design',
      status: 'completed',
      overallRating: 3,
      recommendation: 'maybe',
      nextSteps: 'technical-assessment',
      feedbackSubmitted: true,
      notes: 'Good design sense but needs more experience with user research and testing methodologies.',
      strengths: 'Visual design, creativity, attention to detail',
      improvements: 'User research, prototyping tools, design systems'
    },
    {
      id: 4,
      candidateName: 'Robert Taylor',
      jobTitle: 'DevOps Engineer',
      interviewDate: '2024-01-02',
      interviewTime: '11:00 AM',
      duration: '90 min',
      interviewType: 'Technical',
      department: 'Engineering',
      status: 'completed',
      overallRating: 2,
      recommendation: 'no-hire',
      nextSteps: 'reject',
      feedbackSubmitted: true,
      notes: 'Limited experience with cloud technologies. Struggled with infrastructure scaling questions.',
      strengths: 'Basic DevOps knowledge, willingness to learn',
      improvements: 'Cloud platforms, containerization, monitoring tools'
    },
    {
      id: 5,
      candidateName: 'Lisa Martinez',
      jobTitle: 'Product Manager',
      interviewDate: '2023-12-28',
      interviewTime: '1:15 PM',
      duration: '45 min',
      interviewType: 'Behavioral',
      department: 'Product',
      status: 'completed',
      overallRating: 4,
      recommendation: 'hire',
      nextSteps: 'reference-check',
      feedbackSubmitted: true,
      notes: 'Strong product sense and leadership experience. Good understanding of user-centered design.',
      strengths: 'Product strategy, stakeholder management, data-driven decisions',
      improvements: 'Technical depth, agile methodology experience'
    }
  ]);

  const filteredInterviews = pastInterviews.filter(interview => {
    const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'recommended') return matchesSearch && ['hire', 'strong-hire'].includes(interview.recommendation);
    if (filter === 'not-recommended') return matchesSearch && ['no-hire', 'strong-no-hire'].includes(interview.recommendation);
    if (filter === 'pending-decision') return matchesSearch && interview.recommendation === 'maybe';
    
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

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'strong-hire':
      case 'hire':
        return 'bg-green-100 text-green-800';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800';
      case 'no-hire':
      case 'strong-no-hire':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return 'Unknown';
    }
  };

  const StarDisplay = ({ rating }) => {
    return (
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= rating ? 'text-black' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className={`ml-2 text-sm font-medium ${getRatingColor(rating)}`}>
          {rating}/5
        </span>
      </div>
    );
  };

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Past Interviews</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">
            Review your completed interviews and feedback history
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <option value="recommended">Recommended</option>
                <option value="not-recommended">Not Recommended</option>
                <option value="pending-decision">Pending Decision</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black font-['Open_Sans']">
              Interview History ({filteredInterviews.length})
            </h2>
            <p className="text-sm text-gray-600 font-['Roboto']">Your completed interviews and evaluations</p>
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
                    <button 
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
                      onClick={() => setSelectedInterview(interview)}
                    >
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No interviews found</h3>
              <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                {searchTerm ? 'Try adjusting your search criteria.' : 'You haven\'t completed any interviews yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Feedback Detail Modal */}
        {selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h2 className="text-xl font-semibold text-black font-['Open_Sans']">
                    Interview Feedback - {selectedInterview.candidateName}
                  </h2>
                  <p className="text-sm text-gray-600 font-['Roboto']">
                    {selectedInterview.jobTitle} • {formatDate(selectedInterview.interviewDate)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-3">Overall Rating</h3>
                    <StarDisplay rating={selectedInterview.overallRating} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-3">Recommendation</h3>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full font-['Roboto'] ${getRecommendationColor(selectedInterview.recommendation)}`}>
                      {getRecommendationText(selectedInterview.recommendation)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-3">Detailed Notes</h3>
                  <p className="text-gray-700 font-['Roboto'] bg-gray-50 p-4 rounded-lg">
                    {selectedInterview.notes}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-3">Strengths</h3>
                    <p className="text-gray-700 font-['Roboto'] bg-green-50 p-4 rounded-lg">
                      {selectedInterview.strengths}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-3">Areas for Improvement</h3>
                    <p className="text-gray-700 font-['Roboto'] bg-orange-50 p-4 rounded-lg">
                      {selectedInterview.improvements}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-3">Next Steps</h3>
                  <p className="text-gray-700 font-['Roboto'] bg-blue-50 p-4 rounded-lg">
                    {selectedInterview.nextSteps.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </InterviewerLayout>
  );
};

export default PastInterviews;