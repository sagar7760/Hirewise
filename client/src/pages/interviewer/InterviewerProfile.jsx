import React, { useState } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';

const InterviewerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'Michael Chen',
    email: 'michael.chen@hirewise.com',
    phone: '+1 (555) 987-6543',
    role: 'Senior Technical Interviewer',
    status: 'Active',
    profilePicture: null,
    department: 'Engineering',
    specialization: 'Frontend & Full-Stack',
    joinedOn: '2024-05-20',
    addedBy: 'HR Manager Sarah',
    organizationName: 'TechCorp Solutions',
    organizationLogo: '/api/placeholder/100/40',
    interviewStats: {
      totalInterviews: 156,
      averageRating: 4.2,
      responseTime: '2.1 days'
    },
    notifications: {
      interviewReminders: true,
      candidateUpdates: true,
      feedbackDeadlines: true,
      scheduleChanges: true,
      weeklyReports: false,
      emailDigests: true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [phoneData, setPhoneData] = useState({
    newPhone: profileData.phone
  });

  const handleProfileUpdate = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationUpdate = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }));
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Handle password change logic here
    console.log('Password change requested');
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePhoneChange = (e) => {
    e.preventDefault();
    setProfileData(prev => ({ ...prev, phone: phoneData.newPhone }));
    setShowPhoneModal(false);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, profilePicture: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black font-['Open_Sans']">
                Interviewer Profile
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Manage your profile information and interview preferences
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center ${
                isEditing 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                  : 'bg-black hover:bg-gray-800 text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isEditing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                )}
              </svg>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4 font-['Open_Sans']">
                Profile Picture
              </h3>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
                  {profileData.profilePicture ? (
                    <img 
                      src={profileData.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                {isEditing && (
                  <div>
                    <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors cursor-pointer">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-black mb-4 font-['Open_Sans']">
                Organization
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <img 
                    src={profileData.organizationLogo} 
                    alt="Organization Logo" 
                    className="w-12 h-12 rounded-lg bg-gray-100 mr-3"
                  />
                  <div>
                    <p className="font-medium text-black font-['Open_Sans']">
                      {profileData.organizationName}
                    </p>
                    <p className="text-sm text-gray-500 font-['Roboto']">
                      Organization
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 font-['Roboto']">Department</label>
                      <p className="text-black font-['Open_Sans']">{profileData.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 font-['Roboto']">Specialization</label>
                      <p className="text-black font-['Open_Sans']">{profileData.specialization}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 font-['Roboto']">Joined On</label>
                      <p className="text-black font-['Open_Sans']">{new Date(profileData.joinedOn).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 font-['Roboto']">Added By</label>
                      <p className="text-black font-['Open_Sans']">{profileData.addedBy}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-black mb-4 font-['Open_Sans']">
                Interview Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-['Roboto']">Total Interviews</span>
                  <span className="text-lg font-semibold text-black font-['Open_Sans']">
                    {profileData.interviewStats.totalInterviews}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-['Roboto']">Average Rating</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-black font-['Open_Sans'] mr-1">
                      {profileData.interviewStats.averageRating}
                    </span>
                    <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-['Roboto']">Avg. Response Time</span>
                  <span className="text-lg font-semibold text-black font-['Open_Sans']">
                    {profileData.interviewStats.responseTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-black mb-6 font-['Open_Sans']">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => handleProfileUpdate('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black"
                    />
                  ) : (
                    <p className="text-black py-2 font-['Open_Sans']">{profileData.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Email Address
                  </label>
                  <p className="text-black py-2 font-['Open_Sans']">{profileData.email}</p>
                  <p className="text-xs text-gray-500 font-['Roboto']">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Phone Number
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-black py-2 font-['Open_Sans'] flex-1">{profileData.phone}</p>
                    <button
                      onClick={() => setShowPhoneModal(true)}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded font-['Roboto'] transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Role
                  </label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium font-['Roboto']">
                      {profileData.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Specialization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.specialization}
                      onChange={(e) => handleProfileUpdate('specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black"
                    />
                  ) : (
                    <p className="text-black py-2 font-['Open_Sans']">{profileData.specialization}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Status
                  </label>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium font-['Roboto'] ${
                      profileData.status === 'Active' 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profileData.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-black mb-6 font-['Open_Sans']">
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-sm font-medium text-black font-['Open_Sans']">
                      Password
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Last changed 3 weeks ago
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-6 font-['Open_Sans']">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black font-['Open_Sans']">
                      Interview Reminders
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Get notified 30 minutes before scheduled interviews
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.interviewReminders}
                      onChange={(e) => handleNotificationUpdate('interviewReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black font-['Open_Sans']">
                      Candidate Updates
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Notifications when candidates upload new materials
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.candidateUpdates}
                      onChange={(e) => handleNotificationUpdate('candidateUpdates', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black font-['Open_Sans']">
                      Feedback Deadlines
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Reminders for pending interview feedback
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.feedbackDeadlines}
                      onChange={(e) => handleNotificationUpdate('feedbackDeadlines', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black font-['Open_Sans']">
                      Schedule Changes
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Alerts for interview reschedules and cancellations
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.scheduleChanges}
                      onChange={(e) => handleNotificationUpdate('scheduleChanges', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black font-['Open_Sans']">
                      Email Digests
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Daily summary of interview activities and updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.emailDigests}
                      onChange={(e) => handleNotificationUpdate('emailDigests', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black font-['Open_Sans']">
                      Weekly Reports
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Summary of your interview metrics and performance
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.weeklyReports}
                      onChange={(e) => handleNotificationUpdate('weeklyReports', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black mb-4 font-['Open_Sans']">
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phone Change Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black mb-4 font-['Open_Sans']">
              Change Phone Number
            </h3>
            <form onSubmit={handlePhoneChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    New Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneData.newPhone}
                    onChange={(e) => setPhoneData(prev => ({ ...prev, newPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Update Phone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </InterviewerLayout>
  );
};

export default InterviewerProfile;