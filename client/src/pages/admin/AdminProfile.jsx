import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [profileData] = useState({
    personalInfo: {
      firstName: 'John',
      lastName: 'Anderson',
      email: 'john.anderson@hirewise.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1985-06-15',
      avatar: null
    },
    professionalInfo: {
      jobTitle: 'System Administrator',
      department: 'IT & Operations',
      employeeId: 'ADM001',
      joiningDate: '2022-01-15',
      reportingTo: 'CEO',
      workLocation: 'San Francisco, CA'
    },
    contactInfo: {
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'California',
      zipCode: '94102',
      country: 'United States',
      emergencyContact: {
        name: 'Jane Anderson',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543'
      }
    },
    preferences: {
      timezone: 'America/Los_Angeles',
      language: 'English',
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        sms: false,
        push: true,
        weeklyReports: true
      }
    },
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: '2024-08-15',
      loginHistory: [
        { date: '2025-09-09', time: '09:30 AM', location: 'San Francisco, CA', device: 'Chrome on MacOS' },
        { date: '2025-09-08', time: '08:45 AM', location: 'San Francisco, CA', device: 'Chrome on MacOS' },
        { date: '2025-09-07', time: '09:15 AM', location: 'San Francisco, CA', device: 'Safari on iPhone' }
      ]
    }
  });

  const [editedData, setEditedData] = useState({ ...profileData });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // TODO: Save profile data to backend
    console.log('Saving profile data:', editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...profileData });
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // TODO: Upload file to server
      console.log('Avatar uploaded:', file);
      setEditedData({
        ...editedData,
        personalInfo: {
          ...editedData.personalInfo,
          avatar: URL.createObjectURL(file)
        }
      });
    }
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    // TODO: Change password via API
    console.log('Changing password');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowChangePassword(false);
  };

  const handleNotificationChange = (setting, value) => {
    setEditedData({
      ...editedData,
      preferences: {
        ...editedData.preferences,
        notifications: {
          ...editedData.preferences.notifications,
          [setting]: value
        }
      }
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                Admin Profile
              </h1>
              <p className="text-gray-600 font-['Roboto']">
                Manage your personal information and account settings.
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-3">
                  Profile Photo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {(isEditing ? editedData.personalInfo.avatar : profileData.personalInfo.avatar) ? (
                      <img
                        src={isEditing ? editedData.personalInfo.avatar : profileData.personalInfo.avatar}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-600 font-['Open_Sans']">
                          {profileData.personalInfo.firstName[0]}{profileData.personalInfo.lastName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Change Photo
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.personalInfo.firstName}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      personalInfo: { ...editedData.personalInfo, firstName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.personalInfo.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.personalInfo.lastName}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      personalInfo: { ...editedData.personalInfo, lastName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.personalInfo.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedData.personalInfo.email}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      personalInfo: { ...editedData.personalInfo, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.personalInfo.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedData.personalInfo.phone}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      personalInfo: { ...editedData.personalInfo, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.personalInfo.phone}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedData.personalInfo.dateOfBirth}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      personalInfo: { ...editedData.personalInfo, dateOfBirth: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">
                    {new Date(profileData.personalInfo.dateOfBirth).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Professional Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Job Title
                </label>
                <p className="text-gray-900 font-['Roboto'] py-2">{profileData.professionalInfo.jobTitle}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Department
                </label>
                <p className="text-gray-900 font-['Roboto'] py-2">{profileData.professionalInfo.department}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Employee ID
                </label>
                <p className="text-gray-900 font-['Roboto'] py-2">{profileData.professionalInfo.employeeId}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Joining Date
                </label>
                <p className="text-gray-900 font-['Roboto'] py-2">
                  {new Date(profileData.professionalInfo.joiningDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Reporting To
                </label>
                <p className="text-gray-900 font-['Roboto'] py-2">{profileData.professionalInfo.reportingTo}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Work Location
                </label>
                <p className="text-gray-900 font-['Roboto'] py-2">{profileData.professionalInfo.workLocation}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.contactInfo.address}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contactInfo: { ...editedData.contactInfo, address: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.contactInfo.city}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contactInfo: { ...editedData.contactInfo, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.contactInfo.state}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contactInfo: { ...editedData.contactInfo, state: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  ZIP Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.contactInfo.zipCode}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contactInfo: { ...editedData.contactInfo, zipCode: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.zipCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Country
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.contactInfo.country}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contactInfo: { ...editedData.contactInfo, country: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.country}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.contactInfo.emergencyContact.name}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          contactInfo: {
                            ...editedData.contactInfo,
                            emergencyContact: { ...editedData.contactInfo.emergencyContact, name: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                      />
                    ) : (
                      <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.emergencyContact.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Relationship
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.contactInfo.emergencyContact.relationship}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          contactInfo: {
                            ...editedData.contactInfo,
                            emergencyContact: { ...editedData.contactInfo.emergencyContact, relationship: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                      />
                    ) : (
                      <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.emergencyContact.relationship}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedData.contactInfo.emergencyContact.phone}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          contactInfo: {
                            ...editedData.contactInfo,
                            emergencyContact: { ...editedData.contactInfo.emergencyContact, phone: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                      />
                    ) : (
                      <p className="text-gray-900 font-['Roboto'] py-2">{profileData.contactInfo.emergencyContact.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Preferences
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Timezone
                </label>
                {isEditing ? (
                  <select
                    value={editedData.preferences.timezone}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      preferences: { ...editedData.preferences, timezone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  >
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.preferences.timezone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Language
                </label>
                {isEditing ? (
                  <select
                    value={editedData.preferences.language}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      preferences: { ...editedData.preferences, language: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.preferences.language}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Date Format
                </label>
                {isEditing ? (
                  <select
                    value={editedData.preferences.dateFormat}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      preferences: { ...editedData.preferences, dateFormat: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{profileData.preferences.dateFormat}</p>
                )}
              </div>

              {/* Notification Preferences */}
              <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                    { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly summary reports' }
                  ].map((notification) => (
                    <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                          {notification.label}
                        </h4>
                        <p className="text-sm text-gray-500 font-['Roboto']">
                          {notification.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEditing ? editedData.preferences.notifications[notification.key] : profileData.preferences.notifications[notification.key]}
                          onChange={(e) => isEditing && handleNotificationChange(notification.key, e.target.checked)}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className={`relative w-11 h-6 rounded-full transition-colors ${
                          isEditing 
                            ? (editedData.preferences.notifications[notification.key] ? 'bg-gray-800' : 'bg-gray-200')
                            : (profileData.preferences.notifications[notification.key] ? 'bg-gray-800' : 'bg-gray-200')
                        }`}>
                          <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all ${
                            (isEditing ? editedData.preferences.notifications[notification.key] : profileData.preferences.notifications[notification.key]) ? 'translate-x-full' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Security & Access
            </h2>
            
            <div className="space-y-6">
              {/* Password */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                    Password
                  </h3>
                  <p className="text-sm text-gray-500 font-['Roboto']">
                    Last changed: {new Date(profileData.security.lastPasswordChange).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Change Password
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-500 font-['Roboto']">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    profileData.security.twoFactorEnabled 
                      ? 'bg-gray-200 text-gray-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {profileData.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors">
                    {profileData.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              {/* Login History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                  Recent Login Activity
                </h3>
                <div className="space-y-3">
                  {profileData.security.loginHistory.map((login, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 font-['Roboto']">
                          {login.device}
                        </p>
                        <p className="text-xs text-gray-500 font-['Roboto']">
                          {login.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900 font-['Roboto']">{login.date}</p>
                        <p className="text-xs text-gray-500 font-['Roboto']">{login.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium font-['Roboto'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
