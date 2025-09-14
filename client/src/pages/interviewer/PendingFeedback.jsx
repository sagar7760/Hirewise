import React, { useState } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';

const PendingFeedback = () => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    overallRating: 0,
    technicalSkills: 0,
    communication: 0,
    problemSolving: 0,
    culturalFit: 0,
    experience: 0,
    strengths: '',
    improvements: '',
    recommendation: '',
    detailedFeedback: '',
    nextSteps: ''
  });

  const [pendingInterviews] = useState([
    {
      id: 1,
      candidateName: 'John Smith',
      jobTitle: 'Senior Frontend Developer',
      interviewDate: '2024-01-10',
      interviewTime: '10:00 AM',
      duration: '60 min',
      interviewType: 'Technical',
      department: 'Engineering',
      daysPending: 3,
      priority: 'high'
    },
    {
      id: 2,
      candidateName: 'Lisa Anderson',
      jobTitle: 'Product Designer',
      interviewDate: '2024-01-09',
      interviewTime: '2:30 PM',
      duration: '45 min',
      interviewType: 'Portfolio Review',
      department: 'Design',
      daysPending: 4,
      priority: 'high'
    },
    {
      id: 3,
      candidateName: 'Michael Brown',
      jobTitle: 'Backend Developer',
      interviewDate: '2024-01-11',
      interviewTime: '11:15 AM',
      duration: '90 min',
      interviewType: 'Technical',
      department: 'Engineering',
      daysPending: 2,
      priority: 'medium'
    },
    {
      id: 4,
      candidateName: 'Emma Wilson',
      jobTitle: 'Marketing Manager',
      interviewDate: '2024-01-12',
      interviewTime: '3:00 PM',
      duration: '45 min',
      interviewType: 'Behavioral',
      department: 'Marketing',
      daysPending: 1,
      priority: 'low'
    }
  ]);

  const handleRatingChange = (category, rating) => {
    setFeedbackForm(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleInputChange = (field, value) => {
    setFeedbackForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitFeedback = () => {
    console.log('Submitting feedback for:', selectedCandidate?.candidateName);
    console.log('Feedback:', feedbackForm);
    
    // Reset form and close modal
    setSelectedCandidate(null);
    setFeedbackForm({
      overallRating: 0,
      technicalSkills: 0,
      communication: 0,
      problemSolving: 0,
      culturalFit: 0,
      experience: 0,
      strengths: '',
      improvements: '',
      recommendation: '',
      detailedFeedback: '',
      nextSteps: ''
    });
  };

  const openFeedbackForm = (interview) => {
    setSelectedCandidate(interview);
  };

  const closeFeedbackForm = () => {
    setSelectedCandidate(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority, days) => {
    if (days >= 4 || priority === 'high') return 'bg-red-100 text-red-800';
    if (days >= 2 || priority === 'medium') return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const StarRating = ({ rating, onRatingChange, label }) => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-black font-['Roboto'] w-32">{label}:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRatingChange(star)}
              className={`w-6 h-6 ${
                star <= rating ? 'text-black' : 'text-gray-300'
              } hover:text-black transition-colors`}
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Pending Feedback</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">
            Complete feedback for interviews awaiting your evaluation
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Pending</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">{pendingInterviews.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">High Priority</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">
                  {pendingInterviews.filter(i => i.priority === 'high' || i.daysPending >= 4).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Overdue (3+ days)</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">
                  {pendingInterviews.filter(i => i.daysPending >= 3).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Avg. Response Time</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">2.5d</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Interviews Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Interviews Awaiting Feedback</h2>
            <p className="text-sm text-gray-600 font-['Roboto']">Complete your evaluation for these candidates</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Interview Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Days Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInterviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {interview.candidateName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black font-['Open_Sans']">
                            {interview.candidateName}
                          </div>
                          <div className="text-sm text-gray-500 font-['Roboto']">
                            {interview.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-['Roboto']">
                      {interview.jobTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-['Roboto']">
                      <div>{formatDate(interview.interviewDate)}</div>
                      <div className="text-gray-500 text-xs">{interview.interviewTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-['Roboto']">
                      {interview.interviewType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getPriorityColor(interview.priority, interview.daysPending)}`}>
                        {interview.daysPending} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => openFeedbackForm(interview)}
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
                      >
                        Submit Feedback
                      </button>
                      <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors font-['Roboto']">
                        View Notes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pendingInterviews.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">All caught up!</h3>
              <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                You don't have any pending feedback to complete.
              </p>
            </div>
          )}
        </div>

        {/* Feedback Modal */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h2 className="text-xl font-semibold text-black font-['Open_Sans']">
                    Interview Feedback - {selectedCandidate.candidateName}
                  </h2>
                  <p className="text-sm text-gray-600 font-['Roboto']">
                    {selectedCandidate.jobTitle} • {formatDate(selectedCandidate.interviewDate)}
                  </p>
                </div>
                <button
                  onClick={closeFeedbackForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Rating Section */}
                <div>
                  <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-4">Evaluation Ratings</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <StarRating 
                      label="Overall Rating" 
                      rating={feedbackForm.overallRating} 
                      onRatingChange={(rating) => handleRatingChange('overallRating', rating)} 
                    />
                    <StarRating 
                      label="Technical Skills" 
                      rating={feedbackForm.technicalSkills} 
                      onRatingChange={(rating) => handleRatingChange('technicalSkills', rating)} 
                    />
                    <StarRating 
                      label="Communication" 
                      rating={feedbackForm.communication} 
                      onRatingChange={(rating) => handleRatingChange('communication', rating)} 
                    />
                    <StarRating 
                      label="Problem Solving" 
                      rating={feedbackForm.problemSolving} 
                      onRatingChange={(rating) => handleRatingChange('problemSolving', rating)} 
                    />
                    <StarRating 
                      label="Cultural Fit" 
                      rating={feedbackForm.culturalFit} 
                      onRatingChange={(rating) => handleRatingChange('culturalFit', rating)} 
                    />
                    <StarRating 
                      label="Experience Level" 
                      rating={feedbackForm.experience} 
                      onRatingChange={(rating) => handleRatingChange('experience', rating)} 
                    />
                  </div>
                </div>

                {/* Written Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-black font-['Open_Sans'] mb-2">
                      Key Strengths
                    </label>
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black placeholder-gray-500"
                      placeholder="What did the candidate do well?"
                      value={feedbackForm.strengths}
                      onChange={(e) => handleInputChange('strengths', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black font-['Open_Sans'] mb-2">
                      Areas for Improvement
                    </label>
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black placeholder-gray-500"
                      placeholder="What areas need development?"
                      value={feedbackForm.improvements}
                      onChange={(e) => handleInputChange('improvements', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black font-['Open_Sans'] mb-2">
                    Detailed Feedback
                  </label>
                  <textarea
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black placeholder-gray-500"
                    placeholder="Provide detailed feedback about the candidate's performance during the interview..."
                    value={feedbackForm.detailedFeedback}
                    onChange={(e) => handleInputChange('detailedFeedback', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-black font-['Open_Sans'] mb-2">
                      Recommendation
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black bg-white"
                      value={feedbackForm.recommendation}
                      onChange={(e) => handleInputChange('recommendation', e.target.value)}
                    >
                      <option value="">Select recommendation</option>
                      <option value="strong-hire">Strong Hire</option>
                      <option value="hire">Hire</option>
                      <option value="maybe">Maybe</option>
                      <option value="no-hire">No Hire</option>
                      <option value="strong-no-hire">Strong No Hire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black font-['Open_Sans'] mb-2">
                      Next Steps
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black bg-white"
                      value={feedbackForm.nextSteps}
                      onChange={(e) => handleInputChange('nextSteps', e.target.value)}
                    >
                      <option value="">Select next step</option>
                      <option value="proceed-next-round">Proceed to Next Round</option>
                      <option value="technical-assessment">Technical Assessment</option>
                      <option value="final-interview">Final Interview</option>
                      <option value="reference-check">Reference Check</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
                <button
                  onClick={closeFeedbackForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors font-['Roboto']"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InterviewerLayout>
  );
};

export default PendingFeedback;