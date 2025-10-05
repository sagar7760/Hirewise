import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useApiRequest } from '../../hooks/useApiRequest';
import { SkeletonTable } from '../../components/common/Skeleton';

const InterviewerManagementPage = () => {
  const { makeJsonRequest } = useApiRequest();
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState(null);
  const [newInterviewer, setNewInterviewer] = useState({
    name: '',
    email: '',
    department: '',
    expertise: []
  });
  const [expertiseInput, setExpertiseInput] = useState('');

  const departments = ['Engineering', 'Design', 'Data Science', 'Product', 'Marketing', 'Sales', 'HR'];

  // Load interviewers
  const loadInterviewers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await makeJsonRequest('/api/admin/interviewers');
      setInterviewers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load interviewers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInterviewers(); }, []);

  const handleAddInterviewer = async () => {
    const nameParts = newInterviewer.name.trim().split(' ');
    const firstName = nameParts.shift();
    const lastName = nameParts.join(' ') || '-';
    if (firstName && newInterviewer.email && newInterviewer.department && newInterviewer.password) {
      try {
        const response = await makeJsonRequest('/api/admin/interviewers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            email: newInterviewer.email,
            department: newInterviewer.department,
            password: newInterviewer.password,
            expertise: newInterviewer.expertise
          })
        });
        if (response?.interviewer) {
          setInterviewers([...interviewers, response.interviewer]);
          resetForm();
        }
      } catch (e) {
        setError(e.message || 'Failed to add interviewer');
      }
    }
  };

  const handleEditInterviewer = (interviewer) => {
    setEditingInterviewer(interviewer);
    setNewInterviewer({
      name: interviewer.name,
      email: interviewer.email,
      department: interviewer.department,
      expertise: [...(interviewer.expertise || [])],
      password: ''
    });
    setShowAddModal(true);
  };

  const handleUpdateInterviewer = async () => {
    if (newInterviewer.name && newInterviewer.email && newInterviewer.department && editingInterviewer) {
      try {
        const nameParts = newInterviewer.name.trim().split(' ');
        const firstName = nameParts.shift();
        const lastName = nameParts.join(' ') || '-';
        const payload = {
          firstName,
            lastName,
          email: newInterviewer.email,
          department: newInterviewer.department,
          expertise: newInterviewer.expertise
        };
        if (newInterviewer.password) payload.password = newInterviewer.password;
        const response = await makeJsonRequest(`/api/admin/interviewers/${editingInterviewer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response?.interviewer) {
          setInterviewers(interviewers.map(i => i.id === editingInterviewer.id ? response.interviewer : i));
          resetForm();
        }
      } catch (e) {
        setError(e.message || 'Failed to update interviewer');
      }
    }
  };

  const handleRemoveInterviewer = async (interviewerId) => {
    if (window.confirm('Are you sure you want to remove this interviewer? This action cannot be undone.')) {
      try {
        await makeJsonRequest(`/api/admin/interviewers/${interviewerId}`, { method: 'DELETE' });
        setInterviewers(interviewers.filter(i => i.id !== interviewerId));
      } catch (e) {
        setError(e.message || 'Failed to delete interviewer');
      }
    }
  };

  const handleToggleStatus = async (interviewerId) => {
    try {
      const response = await makeJsonRequest(`/api/admin/interviewers/${interviewerId}/status`, { method: 'PUT' });
      if (response?.interviewer) {
        setInterviewers(interviewers.map(i => i.id === interviewerId ? response.interviewer : i));
      }
    } catch (e) {
      setError(e.message || 'Failed to toggle status');
    }
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !newInterviewer.expertise.includes(expertiseInput.trim())) {
      setNewInterviewer({
        ...newInterviewer,
        expertise: [...newInterviewer.expertise, expertiseInput.trim()]
      });
      setExpertiseInput('');
    }
  };

  const removeExpertise = (expertiseToRemove) => {
    setNewInterviewer({
      ...newInterviewer,
      expertise: newInterviewer.expertise.filter(exp => exp !== expertiseToRemove)
    });
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingInterviewer(null);
    setNewInterviewer({ name: '', email: '', department: '', expertise: [], password: '' });
    setExpertiseInput('');
    setError(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const activeInterviewers = interviewers.filter(interviewer => interviewer.status === 'active').length;
  const totalAssignedJobs = interviewers.reduce((sum, interviewer) => sum + interviewer.assignedJobs, 0);
  const totalCompletedInterviews = interviewers.reduce((sum, interviewer) => sum + interviewer.completedInterviews, 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                Interviewer Management
              </h1>
              <p className="text-gray-600 font-['Roboto']">
                Manage interviewers and their assignments.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Interviewer
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

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
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Active Interviewers</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{activeInterviewers}</p>
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
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Assigned Jobs</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{totalAssignedJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Completed Interviews</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{totalCompletedInterviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 font-['Roboto']">Avg per Interviewer</p>
                <p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                  {activeInterviewers > 0 ? Math.round(totalCompletedInterviews / activeInterviewers) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interviewers Table / Loading */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
              Interviewers ({interviewers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Interviewer Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Expertise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviewers.map((interviewer) => (
                  <tr key={interviewer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-700 font-medium font-['Open_Sans']">
                            {interviewer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                            {interviewer.name}
                          </div>
                          <div className="text-sm text-gray-500 font-['Roboto']">
                            {interviewer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 font-['Roboto']">
                        {interviewer.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {interviewer.expertise.slice(0, 2).map((skill, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 font-['Roboto']">
                            {skill}
                          </span>
                        ))}
                        {interviewer.expertise.length > 2 && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 font-['Roboto']">
                            +{interviewer.expertise.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-['Roboto']">
                        <div>{interviewer.assignedJobs} jobs assigned</div>
                        <div className="text-gray-500">{interviewer.completedInterviews} interviews completed</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${
                        interviewer.status === 'active' 
                          ? 'bg-gray-200 text-gray-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {interviewer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditInterviewer(interviewer)}
                          className="text-gray-700 hover:text-gray-900 transition-colors"
                          title="Edit Interviewer"
                          aria-label="Edit Interviewer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(interviewer.id)}
                          className={`transition-colors ${
                            interviewer.status === 'active' 
                              ? 'text-gray-600 hover:text-gray-800' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title={interviewer.status === 'active' ? 'Deactivate Interviewer' : 'Activate Interviewer'}
                          aria-label={interviewer.status === 'active' ? 'Deactivate Interviewer' : 'Activate Interviewer'}
                        >
                          {interviewer.status === 'active' ? (
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
                          onClick={() => handleRemoveInterviewer(interviewer.id)}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title="Delete Interviewer"
                          aria-label="Delete Interviewer"
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
            )}
          </div>
        </div>

        {/* Add/Edit Interviewer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                  {editingInterviewer ? 'Edit Interviewer' : 'Add New Interviewer'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newInterviewer.name}
                      onChange={(e) => setNewInterviewer({ ...newInterviewer, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newInterviewer.email}
                      onChange={(e) => setNewInterviewer({ ...newInterviewer, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Password {editingInterviewer && <span className="text-gray-500">(leave empty to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      value={newInterviewer.password || ''}
                      onChange={(e) => setNewInterviewer({ ...newInterviewer, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                      placeholder={editingInterviewer ? 'Enter new password (optional)' : 'Enter password'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Department
                    </label>
                    <select
                      value={newInterviewer.department}
                      onChange={(e) => setNewInterviewer({ ...newInterviewer, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Expertise
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={expertiseInput}
                        onChange={(e) => setExpertiseInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addExpertise()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-gray-900"
                        placeholder="Add skill/expertise"
                      />
                      <button
                        type="button"
                        onClick={addExpertise}
                        className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newInterviewer.expertise.map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 font-['Roboto']">
                          {skill}
                          <button
                            onClick={() => removeExpertise(skill)}
                            className="ml-1 text-gray-600 hover:text-gray-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium font-['Roboto'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingInterviewer ? handleUpdateInterviewer : handleAddInterviewer}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    {editingInterviewer ? 'Update Interviewer' : 'Add Interviewer'}
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

export default InterviewerManagementPage;
