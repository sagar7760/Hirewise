import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { useApiRequest } from '../../hooks/useApiRequest';

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { makeJsonRequest, makeRequest } = useApiRequest();
  const { user, updateUser } = useAuth();

  // Helper functions for date formatting
  const getDateFormatParts = (format) => {
    // Supported: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
    switch (format) {
      case 'DD/MM/YYYY': return { order: ['d','m','y'], sep: '/' }; 
      case 'YYYY-MM-DD': return { order: ['y','m','d'], sep: '-' }; 
      default: return { order: ['m','d','y'], sep: '/' }; // MM/DD/YYYY
    }
  };

  const pad = (n) => n.toString().padStart(2,'0');

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';
      const fmt = profileData?.preferences?.dateFormat || editedData?.preferences?.dateFormat || 'MM/DD/YYYY';
      const { order, sep } = getDateFormatParts(fmt);
      const d = pad(date.getDate());
      const m = pad(date.getMonth()+1);
      const y = date.getFullYear();
      const map = { d, m, y };
      return order.map(p=>map[p]).join(sep);
    } catch {
      return 'Not set';
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format for input
    } catch (error) {
      return '';
    }
  };

  const parseDateFromInput = (inputValue) => {
    if (!inputValue) return '';
    return inputValue; // Input already gives us YYYY-MM-DD format
  };
  
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      avatar: null
    },
    professionalInfo: {
      jobTitle: 'System Administrator',
      department: 'IT & Operations',
      employeeId: 'ADM001',
      joiningDate: '',
      reportingTo: 'CEO',
      workLocation: ''
    },
    contactInfo: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
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
      twoFactorEnabled: false,
      lastPasswordChange: '',
      loginHistory: []
    }
  });

  const [editedData, setEditedData] = useState({ ...profileData });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const toast = useToast();
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // keyed by path e.g. personalInfo.email

  // Load profile data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Update editedData when profileData changes
  useEffect(() => {
    if (profileData && Object.keys(profileData).length > 0) {
      setEditedData({ ...profileData });
    }
  }, [profileData]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeJsonRequest('/api/admin/profile');
      console.log('Profile data loaded:', response);
      
      if (response.success && response.data) {
        setProfileData(response.data);
        // editedData will be updated via useEffect above
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const validateProfile = () => {
    const errors = {};
    const email = editedData.personalInfo.email?.trim();
    const phone = editedData.personalInfo.phone?.trim();
    const dob = editedData.personalInfo.dateOfBirth;
    if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) errors['personalInfo.email'] = 'Invalid email format';
    if (phone && !/^[0-9+()\-\s]{7,20}$/.test(phone)) errors['personalInfo.phone'] = 'Invalid phone number';
    if (dob) {
      const dt = new Date(dob);
      if (isNaN(dt.getTime())) errors['personalInfo.dateOfBirth'] = 'Invalid date';
      else if (dt > new Date()) errors['personalInfo.dateOfBirth'] = 'Date cannot be in the future';
    }
    setFieldErrors(errors);
    return errors;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null); // Clear any previous errors
      const validationErrors = validateProfile();
      if (Object.keys(validationErrors).length) {
        setError('Please fix the highlighted fields');
        toast.error('Please fix validation errors');
        return;
      }
      
      // Prepare form data for upload
      const formData = new FormData();
      formData.append('profileData', JSON.stringify(editedData));
      
      // Add avatar file if it was changed
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      console.log('Saving profile data:', editedData);
      // Use makeJsonRequest so we get parsed JSON (previously we were checking properties on the raw Response object)
      const json = await makeJsonRequest('/api/admin/profile', {
        method: 'PUT',
        body: formData
      });

      console.log('Save response (parsed json):', json);

      if (json && json.success) {
        const updated = json.data || {};
        setProfileData(updated);
        // Update the user in AuthContext so navbar shows updated profile picture & name
        if (user && updated.personalInfo) {
          const updatedUser = {
            ...user,
            profilePicture: updated.personalInfo.avatar,
            avatar: updated.personalInfo.avatar,
            firstName: updated.personalInfo.firstName,
            lastName: updated.personalInfo.lastName,
            email: updated.personalInfo.email
          };
          updateUser(updatedUser);

          // If backend responded with placeholder token instead of actual base64, fetch the real avatar
          if (updated.personalInfo.avatar === 'base64_stored') {
            try {
              const avatarResp = await makeJsonRequest('/api/admin/profile/avatar');
              if (avatarResp?.success && avatarResp.avatar) {
                updateUser({
                  ...updatedUser,
                  profilePicture: avatarResp.avatar,
                  avatar: avatarResp.avatar
                });
              }
            } catch (e) {
              console.warn('Could not fetch full avatar data after save:', e.message);
            }
          }
        }
        setIsEditing(false);
        setAvatarFile(null);
        const now = new Date();
        setLastSavedAt(now);
        toast.success('Profile saved successfully');
      } else {
        // Backend might return success false with 200 status
        const msg = (json && (json.message || json.error)) || 'Failed to save profile. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const msg = error.message || 'Failed to save profile. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...profileData });
    setAvatarFile(null);
    setError(null); // Clear any errors
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Avatar selected:', file.name);
      setAvatarFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setEditedData({
        ...editedData,
        personalInfo: {
          ...editedData.personalInfo,
          avatar: previewUrl
        }
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in current and new password');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      setPasswordChanging(true);
      const resp = await makeJsonRequest('/api/admin/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      });
      if (resp.success) {
        toast.success('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
        // Update last password change date locally
        setProfileData(prev => ({
          ...prev,
          security: { ...prev.security, lastPasswordChange: new Date().toISOString().split('T')[0] }
        }));
      } else {
        toast.error(resp.error || resp.message || 'Failed to change password');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
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

  const renderContent = (value, isEditable, section, key, subKey = null) => {
    let data;
    let editedValue;
    if (section) {
      if (subKey) {
        data = profileData[section][key] ? profileData[section][key][subKey] : '';
        editedValue = editedData[section][key] ? editedData[section][key][subKey] : '';
      } else {
        data = profileData[section][key];
        editedValue = editedData[section][key];
      }
    } else {
      data = value;
      editedValue = value;
    }

    const fieldKey = subKey || key;
    const path = subKey ? `${section}.${key}.${subKey}` : `${section}.${key}`;
    const errorMsg = fieldErrors[path];

    if (isEditable && isEditing) {
      const type = fieldKey && fieldKey.toLowerCase().includes('date') ? 'date' : 'text';
      return (
        <>
          <input
            type={type}
            value={type === 'date' ? formatDateForInput(editedValue) : (editedValue || '')}
            onChange={(e) => {
              const newValue = type === 'date' ? parseDateFromInput(e.target.value) : e.target.value;
              setEditedData(prev => ({
                ...prev,
                [section]: {
                  ...prev[section],
                  [key]: subKey
                    ? { ...prev[section][key], [subKey]: newValue }
                    : newValue
                }
              }));
              // Clear field error on change
              if (fieldErrors[path]) setFieldErrors(fe => { const c = { ...fe }; delete c[path]; return c; });
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300 ${errorMsg ? 'border-red-500 dark:border-red-500 ring-red-500 focus:ring-red-600' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errorMsg && <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-['Roboto']">{errorMsg}</p>}
        </>
      );
    }

    const displayValue = fieldKey && fieldKey.toLowerCase().includes('date')
      ? formatDateForDisplay(data)
      : (data || '—');
    return (
      <p className="text-gray-900 dark:text-white font-['Roboto'] py-2 transition-colors duration-300">
        {displayValue}
      </p>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {(loading || saving) && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">{loading ? 'Loading profile...' : 'Saving...'}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded transition-colors duration-300">
            {error}
          </div>
        )}

        {/* Profile Content */}
        {!loading && (
          <div>
            {/* Header */}
            <div className="mb-8">
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-2 transition-colors duration-300">
                  Admin Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                  Manage your personal information and account settings.
                </p>
              </div>
              {/* Saved timestamp */}
              {lastSavedAt && !isEditing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-['Roboto']">Last saved at {lastSavedAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
              )}
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button disabled={saving}
                    onClick={handleSave}
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed text-white dark:text-black px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
            </div>

            <div className="space-y-8">
              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Avatar Section */}
                  <div className="md:col-span-2 border-b border-gray-200 dark:border-gray-700 pb-6 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-3">
                      Profile Photo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {(isEditing ? editedData.personalInfo.avatar : profileData.personalInfo.avatar) ? (
                          <img
                            src={isEditing ? editedData.personalInfo.avatar : profileData.personalInfo.avatar}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-600 dark:text-gray-400 font-['Open_Sans']">
                              {(profileData.personalInfo.firstName && profileData.personalInfo.firstName[0]) || ''}
                              {(profileData.personalInfo.lastName && profileData.personalInfo.lastName[0]) || ''}
                              {(!profileData.personalInfo.firstName && !profileData.personalInfo.lastName) && '?'}
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
                            className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            Change Photo
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">First Name</label>
                    {renderContent(null, true, 'personalInfo', 'firstName')}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Last Name</label>
                    {renderContent(null, true, 'personalInfo', 'lastName')}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Email Address</label>
                    {renderContent(null, true, 'personalInfo', 'email')}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Phone Number</label>
                    {renderContent(null, true, 'personalInfo', 'phone')}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Date of Birth</label>
                    {renderContent(null, true, 'personalInfo', 'dateOfBirth')}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Professional Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Job Title</label>
                    {renderContent(null, false, 'professionalInfo', 'jobTitle')}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Department</label>
                    {renderContent(null, false, 'professionalInfo', 'department')}
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Employee ID</label>
                    {renderContent(null, false, 'professionalInfo', 'employeeId')}
                  </div>

                  {/* Joining Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Joining Date</label>
                    {renderContent(null, false, 'professionalInfo', 'joiningDate')}
                  </div>

                  {/* Reporting To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Reporting To</label>
                    {renderContent(null, false, 'professionalInfo', 'reportingTo')}
                  </div>

                  {/* Work Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Work Location</label>
                    {renderContent(null, false, 'professionalInfo', 'workLocation')}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Contact Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Address</label>
                    {renderContent(null, true, 'contactInfo', 'address')}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">City</label>
                    {renderContent(null, true, 'contactInfo', 'city')}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">State</label>
                    {renderContent(null, true, 'contactInfo', 'state')}
                  </div>

                  {/* ZIP Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">ZIP Code</label>
                    {renderContent(null, true, 'contactInfo', 'zipCode')}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Country</label>
                    {renderContent(null, true, 'contactInfo', 'country')}
                  </div>

                  {/* Emergency Contact */}
                  <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Name</label>
                        {renderContent(null, true, 'contactInfo', 'emergencyContact', 'name')}
                      </div>

                      {/* Relationship */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Relationship</label>
                        {renderContent(null, true, 'contactInfo', 'emergencyContact', 'relationship')}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Phone</label>
                        {renderContent(null, true, 'contactInfo', 'emergencyContact', 'phone')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Preferences</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Timezone</label>
                    {isEditing ? (
                      <select
                        value={editedData.preferences.timezone}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          preferences: { ...editedData.preferences, timezone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                      >
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white font-['Roboto'] py-2">{profileData.preferences.timezone}</p>
                    )}
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Language</label>
                    {isEditing ? (
                      <select
                        value={editedData.preferences.language}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          preferences: { ...editedData.preferences, language: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white font-['Roboto'] py-2">{profileData.preferences.language}</p>
                    )}
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Date Format</label>
                    {isEditing ? (
                      <select
                        value={editedData.preferences.dateFormat}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          preferences: { ...editedData.preferences, dateFormat: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white font-['Roboto'] py-2">{profileData.preferences.dateFormat}</p>
                    )}
                  </div>

                  {/* Notification Preferences */}
                  <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                        { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                        { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' },
                        { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly summary reports' }
                      ].map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors duration-300">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                              {notification.label}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
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
                                ? (editedData.preferences.notifications[notification.key] ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600')
                                : (profileData.preferences.notifications[notification.key] ? 'bg-gray-800' : 'bg-gray-300 dark:bg-gray-600')
                            }`}>
                              <div className={`absolute top-[2px] left-[2px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-transparent rounded-full h-5 w-5 transition-all ${
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
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Security & Access</h2>
                
                <div className="space-y-6">
                  {/* Password */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors duration-300">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">Password</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                        Last changed: {formatDateForDisplay(profileData.security.lastPasswordChange)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors duration-300">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors duration-300 ${
                        profileData.security.twoFactorEnabled 
                          ? 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {profileData.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors">
                        {profileData.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {/* Login History */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">Recent Login Activity</h3>
                    <div className="space-y-3">
                      {profileData.security.loginHistory.map((login, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-300">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white font-['Roboto']">{login.device}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{login.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-900 dark:text-white font-['Roboto']">{login.date}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">{login.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black/70 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">Change Password</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium font-['Roboto'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button disabled={passwordChanging}
                    onClick={handlePasswordChange}
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed text-white dark:text-black px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    {passwordChanging ? 'Changing...' : 'Change Password'}
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