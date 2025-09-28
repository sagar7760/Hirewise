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

  // Load profile data from backend
  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Making API request to /api/hr/profile'); // Debug log
      
      const response = await makeJsonRequest('/api/hr/profile');
      
      console.log('Profile response:', response); // Debug log
      
      if (response) {
        console.log('Profile response received:', response); // Debug log
        const profileInfo = {
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          email: response.email || '',
          phone: response.phone || '',
          role: response.role || '',
          status: response.isActive ? 'Active' : 'Inactive',
          profilePicture: response.avatar || null, // Now avatar contains base64 data directly
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
        
        console.log('Profile picture data:', profileInfo.profilePicture ? 'Base64 data present' : 'No avatar'); // Debug log
        console.log('Avatar from response:', response.avatar ? 'Present' : 'Null'); // Debug log
        
        setProfileData(profileInfo);
        setOriginalProfileData(profileInfo); // Store original data for cancel functionality
        
        setPhoneData({
          newPhone: response.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      console.error('Error details:', error.message, error.response?.data);
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

      console.log('Sending update data to backend:', updateData); // Debug log

      const response = await makeJsonRequest('/api/hr/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('Update response from backend:', response); // Debug log

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
    console.log('Current user from auth context:', user); // Debug log
    loadProfileData();
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
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
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(response?.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password. Please try again.');
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
      // Client-side validation before upload
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
            console.log('Converted image to base64, size:', base64Data.length); // Debug log

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
            }
          } catch (error) {
            console.error('Error uploading profile picture:', error);
            
            // Handle specific error messages from backend
            if (error.response && error.response.data) {
              const errorData = error.response.data;
              if (errorData.error === 'File too large') {
                setError('Profile picture must be smaller than 5MB. Please choose a smaller file.');
              } else if (errorData.error === 'Invalid image format') {
                setError('Please upload only image files (JPEG, JPG, PNG, GIF).');
              } else {
                setError(errorData.message || 'Failed to upload profile picture. Please try again.');
              }
            } else if (error.message) {
              setError(error.message);
            } else {
              setError('Failed to upload profile picture. Please try again.');
            }
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
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                HR Profile
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Manage your profile information and preferences
              </p>
            </div>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={cancelEditing}
                    disabled={saving || loading}
                    className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    onClick={saveProfileData}
                    disabled={saving || loading}
                    className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center bg-black hover:bg-gray-800 text-white ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={saving || loading}
                  className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center bg-black hover:bg-gray-800 text-white ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-2 text-gray-600 font-['Roboto']">Loading profile...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Open_Sans']">
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
                    <p className="text-xs text-gray-500 mt-2 text-center font-['Roboto']">
                      Maximum file size: 5MB<br />
                      Supported formats: JPEG, PNG, GIF
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Open_Sans']">
                Organization
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                    {profileData.company?.logo ? (
                      <img 
                        src={profileData.company.logo.startsWith('data:') 
                          ? profileData.company.logo 
                          : profileData.company.logo.startsWith('/') 
                            ? profileData.company.logo 
                            : `/uploads/company-logos/${profileData.company.logo}`
                        }
                        alt="Company Logo" 
                        className="w-8 h-8 rounded object-cover"
                        onError={(e) => {
                          console.log('Company logo failed to load:', profileData.company.logo);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <svg 
                      className={`w-6 h-6 text-gray-600 ${profileData.company?.logo ? 'hidden' : 'block'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{display: profileData.company?.logo ? 'none' : 'block'}}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H7m5 0v-9a1 1 0 011-1h2a1 1 0 011 1v9m-4 0h4m-4 0v-2m0 0h.01M12 7h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 font-['Open_Sans']">
                      {profileData.company?.name || 'Organization'}
                    </p>
                    <p className="text-sm text-gray-500 font-['Roboto']">
                      {profileData.company?.website || 'Company'}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 font-['Roboto']">Department</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => handleProfileUpdate('department', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
                        />
                      ) : (
                        <p className="text-gray-900 font-['Open_Sans']">{profileData.department}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 font-['Roboto']">Joined On</label>
                      <p className="text-gray-900 font-['Open_Sans']">
                        {profileData.joiningDate ? new Date(profileData.joiningDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 font-['Roboto']">Job Title</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.jobTitle}
                          onChange={(e) => handleProfileUpdate('jobTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
                        />
                      ) : (
                        <p className="text-gray-900 font-['Open_Sans']">{profileData.jobTitle || 'HR'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 font-['Open_Sans']">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
                    />
                  ) : (
                    <p className="text-gray-900 py-2 font-['Open_Sans']">{profileData.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
                    />
                  ) : (
                    <p className="text-gray-900 py-2 font-['Open_Sans']">{profileData.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Email Address
                  </label>
                  <p className="text-gray-900 py-2 font-['Open_Sans']">{profileData.email}</p>
                  <p className="text-xs text-gray-500 font-['Roboto']">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Phone Number
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900 py-2 font-['Open_Sans'] flex-1">{profileData.phone}</p>
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
                    Status
                  </label>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium font-['Roboto'] ${
                      profileData.status === 'Active' 
                        ? 'bg-gray-200 text-green-400' 
                        : 'bg-gray-200 text-red-400'
                    }`}>
                      {profileData.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 font-['Open_Sans']">
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                      Password
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Last changed 2 months ago
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
              <h3 className="text-lg font-semibold text-gray-900 mb-6 font-['Open_Sans']">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                      Email Alerts for New Applicants
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Get notified when someone applies to your job posts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.emailAlerts}
                      onChange={(e) => handleNotificationUpdate('emailAlerts', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                      Interview Updates
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Notifications about interview scheduling and feedback
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.interviewUpdates}
                      onChange={(e) => handleNotificationUpdate('interviewUpdates', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                      Application Status Changes
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Updates when application status changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.applicationNotifications}
                      onChange={(e) => handleNotificationUpdate('applicationNotifications', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                      Weekly Reports
                    </h4>
                    <p className="text-xs text-gray-500 font-['Roboto']">
                      Summary of hiring activities and metrics
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.notifications.weeklyReports}
                      onChange={(e) => handleNotificationUpdate('weeklyReports', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Open_Sans']">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Open_Sans']">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 bg-white"
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
    </HRLayout>
  );
};

export default HRProfile;
