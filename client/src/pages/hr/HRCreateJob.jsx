import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiRequest } from '../../hooks/useApiRequest';
import HRLayout from '../../components/layout/HRLayout';

const HRCreateJob = () => {
  const navigate = useNavigate();
  const { makeJsonRequest } = useApiRequest();
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
      format: 'lpa' // lpa, absolute (default to lpa for new jobs for better UX)
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    'Data Science',
    'Quality Assurance',
    'Security',
    'Legal',
    'Administrative',
    'Other'
  ];

  const jobTypes = [
    'Full-time',
    'Part-time',
    'Internship',
    'Contract',
    'Freelance'
  ];

  const qualifications = [
    'High School',
    'Diploma',
    'Bachelor\'s Degree in Engineering',
    'Bachelor\'s Degree in Computer Science',
    'Bachelor\'s Degree in Business',
    'Bachelor\'s Degree in Commerce',
    'Bachelor\'s Degree in Arts',
    'Bachelor\'s Degree in Science',
    'Master\'s Degree in Engineering',
    'Master\'s Degree in Computer Science',
    'Master\'s Degree in Business (MBA)',
    'Master\'s Degree in Commerce',
    'Master\'s Degree in Arts',
    'Master\'s Degree in Science',
    'PhD',
    'Professional Certification',
    'Technical Certification'
  ];

  const experienceLevels = [
    'Fresher (0 years)',
    '1-2 years',
    '3-5 years',
    '5-8 years',
    '8-12 years',
    '12+ years'
  ];

  const interviewRounds = [
    'Phone Screening',
    'Technical Interview',
    'Behavioral Interview',
    'System Design',
    'Code Review',
    'HR Interview',
    'Final Interview'
  ];

  const defaultInterviewers = [
    'Sarah Johnson (HR Manager)',
    'Mike Wilson (Senior Engineer)',
    'Lisa Chen (Design Lead)',
    'Robert Brown (Product Manager)',
    'Emily Davis (Tech Lead)'
  ];

  const handleInputChange = (field, value) => {
    if (typeof field === 'object' && field.target) {
      // Handle event objects for form inputs
      const { name, value: inputValue, type, checked } = field.target;
      
      if (name.startsWith('salaryRange.')) {
        const salaryField = name.split('.')[1];
        setJobData(prev => ({
          ...prev,
          salaryRange: {
            ...prev.salaryRange,
            [salaryField]: inputValue
          }
        }));
      } else {
        setJobData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : inputValue
        }));
      }
    } else {
      // Handle direct field/value calls
      setJobData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSkillAdd = (skillType) => {
    const input = skillType === 'required' ? skillInput : preferredSkillInput;
    if (input.trim()) {
      const skillArray = skillType === 'required' ? 'requiredSkills' : 'preferredSkills';
      setJobData(prev => ({
        ...prev,
        [skillArray]: [...prev[skillArray], input.trim()]
      }));
      
      if (skillType === 'required') {
        setSkillInput('');
      } else {
        setPreferredSkillInput('');
      }
    }
  };

  const handleSkillRemove = (skillType, index) => {
    const skillArray = skillType === 'required' ? 'requiredSkills' : 'preferredSkills';
    setJobData(prev => ({
      ...prev,
      [skillArray]: prev[skillArray].filter((_, i) => i !== index)
    }));
  };

  const addCustomQualification = () => {
    if (customQualificationInput.trim() && !jobData.customQualifications.includes(customQualificationInput.trim())) {
      setJobData(prev => ({
        ...prev,
        customQualifications: [...prev.customQualifications, customQualificationInput.trim()]
      }));
      setCustomQualificationInput('');
    }
  };

  const removeCustomQualification = (qualification) => {
    setJobData(prev => ({
      ...prev,
      customQualifications: prev.customQualifications.filter(q => q !== qualification)
    }));
  };

  const toggleQualification = (qualification) => {
    setJobData(prev => ({
      ...prev,
      qualification: prev.qualification.includes(qualification)
        ? prev.qualification.filter(q => q !== qualification)
        : [...prev.qualification, qualification]
    }));
  };

  const convertLPAToAnnual = (lpaValue) => {
    return lpaValue ? (parseFloat(lpaValue) * 100000).toString() : '';
  };

  const handleInterviewRoundToggle = (round) => {
    setJobData(prev => ({
      ...prev,
      defaultInterviewRounds: prev.defaultInterviewRounds.includes(round)
        ? prev.defaultInterviewRounds.filter(r => r !== round)
        : [...prev.defaultInterviewRounds, round]
    }));
  };

  const handleSubmit = async (status) => {
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!jobData.title.trim()) {
        alert('Job title is required');
        return;
      }
      if (!jobData.description.trim()) {
        alert('Job description is required');
        return;
      }
      if (!jobData.department && !jobData.customDepartment.trim()) {
        alert('Department is required');
        return;
      }
      if (jobData.department === 'Other' && !jobData.customDepartment.trim()) {
        alert('Custom department is required when "Other" is selected');
        return;
      }
      if (jobData.qualification.length === 0 && jobData.customQualifications.length === 0) {
        alert('At least one qualification is required');
        return;
      }
      if (!jobData.experienceLevel) {
        alert('Experience level is required');
        return;
      }
      if (!jobData.applicationDeadline) {
        alert('Application deadline is required');
        return;
      }

      // Process salary based on format
      const processSalaryValue = (value, format) => {
        if (!value) return '';
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
        title: jobData.title,
        description: jobData.description,
        department: jobData.department === 'Other' ? jobData.customDepartment.trim() : jobData.department,
        jobType: jobData.jobType,
        location: jobData.location,
        locationType: jobData.locationType,
        salaryRange: {
          min: processSalaryValue(jobData.salaryRange.min, jobData.salaryRange.format),
          max: processSalaryValue(jobData.salaryRange.max, jobData.salaryRange.format),
          currency: jobData.salaryRange.currency,
          period: jobData.salaryRange.period,
          format: jobData.salaryRange.format
        },
        qualification: [...jobData.qualification, ...jobData.customQualifications],
        experienceLevel: jobData.experienceLevel,
        requiredSkills: jobData.requiredSkills,
        preferredSkills: jobData.preferredSkills,
        applicationDeadline: jobData.applicationDeadline,
        maxApplicants: jobData.maxApplicants ? Number(jobData.maxApplicants) : undefined,
        resumeRequired: jobData.resumeRequired || true,
        allowMultipleApplications: jobData.allowMultipleApplications || false,
        defaultInterviewRounds: jobData.defaultInterviewRounds || [],
        defaultInterviewer: jobData.defaultInterviewer || '',
        status
      };
      
      console.log('Submitting job data:', submitData);
      console.log('Original job data:', jobData);
      console.log('Processed salary min:', processSalaryValue(jobData.salaryRange.min, jobData.salaryRange.format));
      console.log('Processed salary max:', processSalaryValue(jobData.salaryRange.max, jobData.salaryRange.format));
      
      const response = await makeJsonRequest('/api/hr/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.success) {
        console.log('Job created successfully:', response.data);
        alert(`Job ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`);
        navigate('/hr/jobs');
      } else {
        console.error('Job creation failed:', response);
        alert(response.message || 'Failed to create job');
      }
    } catch (error) {
      console.error('Error submitting job:', error);
      if (error.message === 'Authentication required') {
        alert('Please log in again to continue');
        navigate('/login');
      } else {
        alert(error.message || 'An error occurred while creating the job');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return jobData.title.trim() && 
           jobData.description.trim() && 
           jobData.department && 
           jobData.jobType && 
           jobData.qualification && 
           jobData.experienceLevel &&
           jobData.applicationDeadline;
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                Create Job Posting
              </h1>
              <p className="mt-2 text-gray-600 font-['Roboto']">
                Create a new job posting to attract the right candidates
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/jobs')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Jobs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 font-['Open_Sans']">
                Job Details
              </h3>
              
              <div className="space-y-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Senior Frontend Developer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Department and Job Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={jobData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
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
                        placeholder="Enter custom department"
                        value={jobData.customDepartment}
                        onChange={(e) => handleInputChange('customDepartment', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 mt-2"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={jobData.jobType}
                      onChange={(e) => handleInputChange('jobType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    >
                      <option value="">Select Job Type</option>
                      {jobTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Work Location
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="locationType"
                          value="onsite"
                          checked={jobData.locationType === 'onsite'}
                          onChange={(e) => handleInputChange('locationType', e.target.value)}
                          className="mr-2 h-4 w-4 bg-white border-2 border-black rounded-full focus:ring-2 focus:ring-gray-300 relative appearance-none"
                          style={{
                            backgroundImage: jobData.locationType === 'onsite'
                              ? "radial-gradient(circle, black 30%, transparent 30%)"
                              : "none"
                          }}
                        />
                        <span className="text-sm text-black font-['Roboto']">On-site</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="locationType"
                          value="remote"
                          checked={jobData.locationType === 'remote'}
                          onChange={(e) => handleInputChange('locationType', e.target.value)}
                          className="mr-2 h-4 w-4 bg-white border-2 border-black rounded-full focus:ring-2 focus:ring-gray-300 relative appearance-none"
                          style={{
                            backgroundImage: jobData.locationType === 'remote'
                              ? "radial-gradient(circle, black 30%, transparent 30%)"
                              : "none"
                          }}
                        />
                        <span className="text-sm text-black font-['Roboto']">Remote</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="locationType"
                          value="hybrid"
                          checked={jobData.locationType === 'hybrid'}
                          onChange={(e) => handleInputChange('locationType', e.target.value)}
                          className="mr-2 h-4 w-4 bg-white border-2 border-black rounded-full focus:ring-2 focus:ring-gray-300 relative appearance-none"
                          style={{
                            backgroundImage: jobData.locationType === 'hybrid'
                              ? "radial-gradient(circle, black 30%, transparent 30%)"
                              : "none"
                          }}
                        />
                        <span className="text-sm text-black font-['Roboto']">Hybrid</span>
                      </label>
                    </div>
                    {jobData.locationType !== 'remote' && (
                      <input
                        type="text"
                        value={jobData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., New York, NY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 placeholder-gray-400"
                      />
                    )}
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2 font-['Roboto']">
                    Salary Range (Optional)
                  </label>
                  
                  {/* Salary Format Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Salary Input Format
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="salaryRange.format"
                          value="absolute"
                          checked={jobData.salaryRange.format === 'absolute'}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 focus:ring-offset-0"
                        />
                        <span className="ml-2 text-sm text-gray-900 font-['Roboto']">
                          Absolute Amount (e.g., 500000 for ₹5,00,000)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="salaryRange.format"
                          value="lpa"
                          checked={jobData.salaryRange.format === 'lpa'}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 focus:ring-offset-0"
                        />
                        <span className="ml-2 text-sm text-gray-900 font-['Roboto']">
                          Lakhs Per Annum (e.g., 5 for ₹5 LPA)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-['Roboto']">Currency</label>
                      <select
                        name="salaryRange.currency"
                        value={jobData.salaryRange.currency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm text-gray-900"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-['Roboto']">
                        Min Amount
                        {jobData.salaryRange.format === 'lpa' && (
                          <span className="text-xs text-blue-600 ml-1">(in Lakhs)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        name="salaryRange.min"
                        value={jobData.salaryRange.min}
                        onChange={handleInputChange}
                        placeholder={jobData.salaryRange.format === 'lpa' ? '5' : '500000'}
                        step={jobData.salaryRange.format === 'lpa' ? '0.1' : '1000'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm text-gray-900 placeholder-gray-400"
                      />
                      {jobData.salaryRange.format === 'lpa' && (
                        <p className="text-xs text-gray-500 mt-1">Enter amount in lakhs (e.g., 5 for ₹5 LPA)</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-['Roboto']">
                        Max Amount
                        {jobData.salaryRange.format === 'lpa' && (
                          <span className="text-xs text-blue-600 ml-1">(in Lakhs)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        name="salaryRange.max"
                        value={jobData.salaryRange.max}
                        onChange={handleInputChange}
                        placeholder={jobData.salaryRange.format === 'lpa' ? '8' : '800000'}
                        step={jobData.salaryRange.format === 'lpa' ? '0.1' : '1000'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm text-gray-900 placeholder-gray-400"
                      />
                      {jobData.salaryRange.format === 'lpa' && (
                        <p className="text-xs text-gray-500 mt-1">Enter amount in lakhs (e.g., 8 for ₹8 LPA)</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-['Roboto']">Period</label>
                      <select
                        name="salaryRange.period"
                        value={jobData.salaryRange.period}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm text-gray-900"
                      >
                        <option value="year">Per Year</option>
                        <option value="month">Per Month</option>
                        <option value="hour">Per Hour</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-['Roboto']">
                    {jobData.salaryRange.format === 'lpa' 
                      ? 'Enter amounts in Lakhs Per Annum (LPA) for better readability.'
                      : 'Enter absolute amounts (e.g., 500000 for ₹5,00,000).'
                    } Providing salary information helps attract qualified candidates.
                  </p>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={jobData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the job role, responsibilities, and requirements..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 font-['Open_Sans'] flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                Eligibility Criteria
              </h3>
              
              <div className="space-y-4">
                {/* Qualification and Experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                      Required Qualifications <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Selected Qualifications Display */}
                    {(jobData.qualification.length > 0 || jobData.customQualifications.length > 0) && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {jobData.qualification.map(qual => (
                            <span key={qual} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {qual}
                              <button
                                type="button"
                                onClick={() => toggleQualification(qual)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {jobData.customQualifications.map(qual => (
                            <span key={qual} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {qual}
                              <button
                                type="button"
                                onClick={() => removeCustomQualification(qual)}
                                className="ml-1 text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Qualification Selection */}
                    <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {qualifications.map(qual => (
                          <label key={qual} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={jobData.qualification.includes(qual)}
                              onChange={() => toggleQualification(qual)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="ml-2 text-sm text-gray-700">{qual}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Custom Qualification Input */}
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom qualification"
                          value={customQualificationInput}
                          onChange={(e) => setCustomQualificationInput(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQualification())}
                        />
                        <button
                          type="button"
                          onClick={addCustomQualification}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                      Experience Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={jobData.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    >
                      <option value="">Select Experience</option>
                      {experienceLevels.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Required Skills
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {jobData.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-['Roboto'] flex items-center"
                      >
                        {skill}
                        <button
                          onClick={() => handleSkillRemove('required', index)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd('required'))}
                      placeholder="Type a skill and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleSkillAdd('required')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-r-lg border border-l-0 border-gray-300 font-['Roboto']"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Preferred Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Preferred Skills (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {jobData.preferredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm font-['Roboto'] flex items-center border border-gray-200"
                      >
                        {skill}
                        <button
                          onClick={() => handleSkillRemove('preferred', index)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={preferredSkillInput}
                      onChange={(e) => setPreferredSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd('preferred'))}
                      placeholder="Type a preferred skill and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleSkillAdd('preferred')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-r-lg border border-l-0 border-gray-300 font-['Roboto']"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 font-['Open_Sans'] flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                </svg>
                Application Settings
              </h3>
              
              <div className="space-y-4">
                {/* Application Deadline and Max Applicants */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                      Application Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={jobData.applicationDeadline}
                      onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                      Max Applicants (Optional)
                    </label>
                    <input
                      type="number"
                      value={jobData.maxApplicants}
                      onChange={(e) => handleInputChange('maxApplicants', e.target.value)}
                      placeholder="Leave blank for unlimited"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Application Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                        Resume Required
                      </h4>
                      <p className="text-xs text-gray-500 font-['Roboto']">
                        Require candidates to upload their resume
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={jobData.resumeRequired}
                        onChange={(e) => handleInputChange('resumeRequired', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                        Allow Multiple Applications
                      </h4>
                      <p className="text-xs text-gray-500 font-['Roboto']">
                        Allow the same candidate to apply multiple times
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={jobData.allowMultipleApplications}
                        onChange={(e) => handleInputChange('allowMultipleApplications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Interview Setup */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Open_Sans'] flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Interview Setup (Optional)
              </h3>
              <p className="text-sm text-gray-500 mb-4 font-['Roboto']">
                Configure default interview process (can be edited later)
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Default Interview Rounds
                  </label>
                  <div className="space-y-2">
                    {interviewRounds.map(round => (
                      <label key={round} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={jobData.defaultInterviewRounds.includes(round)}
                          onChange={() => handleInterviewRoundToggle(round)}
                          className="mr-2 h-4 w-4 bg-white border-2 border-black rounded-sm focus:ring-2 focus:ring-gray-300 checked:bg-white checked:border-black relative appearance-none"
                          style={{
                            backgroundImage: jobData.defaultInterviewRounds.includes(round)
                              ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-1.708-1.708L6.5 7.584 4.354 5.438l-1.708 1.708L6.5 11l7.354-7.354z'/%3e%3c/svg%3e\")"
                              : "none"
                          }}
                        />
                        <span className="text-sm text-black font-['Roboto']">{round}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Roboto']">
                    Default Interviewer (Optional)
                  </label>
                  <select
                    value={jobData.defaultInterviewer}
                    onChange={(e) => handleInputChange('defaultInterviewer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-gray-900"
                  >
                    <option value="">Select Interviewer</option>
                    {defaultInterviewers.map(interviewer => (
                      <option key={interviewer} value={interviewer}>{interviewer}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Open_Sans']">
                Job Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
                
                <button
                  onClick={() => handleSubmit('active')}
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50 disabled:bg-gray-300"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Job Immediately'}
                </button>
              </div>
              
              {!isFormValid() && (
                <p className="text-xs text-red-500 mt-2 font-['Roboto']">
                  Please fill in all required fields to publish the job immediately
                </p>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 font-['Roboto'] mb-2">
                  <strong>Tip:</strong> You can save as draft now and publish later from the job management page.
                </p>
                <div className="flex items-center text-xs text-gray-500 font-['Roboto']">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Draft jobs can be edited and published with quick actions from the jobs list
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRCreateJob;
