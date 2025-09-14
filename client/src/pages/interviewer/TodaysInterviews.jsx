import React, { useState } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';

const TodaysInterviews = () => {
  const [todaysInterviews] = useState([
    {
      id: 1,
      candidateName: 'Sarah Johnson',
      jobTitle: 'Frontend Developer',
      time: '10:00 AM',
      duration: '60 min',
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      resumeLink: '/resumes/sarah-johnson.pdf'
    },
    {
      id: 2,
      candidateName: 'Mike Chen',
      jobTitle: 'Full Stack Developer',
      time: '2:00 PM',
      duration: '45 min',
      status: 'scheduled',
      meetingLink: 'https://zoom.us/j/123456789',
      resumeLink: '/resumes/mike-chen.pdf'
    },
    {
      id: 3,
      candidateName: 'Emily Davis',
      jobTitle: 'UI/UX Designer',
      time: '4:30 PM',
      duration: '60 min',
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/xyz-uvw-rst',
      resumeLink: '/resumes/emily-davis.pdf'
    }
  ]);

  const handleStartInterview = (interview) => {
    console.log('Starting interview with:', interview.candidateName);
    // Open meeting link
    window.open(interview.meetingLink, '_blank');
  };

  const handleViewDetails = (interview) => {
    console.log('Viewing details for:', interview.candidateName);
    // Navigate to detailed view
  };

  const handleViewResume = (interview) => {
    console.log('Viewing resume for:', interview.candidateName);
    // Open resume in new tab
    window.open(interview.resumeLink, '_blank');
  };

  const getCurrentTimeStatus = (timeString) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const interviewTime = (period === 'PM' && hours !== 12 ? hours + 12 : hours) * 60 + minutes;
    
    const timeDiff = interviewTime - currentTime;
    
    if (timeDiff <= 0) {
      return { status: 'ongoing', text: 'In Progress' };
    } else if (timeDiff <= 30) {
      return { status: 'soon', text: `Starts in ${timeDiff} min` };
    } else {
      return { status: 'scheduled', text: timeString };
    }
  };

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Today's Interviews</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Completed</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">0</p>
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
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Remaining</p>
                <p className="text-2xl font-bold text-black font-['Open_Sans']">{todaysInterviews.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interviews Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black font-['Open_Sans']">Interview Schedule</h2>
            <p className="text-sm text-gray-600 font-['Roboto']">Your interviews scheduled for today</p>
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
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todaysInterviews.map((interview) => {
                  const timeStatus = getCurrentTimeStatus(interview.time);
                  return (
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-['Roboto']">
                        {interview.jobTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black font-['Roboto']">
                          {timeStatus.text}
                        </div>
                        {timeStatus.status === 'soon' && (
                          <div className="text-xs text-orange-600 font-['Roboto'] font-medium">
                            Starting Soon
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-['Roboto']">
                        {interview.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${
                          timeStatus.status === 'ongoing' 
                            ? 'bg-black text-white' 
                            : timeStatus.status === 'soon'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {timeStatus.status === 'ongoing' ? 'In Progress' : 
                           timeStatus.status === 'soon' ? 'Starting Soon' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleStartInterview(interview)}
                          className="bg-black text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
                        >
                          Start Interview
                        </button>
                        <button
                          onClick={() => handleViewDetails(interview)}
                          className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors font-['Roboto']"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleViewResume(interview)}
                          className="bg-white text-black border border-gray-300 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors font-['Roboto']"
                        >
                          Resume
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {todaysInterviews.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Open_Sans']">No interviews today</h3>
              <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                You don't have any interviews scheduled for today.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors font-['Roboto']">
              View Calendar
            </button>
            <button className="bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors font-['Roboto']">
              Reschedule Interview
            </button>
            <button className="bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors font-['Roboto']">
              Add Notes
            </button>
          </div>
        </div>
      </div>
    </InterviewerLayout>
  );
};

export default TodaysInterviews;