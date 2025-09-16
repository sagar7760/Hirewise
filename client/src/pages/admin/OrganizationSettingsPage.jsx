import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useApiRequest } from '../../hooks/useApiRequest';

// Helper function to get the full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already a full URL
  return `http://localhost:5000${imagePath}`; // Add server prefix
};

const OrganizationSettingsPage = () => {
  const { user } = useAuth();
  const { makeRequest, makeJsonRequest } = useApiRequest();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [organizationData, setOrganizationData] = useState({
    name: '',
    industry: '',
    description: '',
    website: '',
    logo: null,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contact: {
      phone: '',
      email: ''
    },
    settings: {
      autoApproveApplications: false,
      allowPublicJobPosting: true,
      enableEmailNotifications: true,
      requireInterviewFeedback: true
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...organizationData });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');

  // Load company data on component mount
  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch organization data from API
        const data = await makeJsonRequest('/api/admin/organization', {
          method: 'GET',
        });

        console.log('Organization API response:', data); // Debug log

        if (data && data.success) {
          const companyData = {
            name: data.data.name || '',
            industry: data.data.industry || '',
            description: data.data.description || '',
            website: data.data.website || '',
            logo: getImageUrl(data.data.logo), // Use helper function for logo URL
            address: {
              street: data.data.address?.street || '',
              city: data.data.address?.city || '',
              state: data.data.address?.state || '',
              zipCode: data.data.address?.zipCode || '',
              country: data.data.address?.country || 'India'
            },
            contact: {
              phone: data.data.contact?.phone || '',
              email: data.data.contact?.email || ''
            },
            settings: {
              autoApproveApplications: data.data.settings?.autoApproveApplications ?? false,
              allowPublicJobPosting: data.data.settings?.allowPublicJobPosting ?? true,
              enableEmailNotifications: data.data.settings?.enableEmailNotifications ?? true,
              requireInterviewFeedback: data.data.settings?.requireInterviewFeedback ?? true
            }
          };
          
          console.log('Processed company data contact:', companyData.contact); // Debug log
          
          setOrganizationData(companyData);
          setEditedData(companyData);
        } else {
          setError(data.message || 'Failed to load organization data');
        }
      } catch (err) {
        console.error('Error loading organization data:', err);
        // Authentication errors are handled by useApiRequest hook
        if (err.message !== 'Authentication required') {
          setError('Failed to load organization data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadOrganizationData();
    }
  }, [user, makeJsonRequest]);

  const industries = [
    'Information Technology',
    'Financial Services', 
    'Healthcare',
    'Manufacturing',
    'E-commerce',
    'Education',
    'Consulting',
    'Real Estate',
    'Media & Entertainment',
    'Automotive',
    'Retail',
    'Food & Beverage',
    'Telecommunications',
    'Energy',
    'Other'
  ];

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...organizationData });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Create FormData for file upload support
      const formData = new FormData();
      
      // Add all text fields
      formData.append('name', editedData.name);
      formData.append('industry', editedData.industry);
      formData.append('description', editedData.description || '');
      formData.append('website', editedData.website || '');
      
      // Add address fields
      formData.append('addressStreet', editedData.address.street || '');
      formData.append('addressCity', editedData.address.city || '');
      formData.append('addressState', editedData.address.state || '');
      formData.append('addressZipCode', editedData.address.zipCode || '');
      formData.append('addressCountry', editedData.address.country || 'India');
      
      // Add contact fields
      formData.append('contactPhone', editedData.contact.phone || '');
      formData.append('contactEmail', editedData.contact.email || '');
      
      // Add settings fields
      formData.append('autoApproveApplications', editedData.settings.autoApproveApplications.toString());
      formData.append('allowPublicJobPosting', editedData.settings.allowPublicJobPosting.toString());
      formData.append('enableEmailNotifications', editedData.settings.enableEmailNotifications.toString());
      formData.append('requireInterviewFeedback', editedData.settings.requireInterviewFeedback.toString());
      
      // Add logo file if it was uploaded
      if (editedData.logoFile) {
        formData.append('logo', editedData.logoFile);
      }

      // Use makeRequest which now properly handles FormData
      const response = await makeRequest('/api/admin/organization', {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state with the response data, including the new logo URL if uploaded
        const updatedData = { ...editedData };
        if (data.data.logo) {
          updatedData.logo = getImageUrl(data.data.logo);
          updatedData.logoFile = undefined; // Clear the file object after successful upload
        }
        setOrganizationData(updatedData);
        setEditedData(updatedData);
        setIsEditing(false);
        
        // Show success message (you can add a toast notification here)
        console.log('Organization data saved successfully');
      } else {
        setError(data.message || 'Failed to save organization data. Please try again.');
      }
      
    } catch (error) {
      console.error('Error saving organization data:', error);
      // Authentication errors are handled by useApiRequest hook
      if (error.message !== 'Authentication required') {
        setError('Failed to save organization data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...organizationData });
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPG, JPEG, or PNG).');
        return;
      }
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB.');
        return;
      }

      // Store the file for upload and create preview URL
      setEditedData({
        ...editedData,
        logo: URL.createObjectURL(file),
        logoFile: file // Store the actual file for upload
      });
      
      setError(''); // Clear any previous errors
    }
  };

  const handleTransferOwnership = () => {
    if (transferEmail && window.confirm(`Are you sure you want to transfer admin ownership to ${transferEmail}? This action cannot be undone.`)) {
      // TODO: Implement ownership transfer
      console.log('Ownership transferred to:', transferEmail);
      setShowTransferModal(false);
      setTransferEmail('');
    }
  };

  const handleSettingChange = (setting, value) => {
    setEditedData({
      ...editedData,
      settings: {
        ...editedData.settings,
        [setting]: value
      }
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600 font-['Roboto']">Loading organization data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!loading && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                    Organization Settings
                  </h1>
                  <p className="text-gray-600 font-['Roboto']">
                    Manage your organization's profile and configuration.
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
          {/* Organization Profile */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Organization Profile
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-3">
                  Organization Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {(isEditing ? editedData.logo : organizationData.logo) ? (
                      <img
                        src={isEditing ? editedData.logo : organizationData.logo}
                        alt="Organization Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  {isEditing && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Change Logo
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Organization Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.name}
                    onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{organizationData.name}</p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Industry
                </label>
                {isEditing ? (
                  <select
                    value={editedData.industry}
                    onChange={(e) => setEditedData({ ...editedData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                  >
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{organizationData.industry}</p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editedData.description}
                    onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{organizationData.description}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editedData.website}
                    onChange={(e) => setEditedData({ ...editedData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <a href={organizationData.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 font-['Roboto'] py-2 block">
                    {organizationData.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedData.contact.phone}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contact: { ...editedData.contact, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{organizationData.contact.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedData.contact.email}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contact: { ...editedData.contact, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{organizationData.contact.email}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Address
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={editedData.address.street}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        address: { ...editedData.address, street: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={editedData.address.city}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        address: { ...editedData.address, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={editedData.address.state}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        address: { ...editedData.address, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={editedData.address.zipCode}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        address: { ...editedData.address, zipCode: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">
                    {organizationData.address.street}, {organizationData.address.city}, {organizationData.address.state} {organizationData.address.zipCode}, {organizationData.address.country}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Organization Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Organization Settings
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  key: 'autoApproveApplications',
                  label: 'Auto-approve job applications',
                  description: 'Automatically approve applications that meet basic criteria'
                },
                {
                  key: 'allowPublicJobPosting',
                  label: 'Allow public job posting',
                  description: 'Make job postings visible to the public job board'
                },
                {
                  key: 'enableEmailNotifications',
                  label: 'Enable email notifications',
                  description: 'Send email notifications for important events'
                },
                {
                  key: 'requireInterviewFeedback',
                  label: 'Require interview feedback',
                  description: 'Mandate feedback from interviewers after each interview'
                }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                      {setting.label}
                    </h3>
                    <p className="text-sm text-gray-500 font-['Roboto']">
                      {setting.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditing ? editedData.settings[setting.key] : organizationData.settings[setting.key]}
                      onChange={(e) => isEditing && handleSettingChange(setting.key, e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      isEditing 
                        ? (editedData.settings[setting.key] ? 'bg-gray-800' : 'bg-gray-200')
                        : (organizationData.settings[setting.key] ? 'bg-gray-800' : 'bg-gray-200')
                    }`}>
                      <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all ${
                        (isEditing ? editedData.settings[setting.key] : organizationData.settings[setting.key]) ? 'translate-x-full' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-lg border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-900 font-['Open_Sans'] mb-6">
              Admin Actions
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-medium text-red-900 font-['Open_Sans'] mb-2">
                  Transfer Admin Ownership
                </h3>
                <p className="text-sm text-red-700 font-['Roboto'] mb-4">
                  Transfer admin privileges to another HR member. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Transfer Ownership
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Ownership Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-red-900 font-['Open_Sans'] mb-4">
                  Transfer Admin Ownership
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-['Roboto'] mb-4">
                    Enter the email address of the HR member you want to transfer admin ownership to. 
                    They will receive an email notification and become the new organization administrator.
                  </p>
                  
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                    HR Email Address
                  </label>
                  <input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferEmail('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium font-['Roboto'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransferOwnership}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    Transfer Ownership
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrganizationSettingsPage;
