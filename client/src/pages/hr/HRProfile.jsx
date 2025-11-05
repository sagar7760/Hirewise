import React, { useState, useEffect } from 'react';
import HRLayout from '../../components/layout/HRLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useApiRequest } from '../../hooks/useApiRequest';

const HRProfile = () => {
  const { user, updateUser } = useAuth();
  const { makeJsonRequest } = useApiRequest();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    profilePicture: null,
    department: '',
    joiningDate: '',
    jobTitle: '',
    company: null,
    notifications: {
      emailAlerts: true,
      interviewUpdates: true,
      applicationNotifications: true,
      weeklyReports: false
    }
  });

  // Store original data for cancel functionality
  const [originalProfileData, setOriginalProfileData] = useState({});

  const [phoneData, setPhoneData] = useState({
    newPhone: ''
  });

  // Helper functions for date formatting
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    } catch (error) {
      return 'Not set';
    }
  };

  // Load profile data from backend
  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeJsonRequest('/api/hr/profile');
      
      if (response) {
        const profileInfo = {
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          email: response.email || '',
          phone: response.phone || '',
          role: response.role || '',
          status: response.isActive ? 'Active' : 'Inactive',
          profilePicture: response.avatar || null,
          department: response.department || '',
          joiningDate: response.joiningDate || response.createdAt || '',
          jobTitle: response.jobTitle || '',
          company: response.company || null,
          notifications: response.notifications || {
            emailAlerts: true,
            interviewUpdates: true,
            applicationNotifications: true,
            weeklyReports: false
          }
        };
        
        setProfileData(profileInfo);
        setOriginalProfileData(profileInfo); // Store original data for cancel functionality
        
        setPhoneData({
          newPhone: response.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save profile data to backend
  const saveProfileData = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        department: profileData.department,
        jobTitle: profileData.jobTitle,
        notifications: profileData.notifications
      };

      const response = await makeJsonRequest('/api/hr/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response) {
        setIsEditing(false);
        setOriginalProfileData(profileData); // Update original data after successful save
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing and revert changes
  const cancelEditing = () => {
    setProfileData(originalProfileData);
    setIsEditing(false);
    setError(null);
  };

  // Load data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState({ current: false, new: false, confirm: false });

  const passwordValidation = {
    current: !passwordData.currentPassword ? 'Current password is required' : '',
    new:
      !passwordData.newPassword
        ? 'New password is required'
        : passwordData.newPassword.length < 8
        ? 'New password must be at least 8 characters'
        : passwordData.newPassword === passwordData.currentPassword
        ? 'New password must be different from current password'
        : '',
    confirm:
      !passwordData.confirmPassword
        ? 'Please confirm your new password'
        : passwordData.newPassword !== passwordData.confirmPassword
        ? 'Passwords do not match'
        : ''
  };
  const isPasswordFormValid = !passwordValidation.current && !passwordValidation.new && !passwordValidation.confirm;

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    if (!isPasswordFormValid) return; // Client-side validation gate
    try {
      setChangingPassword(true);
      setError(null);
      const response = await makeJsonRequest('/api/hr/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response && response.success) {
        // Provide inline success feedback and close
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      // Prefer server-provided message, map common statuses for clarity
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      const status = error?.response?.status;
      if (status === 400 || status === 401) {
        setPasswordError(serverMsg || 'Current password is incorrect');
      } else {
        setPasswordError(serverMsg || error.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhoneChange = (e) => {
    e.preventDefault();
    setProfileData(prev => ({ ...prev, phone: phoneData.newPhone }));
    setShowPhoneModal(false);
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Profile picture must be smaller than 5MB. Please choose a smaller file.');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload only image files (JPEG, JPG, PNG, GIF).');
        return;
      }

      try {
        setError(null);
        
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64Data = event.target.result;
            
            const response = await makeJsonRequest('/api/hr/profile/avatar', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                imageData: base64Data
              })
            });

            if (response && response.avatarData) {
              setProfileData(prev => ({ 
                ...prev, 
                profilePicture: response.avatarData 
              }));
              
              // Update the user context so the navbar shows the new profile picture
              updateUser({
                ...user,
                avatar: response.avatarData
              });
              
              alert('Profile picture updated successfully!');
            } else {
                 setError(response?.error || 'Failed to upload profile picture.');
            }
          } catch (error) {
            console.error('Error uploading profile picture:', error);
            setError(error.message || 'Failed to upload profile picture. Please try again.');
          }
        };
        
        reader.onerror = () => {
          setError('Failed to read the selected file. Please try again.');
        };
        
        // Convert file to base64
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process the selected file. Please try again.');
      }
    }
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                HR Profile
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Manage your profile information and preferences
              </p>
            </div>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={cancelEditing}
                    disabled={saving || loading}
                    className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center border border-gray-300 dark:border-gray-600 ${
                      (saving || loading) ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    onClick={saveProfileData}
                    disabled={saving || loading}
                    className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={saving || loading}
                  className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg transition-colors duration-300">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300 font-['Roboto']">Loading profile...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">
                  Profile Picture
                </h3>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 overflow-hidden">
                    {profileData.profilePicture ? (
                      <img 
                        src={profileData.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  {isEditing && (
                    <div>
                      <label className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors cursor-pointer">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center font-['Roboto']">
                        Max size: 5MB (JPEG, PNG, GIF)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">
                  Organization
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                      {profileData.company?.logo ? (
                        <img 
                          src={profileData.company.logo} 
                          alt="Company Logo" 
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                        />
                      ) : null}
                      <svg 
                        className={`w-6 h-6 text-gray-600 dark:text-gray-400 stroke-current ${profileData.company?.logo ? 'hidden' : 'block'}`} 
                        fill="none" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H7m5 0v-9a1 1 0 011-1h2a1 1 0 011 1v9m-4 0h4m-4 0v-2m0 0h.01M12 7h.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                        {profileData.company?.name || 'Organization'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                        {profileData.company?.website || 'Website'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Department</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => handleProfileUpdate('department', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-['Open_Sans']">{profileData.department}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Joined On</label>
                      <p className="text-gray-900 dark:text-white font-['Open_Sans']">
                        {profileData.joiningDate ? new Date(profileData.joiningDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Job Title</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.jobTitle}
                          onChange={(e) => handleProfileUpdate('jobTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-['Open_Sans']">{profileData.jobTitle || 'HR'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Profile Info */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-['Open_Sans']">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white py-2 font-['Open_Sans']">{profileData.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white py-2 font-['Open_Sans']">{profileData.lastName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">Email Address</label>
                    <p className="text-gray-900 dark:text-white py-2 font-['Open_Sans']">{profileData.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">Phone Number</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 dark:text-white py-2 font-['Open_Sans'] flex-1">{profileData.phone}</p>
                      <button
                        onClick={() => setShowPhoneModal(true)}
                        className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">Role</label>
                    <div className="flex items-center">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium font-['Roboto']">
                        {profileData.role}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">Status</label>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium font-['Roboto'] ${
                        profileData.status === 'Active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}>
                        {profileData.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-['Open_Sans']">
                  Security Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">Password</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">Last changed 2 months ago</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-['Open_Sans']">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'emailAlerts', label: 'Email Alerts for New Applicants', description: 'Get notified when someone applies to your job posts' },
                    { key: 'interviewUpdates', label: 'Interview Updates', description: 'Notifications about interview scheduling and feedback' },
                    { key: 'applicationNotifications', label: 'Application Status Changes', description: 'Updates when application status changes' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Summary of hiring activities and metrics' }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">{label}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.notifications[key]}
                          onChange={(e) => handleNotificationUpdate(key, e.target.checked)}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-800 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black dark:peer-checked:bg-white ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md dark:border dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">Current Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisible.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => { setPasswordError(null); setPasswordData(prev => ({ ...prev, currentPassword: e.target.value })); }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700 ${passwordValidation.current || passwordError ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        required
                      />
                      <button type="button" onClick={() => setPasswordVisible(p => ({ ...p, current: !p.current }))} className="absolute inset-y-0 right-2 px-2 text-gray-500 dark:text-gray-400">
                        {passwordVisible.current ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {(passwordValidation.current || passwordError) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-['Roboto']">{passwordError || passwordValidation.current}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">New Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisible.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => { setPasswordError(null); setPasswordData(prev => ({ ...prev, newPassword: e.target.value })); }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700 ${passwordValidation.new ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        required
                      />
                      <button type="button" onClick={() => setPasswordVisible(p => ({ ...p, new: !p.new }))} className="absolute inset-y-0 right-2 px-2 text-gray-500 dark:text-gray-400">
                        {passwordVisible.new ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className={`mt-1 text-xs font-['Roboto'] ${passwordValidation.new ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {passwordValidation.new || 'Minimum 8 characters. Use a mix of letters, numbers, and symbols.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisible.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => { setPasswordError(null); setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value })); }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700 ${passwordValidation.confirm ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        required
                      />
                      <button type="button" onClick={() => setPasswordVisible(p => ({ ...p, confirm: !p.confirm }))} className="absolute inset-y-0 right-2 px-2 text-gray-500 dark:text-gray-400">
                        {passwordVisible.confirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordValidation.confirm && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-['Roboto']">{passwordValidation.confirm}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isPasswordFormValid || changingPassword}
                    className={`px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors text-white dark:text-black ${(!isPasswordFormValid || changingPassword) ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'}`}
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Phone Change Modal */}
        {showPhoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md dark:border dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Change Phone Number</h3>
              <form onSubmit={handlePhoneChange}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">New Phone Number</label>
                    <input
                      type="tel"
                      value={phoneData.newPhone}
                      onChange={(e) => setPhoneData(prev => ({ ...prev, newPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white dark:bg-gray-700"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(false)}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Update Phone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </HRLayout>
    );
  };

export default HRProfile;