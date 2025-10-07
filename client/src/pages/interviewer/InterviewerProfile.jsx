import React, { useState, useEffect, useCallback, useRef } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const InterviewerProfile = () => {
  const { apiRequest, user, updateUser } = useAuth();
  const toast = useToast();
  const notifDebounceRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [phoneData, setPhoneData] = useState({ newPhone: '' });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await apiRequest('/api/interviewer/profile');
      const data = await resp.json();
      if (data.success) {
        const pd = {
          fullName: `${data.data.firstName || ''} ${data.data.lastName || ''}`.trim(),
          email: data.data.email,
          phone: data.data.phone || '',
          role: 'Interviewer',
          status: data.data.status || 'Active',
          profilePicture: data.data.profilePicture || null,
          department: data.data.department || '',
          specialization: data.data.interviewerSettings?.specialization || data.data.specialization || '',
          joinedOn: data.data.joinedOn || user?.createdAt || '',
          addedOn: data.data.addedOn || data.data.joinedOn || user?.createdAt || '',
          addedBy: data.data.addedBy || null,
          organizationName: data.data.company?.name || user?.company?.name || '',
          organizationLogo: data.data.company?.logo || user?.company?.logo || null,
          interviewStats: data.data.interviewStats || { totalInterviews: 0, averageRating: null, responseTime: null },
          notifications: {
            ...data.data.interviewerSettings?.notificationPreferences
          }
        };
        setProfileData(pd);
        setPhoneData({ newPhone: pd.phone });
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (e) {
      setError(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleProfileUpdate = (field, value) => {
    setProfileData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleNotificationUpdate = (field, value) => {
    setProfileData(prev => prev ? ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }) : prev);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const resp = await apiRequest('/api/interviewer/profile/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      });
      const data = await resp.json();
      if (!data.success) {
        alert(data.message || 'Password change failed');
        return;
      }
  toast.success('Password updated');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e2) {
      alert(e2.message || 'Error updating password');
    }
  };

  const handlePhoneChange = async (e) => {
    e.preventDefault();
    try {
      const resp = await apiRequest('/api/interviewer/profile', {
        method: 'PATCH',
        body: JSON.stringify({ phone: phoneData.newPhone })
      });
      const data = await resp.json();
      if (!data.success) {
        alert(data.message || 'Failed to update phone');
        return;
      }
      setProfileData(prev => prev ? ({ ...prev, phone: phoneData.newPhone }) : prev);
      setShowPhoneModal(false);
      // reflect in global user
      if (user) updateUser({ ...user, phone: phoneData.newPhone });
    } catch (e2) {
      alert(e2.message || 'Phone update failed');
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }
    // optimistic preview
    const localUrl = URL.createObjectURL(file);
    setProfileData(prev => prev ? ({ ...prev, profilePicture: localUrl }) : prev);
    const form = new FormData();
    form.append('avatar', file);
    try {
      const resp = await apiRequest('/api/interviewer/profile/avatar', { method: 'POST', body: form });
      const data = await resp.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to upload avatar');
      } else if (data.avatar) {
        setProfileData(prev => prev ? ({ ...prev, profilePicture: data.avatar }) : prev);
        if (user) updateUser({ ...user, avatar: data.avatar, profilePicture: data.avatar });
        toast.success('Avatar updated');
      }
    } catch (e2) {
      toast.error(e2.message || 'Avatar upload failed');
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData) return;
    setSaving(true);
    try {
      const payload = {
        phone: profileData.phone,
        specialization: profileData.specialization,
        notificationPreferences: profileData.notifications
      };
      const resp = await apiRequest('/api/interviewer/profile', { method: 'PATCH', body: JSON.stringify(payload) });
      const data = await resp.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to save');
        return;
      }
      // sync global user specialization and phone
      if (user) updateUser({ ...user, phone: profileData.phone, interviewerSettings: { ...(user.interviewerSettings||{}), specialization: profileData.specialization } });
      setIsEditing(false);
      toast.success('Profile saved');
    } catch (e2) {
      toast.error(e2.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Debounced notification preference syncing
  useEffect(() => {
    if (!profileData) return;
    if (!profileData.notifications) return;
    if (notifDebounceRef.current) clearTimeout(notifDebounceRef.current);
    notifDebounceRef.current = setTimeout(async () => {
      try {
        await apiRequest('/api/interviewer/profile/notifications', {
          method: 'PATCH',
          body: JSON.stringify({ notificationPreferences: profileData.notifications })
        });
      } catch (e) {
        toast.error('Failed to sync notification settings');
      }
    }, 800);
    return () => {
      if (notifDebounceRef.current) clearTimeout(notifDebounceRef.current);
    };
  }, [profileData?.notifications, apiRequest, toast]);

  return (
    <InterviewerLayout>
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
                <div className="h-8 w-28 bg-gray-100 dark:bg-gray-600 rounded mx-auto" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-20 bg-gray-100 dark:bg-gray-600 rounded" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-4 w-40 bg-gray-100 dark:bg-gray-600 rounded" />
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-600 rounded" />
                  <div className="h-4 w-36 bg-gray-100 dark:bg-gray-600 rounded" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-600 rounded" />
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-600 rounded" />
                  <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-600 rounded" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-5 w-44 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({length:6}).map((_,i)=>(<div key={i} className="space-y-2"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-9 w-full bg-gray-100 dark:bg-gray-600 rounded" /></div>))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                <div className="space-y-4">
                  <div className="h-12 w-full bg-gray-100 dark:bg-gray-600 rounded" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                <div className="space-y-4">
                  {Array.from({length:6}).map((_,i)=>(<div key={i} className="flex items-center justify-between"><div className="space-y-1"><div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-3 w-28 bg-gray-100 dark:bg-gray-600 rounded" /></div><div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full" /></div>))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-red-600">{error}</div>
      )}
      {!loading && !error && profileData && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white font-['Open_Sans']">
                Interviewer Profile
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-['Roboto']">
                Manage your profile information and interview preferences
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center ${
                isEditing 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200' 
                  : 'bg-black  text-white dark:bg-white dark:text-black cursor-pointer'
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 font-['Open_Sans']">
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
                    <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                {isEditing && (
                  <div>
                    <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors cursor-pointer">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 font-['Open_Sans']">
                Organization
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  {profileData.organizationLogo ? (
                    <img 
                      src={profileData.organizationLogo}
                      alt="Organization Logo" 
                      className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 mr-3 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 mr-3 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400">
                      No Logo
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-black dark:text-white font-['Open_Sans']">
                      {profileData.organizationName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                      Organization
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Department</label>
                      <p className="text-black dark:text-white font-['Open_Sans']">{profileData.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Specialization</label>
                      <p className="text-black dark:text-white font-['Open_Sans']">{profileData.specialization}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Added On</label>
                      <p className="text-black dark:text-white font-['Open_Sans']">{profileData.addedOn ? new Date(profileData.addedOn).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Joined On</label>
                      <p className="text-black dark:text-white font-['Open_Sans']">{profileData.joinedOn ? new Date(profileData.joinedOn).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 font-['Roboto']">Added By</label>
                      <p className="text-black dark:text-white font-['Open_Sans']">{profileData.addedBy}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 font-['Open_Sans']">
                Interview Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-['Roboto']">Total Interviews</span>
                  <span className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">
                    {profileData.interviewStats.totalInterviews}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-['Roboto']">Average Rating</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-black dark:text-white font-['Open_Sans'] mr-1">
                      {profileData.interviewStats.averageRating}
                    </span>
                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-['Roboto']">Avg. Response Time</span>
                  <span className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">
                    {profileData.interviewStats.responseTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-6 font-['Open_Sans']">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      disabled
                      value={profileData.fullName}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 font-['Roboto'] text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                  ) : (
                    <p className="text-black dark:text-white py-2 font-['Open_Sans']">{profileData.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Email Address
                  </label>
                  <p className="text-black dark:text-white py-2 font-['Open_Sans']">{profileData.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Phone Number
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-black dark:text-white py-2 font-['Open_Sans'] flex-1">{profileData.phone}</p>
                    <button
                      onClick={() => setShowPhoneModal(true)}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-1 rounded font-['Roboto'] transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Role
                  </label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium font-['Roboto']">
                      {profileData.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Specialization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.specialization}
                      onChange={(e) => handleProfileUpdate('specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black dark:text-white bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <p className="text-black dark:text-white py-2 font-['Open_Sans']">{profileData.specialization}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Status
                  </label>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium font-['Roboto'] ${
                      profileData.status === 'Active' 
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {profileData.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-6 font-['Open_Sans']">
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                      Password
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
                      Last changed {profileData?.lastPasswordChange ? new Date(profileData.lastPasswordChange).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-6 font-['Open_Sans']">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                      Interview Reminders
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                      Candidate Updates
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                      Feedback Deadlines
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                      Schedule Changes
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                      Email Digests
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                      Weekly Reports
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white dark:text-black px-6 py-3 rounded-lg font-medium font-['Roboto'] cursor-pointer transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-medium font-['Roboto'] cursor-pointer transition-colors disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 font-['Open_Sans']">
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black dark:text-white bg-white dark:bg-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black dark:text-white bg-white dark:bg-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black dark:text-white bg-white dark:bg-gray-800"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg font-medium font-['Roboto'] cursor-pointer transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 font-['Open_Sans']">
              Change Phone Number
            </h3>
            <form onSubmit={handlePhoneChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Roboto']">
                    New Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneData.newPhone}
                    onChange={(e) => setPhoneData(prev => ({ ...prev, newPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black dark:text-white bg-white dark:bg-gray-800"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
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