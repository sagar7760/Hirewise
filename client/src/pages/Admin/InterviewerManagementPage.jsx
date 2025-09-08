import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const InterviewerManagementPage = () => {
  const [interviewers, setInterviewers] = useState([
    {
      id: 1,
      name: 'Alex Thompson',
      email: 'alex.thompson@company.com',
      department: 'Engineering',
      expertise: ['JavaScript', 'React', 'Node.js'],
      assignedJobs: 5,
      completedInterviews: 23,
      status: 'active',
      dateAdded: '2024-01-20'
    },
    {
      id: 2,
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@company.com',
      department: 'Design',
      expertise: ['UI/UX Design', 'Figma', 'User Research'],
      assignedJobs: 3,
      completedInterviews: 15,
      status: 'active',
      dateAdded: '2024-02-15'
    },
    {
      id: 3,
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      department: 'Data Science',
      expertise: ['Python', 'Machine Learning', 'SQL'],
      assignedJobs: 4,
      completedInterviews: 18,
      status: 'active',
      dateAdded: '2024-01-30'
    },
    {
      id: 4,
      name: 'Sophie Chen',
      email: 'sophie.chen@company.com',
      department: 'Product',
      expertise: ['Product Strategy', 'Analytics', 'Agile'],
      assignedJobs: 2,
      completedInterviews: 12,
      status: 'inactive',
      dateAdded: '2024-03-01'
    }
  ]);

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

  const handleAddInterviewer = () => {
    if (newInterviewer.name && newInterviewer.email && newInterviewer.department) {
      const newInterviewerData = {
        id: interviewers.length + 1,
        name: newInterviewer.name,
        email: newInterviewer.email,
        department: newInterviewer.department,
        expertise: newInterviewer.expertise,
        assignedJobs: 0,
        completedInterviews: 0,
        status: 'active',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      setInterviewers([...interviewers, newInterviewerData]);
      resetForm();
    }
  };

  const handleEditInterviewer = (interviewer) => {
    setEditingInterviewer(interviewer);
    setNewInterviewer({
      name: interviewer.name,
      email: interviewer.email,
      department: interviewer.department,
      expertise: [...interviewer.expertise]
    });
    setShowAddModal(true);
  };

  const handleUpdateInterviewer = () => {
    if (newInterviewer.name && newInterviewer.email && newInterviewer.department && editingInterviewer) {
      setInterviewers(interviewers.map(interviewer => 
        interviewer.id === editingInterviewer.id 
          ? { 
              ...interviewer, 
              name: newInterviewer.name, 
              email: newInterviewer.email,
              department: newInterviewer.department,
              expertise: newInterviewer.expertise
            }
          : interviewer
      ));
      resetForm();
    }
  };

  const handleRemoveInterviewer = (interviewerId) => {
    if (window.confirm('Are you sure you want to remove this interviewer? This action cannot be undone.')) {
      setInterviewers(interviewers.filter(interviewer => interviewer.id !== interviewerId));
    }
  };

  const handleToggleStatus = (interviewerId) => {
    setInterviewers(interviewers.map(interviewer => 
      interviewer.id === interviewerId 
        ? { ...interviewer, status: interviewer.status === 'active' ? 'inactive' : 'active' }
        : interviewer
    ));
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
    setNewInterviewer({ name: '', email: '', department: '', expertise: [] });
    setExpertiseInput('');
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

        {/* Interviewers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
              Interviewers ({interviewers.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
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
                      value={newInterviewer.email}
                      onChange={(e) => setNewInterviewer({ ...newInterviewer, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-['Roboto'] text-gray-900"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Department
                    </label>
                    <select
                      value={newInterviewer.department}
                      onChange={(e) => setNewInterviewer({ ...newInterviewer, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-['Roboto'] text-gray-900"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-['Roboto'] text-gray-900"
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
