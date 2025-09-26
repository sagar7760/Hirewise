import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { SkeletonProfile } from '../../components/common/Skeleton';

const ProfilePage = () => {
  const { apiRequest, updateUser, refreshUser, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Profile picture states
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isDeletingPicture, setIsDeletingPicture] = useState(false);
  
  // Array editing states
  const [editingItem, setEditingItem] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSection, setModalSection] = useState('');
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    profilePicture: '',
    
    // Resume
    resume: null,
    
    // Education
    education: [],
    
    // Work Experience
    workExperience: [],
    
    // Skills
    skills: [],
    
    // Projects
    projects: []
  });

  // Cache key for browser storage
  const CACHE_KEY = 'hirewise_profile_data';
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  // Suggested skills for better UX (same as signup page)
  const suggestedSkills = [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript',
    // Web Technologies
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS',
    // Databases
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'Linux',
    // Mobile Development
    'React Native', 'Flutter', 'Android', 'iOS', 'Swift', 'Kotlin',
    // Data & Analytics
    'SQL', 'Excel', 'Power BI', 'Tableau', 'R', 'Pandas', 'NumPy', 'Machine Learning',
    // Design
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX Design',
    // Other
    'Project Management', 'Agile', 'Scrum', 'Communication', 'Leadership', 'Problem Solving'
  ];

  // Load profile data from API or cache
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Always fetch from API first for fresh data
      console.log('Loading profile from API');
      const response = await apiRequest('/api/profile', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success) {
          const profileData = {
            ...responseData.data,
            // Merge with user context data for missing fields
            fullName: responseData.data.fullName || user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            email: responseData.data.email || user?.email,
            phone: responseData.data.phone || user?.phone || '',
            location: responseData.data.location || user?.location || '',
            summary: responseData.data.summary || '',
            profilePicture: responseData.data.profilePicture || user?.profilePicture || user?.avatar,
            // Ensure arrays are always defined
            education: responseData.data.education || [],
            workExperience: responseData.data.workExperience || [],
            skills: responseData.data.skills || [],
            projects: responseData.data.projects || []
          };
          
          console.log('Loaded profile data:', profileData);
          setFormData(profileData);
          setOriginalData(profileData);
          
          // Cache the data
          setCachedData(profileData);
          
          // Update AuthContext user object with fresh profile data
          const updatedUser = {
            ...user,
            ...profileData,
            // Map profile fields to user object structure
            phone: profileData.phone,
            skills: profileData.skills,
            profile: {
              ...user?.profile,
              primarySkills: profileData.skills,
              workExperienceEntries: profileData.workExperience
            },
            currentResumeId: profileData.currentResumeId || user?.currentResumeId,
            resumeAvailable: !!profileData.currentResumeId || user?.resumeAvailable
          };
          
          console.log('Updating AuthContext user with fresh profile data:', updatedUser);
          updateUser(updatedUser);
        } else {
          setError(responseData.message || 'Failed to load profile data');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Profile load error:', error);
      
      // Try to use cached data as fallback
      const cachedData = getCachedData();
      if (cachedData) {
        console.log('API failed, falling back to cache');
        const safeData = {
          ...cachedData,
          // Merge with user context data for missing fields
          fullName: cachedData.fullName || user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: cachedData.email || user?.email,
          phone: cachedData.phone || user?.phone || '',
          location: cachedData.location || user?.location || '',
          summary: cachedData.summary || '',
          profilePicture: cachedData.profilePicture || user?.profilePicture || user?.avatar,
          // Ensure arrays are always defined
          education: cachedData.education || [],
          workExperience: cachedData.workExperience || [],
          skills: cachedData.skills || [],
          projects: cachedData.projects || []
        };
        console.log('Using cached profile data as fallback:', safeData);
        setFormData(safeData);
        setOriginalData(safeData);
        setError('Using offline data. Some information may be outdated.');
        
        // Update AuthContext with cached data too
        const updatedUser = {
          ...user,
          ...safeData,
          phone: safeData.phone,
          skills: safeData.skills,
          profile: {
            ...user?.profile,
            primarySkills: safeData.skills,
            workExperienceEntries: safeData.workExperience
          }
        };
        updateUser(updatedUser);
      } else if (user) {
        // Final fallback to user context data if no cache available
        const fallbackData = {
          fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          phone: user.phone || '',
          location: user.location || '',
          summary: '',
          profilePicture: user.profilePicture || user.avatar || '',
          education: [],
          workExperience: [],
          skills: [],
          projects: []
        };
        console.log('Using basic user data as fallback:', fallbackData);
        setFormData(fallbackData);
        setOriginalData(fallbackData);
        setError('Failed to load complete profile data. Please try again.');
      } else {
        setError('Failed to load profile data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cache management functions
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION) {
          return data;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  };

  const setCachedData = (data) => {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
  };

  const forceRefresh = async () => {
    clearCache();
    await loadProfileData();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayAdd = (section, newItem) => {
    const itemWithId = { ...newItem, id: 'new_' + Date.now() };
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], itemWithId]
    }));
  };

  const handleArrayUpdate = (section, id, updatedItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, ...updatedItem } : item
      )
    }));
  };

  const handleArrayRemove = (section, id) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const openAddModal = (section) => {
    setModalSection(section);
    setEditingItem(null);
    setShowAddModal(true);
  };

  const openEditModal = (section, item) => {
    setModalSection(section);
    setEditingItem(item);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setModalSection('');
    setEditingItem(null);
  };

  const handleModalSave = (formData) => {
    if (editingItem) {
      // Editing existing item
      handleArrayUpdate(modalSection, editingItem.id, formData);
    } else {
      // Adding new item
      handleArrayAdd(modalSection, formData);
    }
    closeModal();
  };

  // Profile picture functions
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return;

    setIsUploadingPicture(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Clear cache to force fresh data load
          localStorage.removeItem(CACHE_KEY);
          
          // Update form data with new profile picture
          setFormData(prev => ({
            ...prev,
            profilePicture: result.data.profilePicture
          }));
          
          // Update user context with new profile picture
          const updatedUser = {
            ...JSON.parse(localStorage.getItem('user')),
            profilePicture: result.data.profilePicture
          };
          updateUser(updatedUser);
          
          // Clear upload states
          setProfilePicture(null);
          setProfilePicturePreview(null);
          
          // Reload profile data to get updated info
          loadProfileData();
        } else {
          setError(result.message || 'Failed to upload profile picture');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const cancelProfilePictureUpload = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  const deleteProfilePicture = async () => {
    setIsDeletingPicture(true);
    setError('');

    try {
      const response = await fetch('/api/profile/delete-photo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Clear cache to force fresh data load
          localStorage.removeItem(CACHE_KEY);
          
          // Update form data to remove profile picture
          setFormData(prev => ({
            ...prev,
            profilePicture: ''
          }));
          
          // Update user context to remove profile picture
          const updatedUser = {
            ...JSON.parse(localStorage.getItem('user')),
            profilePicture: null
          };
          updateUser(updatedUser);
          
          // Reload profile data to get updated info
          loadProfileData();
        } else {
          setError(result.message || 'Failed to delete profile picture');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to delete profile picture');
      }
    } catch (error) {
      console.error('Profile picture delete error:', error);
      setError('Failed to delete profile picture. Please try again.');
    } finally {
      setIsDeletingPicture(false);
    }
  };

  // Advanced skills management functions (like signup page)
  const addSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }

      try {
        setError('');
        console.log('Uploading resume...');
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('resume', file);

        const response = await fetch('/api/resumes/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Update UI with new resume info
          setFormData(prev => ({
            ...prev,
            resume: {
              id: result.resume.id,
              fileName: result.resume.originalName,
              uploadDate: new Date(result.resume.uploadDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              fileSize: `${(result.resume.fileSize / 1024).toFixed(0)} KB`
            }
          }));
          
          // Clear cache to force refresh on next load
          clearCache();
          
          console.log('Resume uploaded successfully');
        } else {
          setError(result.message || 'Failed to upload resume');
        }
      } catch (error) {
        console.error('Resume upload error:', error);
        setError('Failed to upload resume. Please try again.');
      }
    }
  };

  const handleResumeDelete = async () => {
    try {
      setError('');
      console.log('Deleting resume...');
      
      const response = await apiRequest('/api/profile/resume', {
        method: 'DELETE'
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success) {
          setFormData(prev => ({
            ...prev,
            resume: null
          }));
          
          // Clear cache
          clearCache();
          
          console.log('Resume deleted successfully');
        } else {
          setError(responseData.message || 'Failed to delete resume');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Resume delete error:', error);
      setError('Failed to delete resume. Please try again.');
    }
  };

  const handleResumeDownload = async () => {
    try {
      setError('');
      console.log('Downloading resume...');
      
      const response = await apiRequest('/api/profile/resume/download', {
        method: 'GET'
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success && responseData.fileData) {
          // Create blob from base64 data
          const byteCharacters = atob(responseData.fileData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: responseData.contentType || 'application/pdf' });
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = responseData.fileName || 'resume.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log('Resume downloaded successfully');
        } else {
          setError(responseData.message || 'Failed to download resume');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to download resume');
      }
    } catch (error) {
      console.error('Resume download error:', error);
      setError('Failed to download resume. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      console.log('Saving profile...');

      // Prepare data for backend (transform arrays back to backend format)
      const profileData = {
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        summary: formData.summary,
        skills: formData.skills,
        education: formData.education.map(edu => ({
          institution: edu.institution,
          graduationDate: edu.graduationDate,
          description: edu.description
        })),
        workExperience: formData.workExperience.map(work => ({
          company: work.company,
          duration: work.duration,
          description: work.description
        })),
        projects: formData.projects.map(project => ({
          name: project.name,
          technologies: project.technologies,
          description: project.description
        }))
      };

      const response = await apiRequest('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success) {
          // Update cache with new data
          setCachedData(responseData.data);
          
          setIsEditing(false);
          console.log('Profile saved successfully');
          
          // Update form data with potentially modified backend data
          setFormData(prev => ({
            ...prev,
            ...responseData.data
          }));

          // Refresh user data in AuthContext to update profile completion on dashboard
          await refreshUser();
        } else {
          setError(responseData.message || 'Failed to save profile');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original state (reload from cache or API)
    loadProfileData();
    setIsEditing(false);
    setError('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <SkeletonProfile />
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-['Roboto'] text-sm">{error}</p>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && (
          <>
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                    Profile
                  </h1>
                  <p className="text-gray-600 font-['Roboto']">
                    Review and update your profile information.
                  </p>
                </div>
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

        {/* Profile Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Personal Information
            </h2>
            
            {/* Profile Picture Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-4">
                Profile Picture
              </h3>
              
              <div className="flex items-start space-x-6">
                {/* Current/Preview Image */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : formData.profilePicture ? (
                      <img 
                        src={formData.profilePicture.startsWith('data:') ? 
                             formData.profilePicture : 
                             formData.profilePicture.startsWith('/uploads') ? 
                             `${window.location.origin}${formData.profilePicture}` :
                             formData.profilePicture}
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Profile image failed to load:', formData.profilePicture);
                          if (e.target) {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }
                        }}
                      />
                    ) : null}
                    {!profilePicturePreview && !formData.profilePicture && (
                      <div className="text-2xl font-bold text-gray-500 font-['Open_Sans']">
                        {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Upload Controls - Only show in edit mode */}
                {isEditing && (
                  <div className="flex-grow">
                    {!profilePicture ? (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              className="hidden"
                            />
                            <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto']">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              {formData.profilePicture ? 'Change Photo' : 'Choose Photo'}
                            </span>
                          </label>
                          
                          {/* Delete button - only show if there's an existing profile picture */}
                          {formData.profilePicture && (
                            <button
                              onClick={deleteProfilePicture}
                              disabled={isDeletingPicture}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 font-['Roboto'] flex items-center"
                            >
                              {isDeletingPicture ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Photo
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-['Roboto']">
                          JPG, PNG or GIF. Max file size 5MB.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700 font-['Roboto']">
                          Ready to upload: {profilePicture.name}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={uploadProfilePicture}
                            disabled={isUploadingPicture}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 font-['Roboto'] flex items-center"
                        >
                          {isUploadingPicture ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            'Upload Photo'
                          )}
                        </button>
                        <button
                          onClick={cancelProfilePictureUpload}
                          disabled={isUploadingPicture}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 font-['Roboto']"
                        >
                          Cancel
                        </button>
                        
                        {/* Delete existing picture button - show if user has a saved profile picture */}
                        {formData.profilePicture && (
                          <button
                            onClick={deleteProfilePicture}
                            disabled={isDeletingPicture}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 font-['Roboto'] flex items-center"
                          >
                            {isDeletingPicture ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Current Photo
                              </>
                            )}
                          </button>
                        )}
                        </div>
                    </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{formData.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Email
                </label>
                <p className="text-gray-900 font-['Roboto'] py-2 bg-gray-50 px-3 rounded-lg border">
                  {formData.email}
                  <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{formData.phone}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{formData.location}</p>
                )}
              </div>
            </div>

            {/* Summary/Objective */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                Summary/Objective
              </label>
              {isEditing ? (
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] resize-none text-gray-900"
                />
              ) : (
                <div className="py-2">
                  {formData.summary ? (
                    <p className="text-gray-900 font-['Roboto'] leading-relaxed">{formData.summary}</p>
                  ) : (
                    <p className="text-gray-500 font-['Roboto'] italic">No summary/objective added yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resume Section */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Resume
            </h2>
            
            {formData.resume ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 font-['Open_Sans']">
                        {formData.resume.fileName}
                      </h3>
                      <p className="text-sm text-gray-600 font-['Roboto']">
                        Uploaded: {formData.resume.uploadDate} • {formData.resume.fileSize}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResumeDownload}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Download Resume"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    
                    {isEditing && (
                      <button
                        onClick={handleResumeDelete}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Resume"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Upload New Resume
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800 file:transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500 font-['Roboto']">
                      Supported formats: PDF, DOC, DOCX (Max size: 5MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
                    No resume uploaded
                  </h3>
                  <p className="text-gray-600 font-['Roboto'] mb-4">
                    Upload your resume to let employers know more about your experience
                  </p>
                  
                  {isEditing && (
                    <div>
                      <label className="cursor-pointer bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors inline-block">
                        Upload Resume
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500 font-['Roboto']">
                        Supported formats: PDF, DOC, DOCX (Max size: 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Education */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans']">
                Education
              </h2>
              {isEditing && (
                <button
                  onClick={() => openAddModal('education')}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium font-['Roboto'] transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Education
                </button>
              )}
            </div>
            
            {(formData.education && formData.education.length === 0) ? (
              <div className="text-center py-8 text-gray-500 font-['Roboto']">
                No education information added yet
              </div>
            ) : (
              (formData.education || []).map((edu) => (
                <div key={edu.id} className="flex items-start space-x-4 mb-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 font-['Open_Sans']">{edu.institution}</h3>
                    <p className="text-sm text-gray-600 font-['Roboto'] mb-1">{edu.degree}</p>
                    <p className="text-sm text-gray-600 font-['Roboto'] mb-1">Graduated: {edu.graduationDate}</p>
                    {edu.description && (
                      <p className="text-sm text-gray-700 font-['Roboto']">{edu.description}</p>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('education', edu)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Education"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleArrayRemove('education', edu.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Education"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Work Experience */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans']">
                Work Experience
              </h2>
              {isEditing && (
                <button
                  onClick={() => openAddModal('workExperience')}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium font-['Roboto'] transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Experience
                </button>
              )}
            </div>
            
            {(formData.workExperience && formData.workExperience.length === 0) ? (
              <div className="text-center py-8 text-gray-500 font-['Roboto']">
                No work experience added yet
              </div>
            ) : (
              (formData.workExperience || []).map((work) => (
                <div key={work.id} className="flex items-start space-x-4 mb-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 font-['Open_Sans']">{work.company}</h3>
                    <p className="text-sm text-gray-600 font-['Roboto'] mb-1">{work.position}</p>
                    <p className="text-sm text-gray-600 font-['Roboto'] mb-1">{work.duration}</p>
                    <p className="text-sm text-gray-700 font-['Roboto']">{work.description}</p>
                  </div>
                  {isEditing && (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('workExperience', work)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Experience"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleArrayRemove('workExperience', work.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Experience"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Skills */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Skills
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                {/* Selected Skills Display */}
                {formData.skills && formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[60px]">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded-full font-['Roboto']"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-gray-300 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Custom Skill Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const skill = e.target.value.trim();
                        if (skill) {
                          addSkill(skill);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.target.parentElement.querySelector('input');
                      const skill = input.value.trim();
                      if (skill) {
                        addSkill(skill);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-['Roboto'] text-sm"
                  >
                    Add
                  </button>
                </div>
                
                {/* Suggested Skills */}
                <div>
                  <p className="text-sm text-gray-600 font-['Roboto'] mb-2">Popular Skills (click to add):</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {suggestedSkills
                      .filter(skill => !formData.skills.includes(skill))
                      .slice(0, 30)
                      .map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-colors font-['Roboto'] text-gray-700"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 font-['Roboto']">
                  Add skills that best represent your expertise. You can type custom skills or select from popular ones.
                </p>
              </div>
            ) : (
              <div>
                {(formData.skills && formData.skills.length > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 font-['Roboto']"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 font-['Roboto']">
                    No skills added yet
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans']">
                Projects
              </h2>
              {isEditing && (
                <button
                  onClick={() => openAddModal('projects')}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium font-['Roboto'] transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Project
                </button>
              )}
            </div>
            
            {(formData.projects && formData.projects.length === 0) ? (
              <div className="text-center py-8 text-gray-500 font-['Roboto']">
                No projects added yet
              </div>
            ) : (
              (formData.projects || []).map((project) => (
                <div key={project.id} className="flex items-start space-x-4 mb-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 font-['Open_Sans']">{project.name}</h3>
                    <p className="text-sm text-gray-600 font-['Roboto'] mb-1">{project.technologies}</p>
                    <p className="text-sm text-gray-700 font-['Roboto']">{project.description}</p>
                  </div>
                  {isEditing && (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('projects', project)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleArrayRemove('projects', project.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Action Buttons (Mobile) */}
        {isEditing && (
          <div className="mt-6 flex space-x-3 md:hidden">
            <button
              onClick={handleCancel}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
          </>
        )}

        {/* Edit/Add Modal */}
        {showAddModal && (
          <EditModal
            section={modalSection}
            item={editingItem}
            onSave={handleModalSave}
            onCancel={closeModal}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

// EditModal Component
const EditModal = ({ section, item, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    if (section === 'education') {
      return item ? { ...item } : { institution: '', degree: '', graduationDate: '', description: '' };
    } else if (section === 'workExperience') {
      return item ? { ...item } : { company: '', position: '', duration: '', description: '' };
    } else if (section === 'projects') {
      return item ? { ...item } : { name: '', technologies: '', description: '' };
    }
    return {};
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getSectionTitle = () => {
    switch (section) {
      case 'education': return item ? 'Edit Education' : 'Add Education';
      case 'workExperience': return item ? 'Edit Experience' : 'Add Experience';
      case 'projects': return item ? 'Edit Project' : 'Add Project';
      default: return 'Edit Item';
    }
  };

  const renderFields = () => {
    if (section === 'education') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Institution/School
            </label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Degree
            </label>
            <input
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleInputChange}
              placeholder="e.g., Bachelor of Science in Computer Science"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Graduation Date
            </label>
            <input
              type="text"
              name="graduationDate"
              value={formData.graduationDate}
              onChange={handleInputChange}
              placeholder="e.g., June 2023"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional details about your education"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] resize-none text-gray-900"
            />
          </div>
        </>
      );
    } else if (section === 'workExperience') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Position/Job Title
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="e.g., Software Engineer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Duration
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="e.g., Jan 2022 - Present"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Job Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe your role and achievements"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] resize-none text-gray-900"
              required
            />
          </div>
        </>
      );
    } else if (section === 'projects') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Technologies Used
            </label>
            <input
              type="text"
              name="technologies"
              value={formData.technologies}
              onChange={handleInputChange}
              placeholder="e.g., React, Node.js, MongoDB"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
              Project Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe what the project does and your role"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] resize-none text-gray-900"
              required
            />
          </div>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
              {getSectionTitle()}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFields()}
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                {item ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
