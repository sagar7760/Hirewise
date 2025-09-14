import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const HRManagementPage = () => {
  const [hrs, setHrs] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      dateJoined: '2024-01-15',
      status: 'active',
      jobsPosted: 12,
      candidatesHired: 8
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      dateJoined: '2024-02-10',
      status: 'active',
      jobsPosted: 8,
      candidatesHired: 5
    },
    {
      id: 3,
      name: 'Emma Davis',
      email: 'emma.davis@company.com',
      dateJoined: '2024-03-05',
      status: 'active',
      jobsPosted: 6,
      candidatesHired: 3
    },
    {
      id: 4,
      name: 'David Wilson',
      email: 'david.wilson@company.com',
      dateJoined: '2024-02-28',
      status: 'inactive',
      jobsPosted: 4,
      candidatesHired: 2
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHR, setEditingHR] = useState(null);
  const [newHR, setNewHR] = useState({
    name: '',
    email: '',
    sendInvite: true
  });

  const handleAddHR = () => {
    if (newHR.name && newHR.email) {
      const newHRData = {
        id: hrs.length + 1,
        name: newHR.name,
        email: newHR.email,
        dateJoined: new Date().toISOString().split('T')[0],
        status: 'active',
        jobsPosted: 0,
        candidatesHired: 0
      };
      setHrs([...hrs, newHRData]);
      setNewHR({ name: '', email: '', sendInvite: true });
      setShowAddModal(false);
      
      if (newHR.sendInvite) {
        // TODO: Send invitation email
        console.log(`Invitation sent to ${newHR.email}`);
      }
    }
  };

  const handleEditHR = (hr) => {
    setEditingHR(hr);
    setNewHR({
      name: hr.name,
      email: hr.email,
      sendInvite: false
    });
    setShowAddModal(true);
  };

  const handleUpdateHR = () => {
    if (newHR.name && newHR.email && editingHR) {
      setHrs(hrs.map(hr => 
        hr.id === editingHR.id 
          ? { ...hr, name: newHR.name, email: newHR.email }
          : hr
      ));
      setEditingHR(null);
      setNewHR({ name: '', email: '', sendInvite: true });
      setShowAddModal(false);
    }
  };

  const handleRemoveHR = (hrId) => {
    if (window.confirm('Are you sure you want to remove this HR? This action cannot be undone.')) {
      setHrs(hrs.filter(hr => hr.id !== hrId));
    }
  };

  const handleToggleStatus = (hrId) => {
    setHrs(hrs.map(hr => 
      hr.id === hrId 
        ? { ...hr, status: hr.status === 'active' ? 'inactive' : 'active' }
        : hr
    ));
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingHR(null);
    setNewHR({ name: '', email: '', sendInvite: true });
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
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newHR.name}
                      onChange={(e) => setNewHR({ ...newHR, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-['Roboto'] text-gray-900"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newHR.email}
                      onChange={(e) => setNewHR({ ...newHR, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-['Roboto'] text-gray-900"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  {!editingHR && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sendInvite"
                        checked={newHR.sendInvite}
                        onChange={(e) => setNewHR({ ...newHR, sendInvite: e.target.checked })}
                        className="h-4 w-4 text-gray-700 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sendInvite" className="ml-2 text-sm text-gray-700 font-['Roboto']">
                        Send invitation email
                      </label>
                    </div>
                  )}
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
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                  >
                    {editingHR ? 'Update HR' : 'Add HR'}
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

export default HRManagementPage;
