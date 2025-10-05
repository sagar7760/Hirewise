import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useApiRequest } from '../../hooks/useApiRequest';
import { SkeletonTable } from '../../components/common/Skeleton';

const HRManagementPage = () => {
  const { makeJsonRequest } = useApiRequest();
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHR, setEditingHR] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newHR, setNewHR] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    customDepartment: '',
    password: ''
  });

  // Predefined department options
  const departmentOptions = [
    'Human Resources',
    'Engineering',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Customer Support',
    'Product Management',
    'Quality Assurance',
    'Research & Development'
  ];

  // Load HR users from backend
  const loadHRUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await makeJsonRequest('/api/admin/hr');
      setHrs(response || []);
    } catch (error) {
      console.error('Error loading HR users:', error);
      setError('Failed to load HR users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadHRUsers();
  }, []);

  // Function to generate a random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const generatedPassword = generatePassword();
    setNewHR({ ...newHR, password: generatedPassword });
  };

  const handleCopyPassword = () => {
    if (newHR.password) {
      navigator.clipboard.writeText(newHR.password);
      // You could add a toast notification here
      alert('Password copied to clipboard!');
    }
  };

  const handleAddHR = async () => {
    const department = newHR.department === 'custom' ? newHR.customDepartment : newHR.department;
    
    if (newHR.firstName && newHR.lastName && newHR.email && department && newHR.password) {
      try {
        setSubmitting(true);
        setError(null);

        const response = await makeJsonRequest('/api/admin/hr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName: newHR.firstName,
            lastName: newHR.lastName,
            email: newHR.email,
            department: department,
            password: newHR.password
          })
        });

        if (response && response.hr) {
          // Add the new HR to the local state
          setHrs([...hrs, response.hr]);
          
          // Reset form and close modal
          setNewHR({ firstName: '', lastName: '', email: '', department: '', customDepartment: '', password: '' });
          setShowAddModal(false);
          setShowPassword(false);
          
          alert('HR user created successfully!');
        }
      } catch (error) {
        console.error('Error creating HR user:', error);
        setError(error.message || 'Failed to create HR user. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      alert('Please fill in all required fields including first name, last name, email, department and password');
    }
  };

  const handleEditHR = (hr) => {
    setEditingHR(hr);
    const isCustomDepartment = !departmentOptions.includes(hr.department);
    // Split the name back into firstName and lastName
    const nameParts = hr.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setNewHR({
      firstName: firstName,
      lastName: lastName,
      email: hr.email,
      department: isCustomDepartment ? 'custom' : hr.department,
      customDepartment: isCustomDepartment ? hr.department : '',
      password: '', // Leave empty for editing - will only update if filled
    });
    setShowAddModal(true);
  };

  const handleUpdateHR = async () => {
    const department = newHR.department === 'custom' ? newHR.customDepartment : newHR.department;
    
    if (newHR.firstName && newHR.lastName && newHR.email && department && editingHR) {
      try {
        setSubmitting(true);
        setError(null);

        const updateData = {
          firstName: newHR.firstName,
          lastName: newHR.lastName,
          email: newHR.email,
          department: department
        };

        // Only include password if it was provided
        if (newHR.password) {
          updateData.password = newHR.password;
        }

        const response = await makeJsonRequest(`/api/admin/hr/${editingHR.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (response && response.hr) {
          // Update the local state
          setHrs(hrs.map(hr => 
            hr.id === editingHR.id ? response.hr : hr
          ));
          
          setEditingHR(null);
          setNewHR({ firstName: '', lastName: '', email: '', department: '', customDepartment: '', password: '' });
          setShowAddModal(false);
          setShowPassword(false);
          
          alert('HR user updated successfully!');
        }
      } catch (error) {
        console.error('Error updating HR user:', error);
        setError(error.message || 'Failed to update HR user. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      alert('Please fill in all required fields (first name, last name, email, department)');
    }
  };

  const handleRemoveHR = async (hrId) => {
    if (window.confirm('Are you sure you want to remove this HR? This action cannot be undone.')) {
      try {
        setError(null);
        await makeJsonRequest(`/api/admin/hr/${hrId}`, {
          method: 'DELETE'
        });

        // Remove from local state
        setHrs(hrs.filter(hr => hr.id !== hrId));
        alert('HR user removed successfully!');
      } catch (error) {
        console.error('Error removing HR user:', error);
        setError(error.message || 'Failed to remove HR user. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (hrId) => {
    try {
      setError(null);
      const hr = hrs.find(h => h.id === hrId);
      const newStatus = hr.status === 'active' ? 'inactive' : 'active';
      
      // Backend expects PUT /api/admin/hr/:hrId/status
      const response = await makeJsonRequest(`/api/admin/hr/${hrId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response && response.hr) {
        const safeHr = {
          ...response.hr,
          jobsPosted: Number(response.hr.jobsPosted) || 0,
            candidatesHired: Number(response.hr.candidatesHired) || 0
        };
        setHrs(hrs.map(hr => 
          hr.id === hrId ? safeHr : hr
        ));
      }
    } catch (error) {
      console.error('Error toggling HR status:', error);
      setError(error.message || 'Failed to update HR status. Please try again.');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingHR(null);
    setNewHR({ firstName: '', lastName: '', email: '', department: '', customDepartment: '', password: '' });
    setShowPassword(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const activeHRs = hrs.filter(hr => hr.status === 'active').length;
  const totalJobsPosted = hrs.reduce((sum, hr) => sum + hr.jobsPosted, 0);
  const totalCandidatesHired = hrs.reduce((sum, hr) => sum + hr.candidatesHired, 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                HR Management
              </h1>
              <p className="text-gray-600 font-['Roboto']">
                Manage HR members in your organization.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add HR
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <>
            {/* Skeleton Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center">
                    <div className="bg-gray-200 p-3 rounded-lg w-12 h-12" />
                    <div className="ml-4 flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-6 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton Table */}
            <SkeletonTable rows={5} columns={5} />
          </>
        ) : (
          <>
            {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Active HRs</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{activeHRs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Total Jobs Posted</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{totalJobsPosted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Candidates Hired</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{totalCandidatesHired}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                  {totalJobsPosted > 0 ? Math.round((totalCandidatesHired / totalJobsPosted) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* HR Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
              HR Members ({hrs.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    HR Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Date Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hrs.map((hr) => (
                  <tr key={hr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-700 font-medium font-['Open_Sans']">
                            {hr.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                            {hr.name}
                          </div>
                          <div className="text-sm text-gray-500 font-['Roboto']">
                            {hr.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${
                        hr.status === 'active' 
                          ? 'bg-gray-200 text-gray-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {hr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-['Roboto']">
                        <div>{hr.jobsPosted} jobs posted</div>
                        <div className="text-gray-500">{hr.candidatesHired} hired</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-['Roboto']">
                      {formatDate(hr.dateJoined)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditHR(hr)}
                          className="text-gray-700 hover:text-gray-900 transition-colors"
                          title="Edit HR"
                          aria-label="Edit HR"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(hr.id)}
                          className={`transition-colors ${
                            hr.status === 'active' 
                              ? 'text-gray-600 hover:text-gray-800' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title={hr.status === 'active' ? 'Deactivate HR' : 'Activate HR'}
                          aria-label={hr.status === 'active' ? 'Deactivate HR' : 'Activate HR'}
                        >
                          {hr.status === 'active' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveHR(hr.id)}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title="Delete HR"
                          aria-label="Delete HR"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit HR Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                  {editingHR ? 'Edit HR' : 'Add New HR'}
                </h3>
                
                {/* Error Message in Modal */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newHR.firstName}
                        onChange={(e) => setNewHR({ ...newHR, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newHR.lastName}
                        onChange={(e) => setNewHR({ ...newHR, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newHR.email}
                      onChange={(e) => setNewHR({ ...newHR, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Department
                    </label>
                    <div className="space-y-3">
                      <select
                        value={newHR.department}
                        onChange={(e) => setNewHR({ ...newHR, department: e.target.value, customDepartment: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                      >
                        <option value="">Select a department</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        <option value="custom">Other (specify below)</option>
                      </select>
                      
                      {newHR.department === 'custom' && (
                        <input
                          type="text"
                          value={newHR.customDepartment}
                          onChange={(e) => setNewHR({ ...newHR, customDepartment: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                          placeholder="Enter custom department name"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Password {editingHR && <span className="text-gray-500">(leave empty to keep current)</span>}
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newHR.password}
                          onChange={(e) => setNewHR({ ...newHR, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                          placeholder={editingHR ? "Enter new password (optional)" : "Enter password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
                        title="Generate secure password"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </button>
                      {newHR.password && (
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
                          title="Copy password to clipboard"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {newHR.password && (
                      <div className="mt-2 text-xs text-gray-600 font-['Roboto']">
                        Password strength: <span className="font-medium">
                          {newHR.password.length >= 8 ? 'Strong' : 'Weak'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium font-['Roboto'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingHR ? handleUpdateHR : handleAddHR}
                    disabled={
                      submitting || 
                      !newHR.firstName || 
                      !newHR.lastName ||
                      !newHR.email || 
                      (newHR.department === 'custom' ? !newHR.customDepartment : !newHR.department) ||
                      (!editingHR && !newHR.password)
                    }
                    className={`px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                      (submitting || !newHR.firstName || !newHR.lastName || !newHR.email || (newHR.department === 'custom' ? !newHR.customDepartment : !newHR.department) || (!editingHR && !newHR.password))
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800 text-white'
                    }`}
                  >
                    {submitting ? (editingHR ? 'Updating...' : 'Adding...') : (editingHR ? 'Update HR' : 'Add HR')}
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

export default HRManagementPage;
