import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiRequest } from '../../hooks/useApiRequest';
import HRLayout from '../../components/layout/HRLayout';

const HREditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { makeJsonRequest } = useApiRequest();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    department: '',
    customDepartment: '',
    jobType: '',
    location: '',
    locationType: 'onsite', // onsite, remote, hybrid
    qualification: [],
    customQualifications: [],
    experienceLevel: '',
    requiredSkills: [],
    preferredSkills: [],
    salaryRange: {
      min: '',
      max: '',
      currency: 'INR',
      period: 'year', // year, month, hour
      format: 'absolute' // absolute, lpa
    },
    applicationDeadline: '',
    maxApplicants: '',
    resumeRequired: true,
    allowMultipleApplications: false,
    defaultInterviewRounds: [],
    defaultInterviewer: '',
    status: 'draft' // draft, active
  });

  const [skillInput, setSkillInput] = useState('');
  const [preferredSkillInput, setPreferredSkillInput] = useState('');
  const [customQualificationInput, setCustomQualificationInput] = useState('');

  // Dropdown options
  const departments = [
    'Engineering',
    'Marketing',
    'Human Resources',
    'Sales',
    'Product',
    'Design',
    'Finance',
    'Operations',
    'Customer Success',
    'Legal',
    'Other'
  ];

  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Temporary',
    'Internship',
    'Freelance'
  ];

  const experienceLevels = [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Lead/Principal',
    'Manager',
    'Director',
    'Executive'
  ];

  const qualificationOptions = [
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD',
    'High School Diploma',
    'Associate Degree',
    'Professional Certification',
    'Trade School Certificate',
    'No Formal Education Required'
  ];

  const interviewRounds = [
    'Phone Screening',
    'Technical Assessment',
    'Coding Challenge',
    'System Design',
    'Behavioral Interview',
    'Panel Interview',
    'Final Interview',
    'Culture Fit Interview'
  ];

  const defaultInterviewers = [
    'Sarah Johnson (HR Manager)',
    'Mike Wilson (Senior Engineer)',
    'Lisa Chen (Design Lead)',
    'Robert Brown (Product Manager)',
    'Emily Davis (Tech Lead)'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('salaryRange.')) {
      const field = name.split('.')[1];
      setJobData(prev => ({
        ...prev,
        salaryRange: {
          ...prev.salaryRange,
          [field]: value
        }
      }));
    } else {
      setJobData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = (type) => {
    const input = type === 'required' ? skillInput : preferredSkillInput;
    const setInput = type === 'required' ? setSkillInput : setPreferredSkillInput;
    const field = type === 'required' ? 'requiredSkills' : 'preferredSkills';
    
    if (input.trim() && !jobData[field].includes(input.trim())) {
      setJobData(prev => ({
        ...prev,
        [field]: [...prev[field], input.trim()]
      }));
      setInput('');
    }
  };

  const removeSkill = (type, index) => {
    const field = type === 'required' ? 'requiredSkills' : 'preferredSkills';
    setJobData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addCustomQualification = () => {
    if (customQualificationInput.trim() && !jobData.qualification.includes(customQualificationInput.trim())) {
      setJobData(prev => ({
        ...prev,
        qualification: [...prev.qualification, customQualificationInput.trim()]
      }));
      setCustomQualificationInput('');
    }
  };

  const removeQualification = (index) => {
    setJobData(prev => ({
      ...prev,
      qualification: prev.qualification.filter((_, i) => i !== index)
    }));
  };

  const handleQualificationChange = (qual) => {
    if (jobData.qualification.includes(qual)) {
      setJobData(prev => ({
        ...prev,
        qualification: prev.qualification.filter(q => q !== qual)
      }));
    } else {
      setJobData(prev => ({
        ...prev,
        qualification: [...prev.qualification, qual]
      }));
    }
  };

  const handleInterviewRoundChange = (round) => {
    if (jobData.defaultInterviewRounds.includes(round)) {
      setJobData(prev => ({
        ...prev,
        defaultInterviewRounds: prev.defaultInterviewRounds.filter(r => r !== round)
      }));
    } else {
      setJobData(prev => ({
        ...prev,
        defaultInterviewRounds: [...prev.defaultInterviewRounds, round]
      }));
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!jobData.title.trim()) errors.push('Job title is required');
    if (!jobData.description.trim()) errors.push('Job description is required');
    if (!jobData.department.trim() && !jobData.customDepartment.trim()) {
      errors.push('Department is required');
    }
    if (!jobData.jobType) errors.push('Job type is required');
    if (!jobData.location.trim()) errors.push('Location is required');
    if (!jobData.experienceLevel) errors.push('Experience level is required');
    
    if (jobData.salaryRange.min && jobData.salaryRange.max) {
      const minValue = parseFloat(jobData.salaryRange.min);
      const maxValue = parseFloat(jobData.salaryRange.max);
      if (minValue >= maxValue) {
        errors.push('Maximum salary must be greater than minimum salary');
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e, actionType = 'save') => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalDepartment = jobData.customDepartment.trim() || jobData.department;
      const finalQualifications = [
        ...jobData.qualification,
        ...jobData.customQualifications
      ];

      // Process salary based on format
      const processSalaryValue = (value, format) => {
        if (!value) return null;
        const numValue = parseFloat(value);
        if (format === 'lpa') {
          // Convert LPA to absolute value for storage
          return (numValue * 100000).toString();
        } else {
          // Store as string for absolute values
          return numValue.toString();
        }
      };

      const submitData = {
        ...jobData,
        department: finalDepartment,
        qualification: finalQualifications,
        status: actionType === 'publish' ? 'active' : jobData.status,
        salaryRange: {
          ...jobData.salaryRange,
          min: processSalaryValue(jobData.salaryRange.min, jobData.salaryRange.format),
          max: processSalaryValue(jobData.salaryRange.max, jobData.salaryRange.format)
        },
        maxApplicants: jobData.maxApplicants ? parseInt(jobData.maxApplicants) : null
      };

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || (Array.isArray(submitData[key]) && submitData[key].length === 0)) {
          delete submitData[key];
        }
      });

      const response = await makeJsonRequest(`/api/hr/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.success) {
        navigate('/hr/jobs', { 
          state: { 
            message: `Job ${actionType === 'publish' ? 'published' : 'updated'} successfully!`,
            type: 'success'
          }
        });
      } else {
        setError(response.message || `Failed to ${actionType === 'publish' ? 'publish' : 'update'} job`);
      }
    } catch (error) {
      console.error('Error updating job:', error);
      setError(error.message || `Failed to ${actionType === 'publish' ? 'publish' : 'update'} job`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch job details for editing
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await makeJsonRequest(`/api/hr/jobs/${jobId}`);
        
        if (response.success) {
          const job = response.data;
          
          // Process salary data for display
          const processSalaryForDisplay = (value, format) => {
            if (!value) return '';
            const numValue = parseFloat(value);
            if (format === 'lpa') {
              return numValue.toString();
            } else {
              // If stored value is large, we assume it's absolute, otherwise default behavior
              return numValue.toString();
            }
          };

          // Detect salary format for legacy data
          let detectedFormat = job.salaryRange?.format || 'absolute';
          if (!job.salaryRange?.format && job.salaryRange?.min) {
            const minValue = parseFloat(job.salaryRange.min);
            if (minValue < 100 && minValue > 0) { // Simple heuristic for LPA
              detectedFormat = 'lpa';
            }
          }
          
          setJobData(prev => ({
            ...prev,
            title: job.title || '',
            description: job.description || '',
            department: job.department || '',
            customDepartment: '',
            jobType: job.jobType || '',
            location: job.location || '',
            locationType: job.locationType || 'onsite',
            qualification: job.qualification || [],
            customQualifications: [],
            experienceLevel: job.experienceLevel || '',
            requiredSkills: job.requiredSkills || [],
            preferredSkills: job.preferredSkills || [],
            salaryRange: {
              min: processSalaryForDisplay(job.salaryRange?.min, detectedFormat),
              max: processSalaryForDisplay(job.salaryRange?.max, detectedFormat),
              currency: job.salaryRange?.currency || 'INR',
              period: job.salaryRange?.period || 'year',
              format: detectedFormat
            },
            applicationDeadline: job.applicationDeadline ? 
              new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
            maxApplicants: job.maxApplicants || '',
            resumeRequired: job.resumeRequired !== false,
            allowMultipleApplications: job.allowMultipleApplications || false,
            defaultInterviewRounds: job.defaultInterviewRounds || [],
            defaultInterviewer: job.defaultInterviewer || '',
            status: job.status || 'draft'
          }));
        } else {
          setError(response.message || 'Failed to fetch job details');
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError(error.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, makeJsonRequest]);

  if (loading) {
    return (
      <HRLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300 font-['Roboto']">Loading job details...</span>
          </div>
        </div>
      </HRLayout>
    );
  }

  if (error && !jobData.title) {
    return (
      <HRLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 transition-colors duration-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 font-['Roboto']">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400 font-['Roboto']">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/hr/jobs')}
                    className="text-sm bg-red-100 dark:bg-red-700 text-red-800 dark:text-white px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-600 transition-colors"
                  >
                    Back to Jobs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                Edit Job Posting
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Update your job posting details
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/jobs')}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Jobs
            </button>
          </div>
          
          {/* Status indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Current Status:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              jobData.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
              jobData.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {jobData.status}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 transition-colors duration-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 font-['Roboto']">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400 font-['Roboto']">{error}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={jobData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  placeholder="e.g., Senior Frontend Developer"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  value={jobData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                  required={!jobData.customDepartment}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
                {jobData.department === 'Other' && (
                  <input
                    type="text"
                    name="customDepartment"
                    value={jobData.customDepartment}
                    onChange={handleInputChange}
                    className="w-full mt-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                    placeholder="Enter custom department"
                  />
                )}
              </div>

              {/* Job Type */}
              <div>
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Job Type *
                </label>
                <select
                  id="jobType"
                  name="jobType"
                  value={jobData.jobType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                  required
                >
                  <option value="">Select Job Type</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={jobData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  placeholder="e.g., New York, NY"
                  required
                />
              </div>

              {/* Location Type */}
              <div>
                <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Work Type
                </label>
                <select
                  id="locationType"
                  name="locationType"
                  value={jobData.locationType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                >
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Experience Level *
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={jobData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                  required
                >
                  <option value="">Select Experience Level</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Description */}
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={jobData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
                required
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Skills & Requirements</h2>
            
            {/* Required Skills */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                Required Skills
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('required'))}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  placeholder="Type a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addSkill('required')}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm rounded-full font-['Roboto'] border border-blue-200 dark:border-blue-700 transition-colors duration-300"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('required', index)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                Preferred Skills
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={preferredSkillInput}
                  onChange={(e) => setPreferredSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('preferred'))}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  placeholder="Type a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addSkill('preferred')}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.preferredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm rounded-full font-['Roboto'] border border-green-200 dark:border-green-700 transition-colors duration-300"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('preferred', index)}
                      className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                Required Qualifications
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto bg-white dark:bg-gray-700">
                {qualificationOptions.map(qual => (
                  <label key={qual} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobData.qualification.includes(qual)}
                      onChange={() => handleQualificationChange(qual)}
                      className="rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white focus:ring-offset-0 bg-white dark:bg-gray-800"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white font-['Roboto']">{qual}</span>
                  </label>
                ))}
              </div>
              
              {/* Custom Qualification */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customQualificationInput}
                  onChange={(e) => setCustomQualificationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQualification())}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  placeholder="Add custom qualification"
                />
                <button
                  type="button"
                  onClick={addCustomQualification}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-r-lg font-medium font-['Roboto'] transition-colors"
                >
                  Add
                </button>
              </div>
              
              {/* Display custom qualifications (separate section) */}
              {jobData.qualification.filter(qual => !qualificationOptions.includes(qual)).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {jobData.qualification.filter(qual => !qualificationOptions.includes(qual)).map((qual, index) => (
                    <span
                      key={`custom-${index}`}
                      className="inline-flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-sm rounded-full font-['Roboto'] border border-purple-200 dark:border-purple-700 transition-colors duration-300"
                    >
                      {qual}
                      <button
                        type="button"
                        onClick={() => removeQualification(jobData.qualification.indexOf(qual))}
                        className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Compensation & Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Compensation & Details</h2>
            
            {/* Salary Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                Salary Input Format
              </label>
              <div className="flex items-center space-x-6">
                {['absolute', 'lpa'].map(format => (
                  <label key={format} className="flex items-center">
                    <input
                      type="radio"
                      name="salaryRange.format"
                      value={format}
                      checked={jobData.salaryRange.format === format}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 dark:border-gray-600 text-gray-600 dark:text-white focus:ring-black dark:focus:ring-white focus:ring-offset-0 bg-white dark:bg-gray-800"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white font-['Roboto']">
                      {format === 'lpa' ? 'Lakhs Per Annum' : 'Absolute Amount'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Salary Range */}
              <div className="lg:col-span-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Minimum Salary</label>
                  <div className="flex">
                    <select
                      name="salaryRange.currency"
                      value={jobData.salaryRange.currency}
                      onChange={handleInputChange}
                      className="px-3 py-3 border border-gray-300 dark:border-gray-600 border-r-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 bg-gray-50 dark:bg-gray-750 transition-colors duration-300"
                    >
                      <option value="INR">₹</option>
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                    </select>
                    <input
                      type="number"
                      name="salaryRange.min"
                      value={jobData.salaryRange.min}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                      placeholder={jobData.salaryRange.format === 'lpa' ? '5' : '500000'}
                      step={jobData.salaryRange.format === 'lpa' ? '0.1' : '1000'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-['Roboto']">
                    {jobData.salaryRange.format === 'lpa' ? 'Amount in Lakhs' : 'Full Amount'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Maximum Salary</label>
                  <div className="flex">
                    <select
                      name="salaryRange.currency"
                      value={jobData.salaryRange.currency}
                      onChange={handleInputChange}
                      className="px-3 py-3 border border-gray-300 dark:border-gray-600 border-r-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 transition-colors duration-300"
                    >
                      <option value="INR">₹</option>
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                    </select>
                    <input
                      type="number"
                      name="salaryRange.max"
                      value={jobData.salaryRange.max}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700"
                      placeholder={jobData.salaryRange.format === 'lpa' ? '8' : '800000'}
                      step={jobData.salaryRange.format === 'lpa' ? '0.1' : '1000'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-['Roboto']">
                    {jobData.salaryRange.format === 'lpa' ? 'Amount in Lakhs' : 'Full Amount'}
                  </p>
                </div>

                <div>
                  <label htmlFor="salaryRange.period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">Period</label>
                  <select
                    id="salaryRange.period"
                    name="salaryRange.period"
                    value={jobData.salaryRange.period}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                  >
                    <option value="year">Per Year</option>
                    <option value="month">Per Month</option>
                    <option value="hour">Per Hour</option>
                  </select>
                </div>
              </div>

              {/* Application Deadline */}
              <div>
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  id="applicationDeadline"
                  name="applicationDeadline"
                  value={jobData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 transition-colors duration-300"
                />
              </div>

              {/* Max Applicants */}
              <div>
                <label htmlFor="maxApplicants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Maximum Applicants
                </label>
                <input
                  type="number"
                  id="maxApplicants"
                  name="maxApplicants"
                  value={jobData.maxApplicants}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            {/* Application Settings */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <label htmlFor="resumeRequired" className="flex-1 text-sm font-medium text-gray-900 dark:text-white font-['Roboto']">
                  Resume/CV required for application
                </label>
                <input
                  type="checkbox"
                  id="resumeRequired"
                  name="resumeRequired"
                  checked={jobData.resumeRequired}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white focus:ring-offset-0 bg-white dark:bg-gray-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <label htmlFor="allowMultipleApplications" className="flex-1 text-sm font-medium text-gray-900 dark:text-white font-['Roboto']">
                  Allow multiple applications from same candidate
                </label>
                <input
                  type="checkbox"
                  id="allowMultipleApplications"
                  name="allowMultipleApplications"
                  checked={jobData.allowMultipleApplications}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white focus:ring-offset-0 bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Interview Process */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-6 transition-colors duration-300">Interview Process (Optional)</h2>
            
            <div className="space-y-6">
              {/* Default Interview Rounds */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-3">
                  Default Interview Rounds
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {interviewRounds.map(round => (
                    <label key={round} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={jobData.defaultInterviewRounds.includes(round)}
                        onChange={() => handleInterviewRoundChange(round)}
                        className="rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white focus:ring-offset-0 bg-white dark:bg-gray-800"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-white font-['Roboto']">{round}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Default Interviewer */}
              <div>
                <label htmlFor="defaultInterviewer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-2">
                  Default Interviewer Email
                </label>
                <input
                  type="email"
                  id="defaultInterviewer"
                  name="defaultInterviewer"
                  value={jobData.defaultInterviewer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-['Roboto'] text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  placeholder="interviewer@company.com"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/hr/jobs')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium font-['Roboto'] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Job'
                )}
              </button>
              
              {jobData.status === 'draft' && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'publish')}
                  disabled={isSubmitting || !validateForm().length === 0}
                  className="px-6 py-3 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update & Publish
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </HRLayout>
  );
};

export default HREditJob;