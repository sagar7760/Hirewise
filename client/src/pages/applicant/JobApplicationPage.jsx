import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

const JobApplicationPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { apiRequest, user, refreshUser } = useAuth();
  

  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [customResumeFile, setCustomResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [job, setJob] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  
  // Helper function to check if user has a resume
  const hasResume = () => {
    // Check for resume at various possible locations
    const hasResumeFile = !!(
      user?.resume?.fileName ||                    // Top-level resume object
      user?.currentResumeId ||                     // Top-level currentResumeId (copied by AuthContext)
      user?.profile?.resume?.fileName ||           // Profile resume object
      user?.profile?.currentResumeId ||            // Profile currentResumeId (original location)
      user?.resumeAvailable                        // Flag set by server
    );
    
    return hasResumeFile;
  };

  // Helper function to get resume details
  const getResumeDetails = () => {
    // Check for currentResumeId at root level (might have been copied there by AuthContext)
    if (user?.currentResumeId) {
      return {
        fileName: user.currentResumeId.originalName || user.currentResumeId.fileName || "Resume",
        source: 'profile',
        uploadDate: user.currentResumeId.uploadDate,
        fileSize: user.currentResumeId.fileSize
      };
    } 
    // Check for currentResumeId in profile
    else if (user?.profile?.currentResumeId) {
      return {
        fileName: user.profile.currentResumeId.originalName || user.profile.currentResumeId.fileName || "Resume",
        source: 'profile',
        uploadDate: user.profile.currentResumeId.uploadDate,
        fileSize: user.profile.currentResumeId.fileSize
      };
    } 
    // Check for legacy resume at root level
    else if (user?.resume?.fileName) {
      return {
        fileName: user.resume.fileName || "Resume",
        source: 'legacy',
        uploadDate: user.resume.uploadDate,
        fileSize: user.resume.fileSize
      };
    } 
    // Check for legacy resume in profile
    else if (user?.profile?.resume?.fileName) {
      return {
        fileName: user.profile.resume.fileName || "Resume",
        source: 'legacy',
        uploadDate: user.profile.resume.uploadDate,
        fileSize: user.profile.resume.fileSize
      };
    }
    
    return null;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    experience: 'fresher',
    expectedSalaryMin: '',
    expectedSalaryMax: '',
    coverLetter: ''
  });

  // Refresh user data when component mounts to ensure we have the latest profile information
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (refreshUser && typeof refreshUser === 'function') {
          await refreshUser();
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    };
    
    // Only call once when component mounts
    if (!user?.profile) {
      loadUserData();
    }
  }, []); // Empty dependency array to run only once

  // Auto-populate from user profile
  useEffect(() => {
    if (user) {

      
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || user.profile?.currentLocation || '',
        experience: user.experience || ''
      }));
      setSkills(user.skills || user.profile?.primarySkills || []);
    }
  }, [user]);

  // Fetch job details and check if already applied
  useEffect(() => {
    const fetchJobAndCheckApplication = async () => {
      try {
        setIsLoading(true);
        
        // Fetch job details
        const jobResponse = await apiRequest(`/api/jobs/${jobId}`);
        
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          // The API returns { success: true, data: { job: {...} } }
          const jobDetails = jobData.data?.job || jobData.data || jobData;
          setJob(jobDetails);
        } else {
          throw new Error(`Failed to fetch job: ${jobResponse.status}`);
        }

        // Check if already applied
        const checkResponse = await apiRequest(`/api/applicant/applications/check/${jobId}`);
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          setHasApplied(checkData.hasApplied);
          setExistingApplication(checkData.application);
        } else if (checkResponse.status === 304) {
          // 304 means not modified - use cached data or default to false
          setHasApplied(false);
          setExistingApplication(null);
        } else {
          console.warn('Unexpected response status:', checkResponse.status);
          setHasApplied(false);
          setExistingApplication(null);
        }

      } catch (error) {
        console.error('Error fetching job or checking application:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJobAndCheckApplication();
    }
  }, [jobId, apiRequest]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillInputChange = (e) => {
    setSkillInput(e.target.value);
  };

  const handleSkillInputKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleCustomResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }

      setCustomResumeFile(file);
      setIsProcessing(true);
      
      // Simulate processing
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsProcessing(false);
          }, 500);
        }
      }, 100);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!useProfileResume) {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const fakeEvent = { target: { files: [file] } };
        handleCustomResumeUpload(fakeEvent);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.experience || formData.experience === '') {
      alert('Please select your experience level.');
      return;
    }
    
    if (!useProfileResume && !customResumeFile) {
      alert('Please upload your custom resume or use your profile resume.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('jobId', jobId);
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('location', formData.location);
      submitData.append('skills', skills.join(','));
      submitData.append('experience', formData.experience);
      submitData.append('expectedSalaryMin', formData.expectedSalaryMin);
      submitData.append('expectedSalaryMax', formData.expectedSalaryMax);
      submitData.append('coverLetter', formData.coverLetter);
      submitData.append('useProfileResume', useProfileResume);

      if (!useProfileResume && customResumeFile) {
        submitData.append('customResume', customResumeFile);
      }

      const response = await apiRequest('/api/applicant/applications', {
        method: 'POST',
        body: submitData,
        headers: {} // Don't set Content-Type for FormData
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.application && result.application._id) {
          alert('Application submitted successfully!');
          navigate('/applicant/applications');
        } else {
          alert('Application not saved. Please try again.');
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error submitting application.');
      }
      
    } catch (error) {
      console.error('Application submission error:', error);
      alert(error.message || 'Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }



  if (!job) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-4">The job you're trying to apply for doesn't exist.</p>
            <Link to="/jobs" className="text-blue-600 hover:text-blue-700">
              Back to Jobs
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (hasApplied) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Applied</h2>
            <p className="text-gray-600 mb-4">
              You have already applied for this position on{' '}
              {new Date(existingApplication?.createdAt).toLocaleDateString()}.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Status: <span className="font-medium">{existingApplication?.status}</span>
            </p>
            <div className="space-x-4">
              <Link to="/applicant/applications" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                View Applications
              </Link>
              <Link to="/jobs" className="text-gray-600 hover:text-gray-700">
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/jobs" className="text-gray-500 hover:text-gray-700 font-['Roboto'] text-sm">
                  Jobs
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link to={`/jobs/${jobId}`} className="text-gray-500 hover:text-gray-700 font-['Roboto'] text-sm">
                  {job?.title || 'Job Details'}
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-['Roboto'] text-sm font-medium">
                  Apply
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Job Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            {(job?.company?.logo || job?.companyDetails?.logo) && (
              <img 
                src={job?.company?.logo || job?.companyDetails?.logo} 
                alt={(typeof job?.company === 'string' ? job?.company : job?.company?.name) || job?.companyName || 'Company Logo'}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-['Open_Sans']">
                {job?.title || 'Job Title Not Available'}
              </h1>
              <p className="text-gray-600 font-['Roboto'] mb-1">
                {(typeof job?.company === 'string' ? job?.company : job?.company?.name) || job?.companyName || 'Company Not Available'}
              </p>
              <p className="text-sm text-gray-500 font-['Roboto']">
                {job?.location || 'Location not specified'} • {job?.jobType || job?.type || 'Type not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Resume Selection */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
              Resume
            </h2>
            
            <div className="space-y-4">
              {/* Profile Resume Option */}
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="profileResume"
                  name="resumeType"
                  checked={useProfileResume}
                  onChange={() => setUseProfileResume(true)}
                  className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300"
                />
                <div className="flex-1">
                  <label htmlFor="profileResume" className="text-sm font-medium text-gray-900 font-['Roboto'] cursor-pointer">
                    Use profile resume
                  </label>
                  {hasResume() && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">
                            Profile Resume Available
                          </p>
                          {(() => {
                            const resumeDetails = getResumeDetails();
                            return resumeDetails ? (
                              <div className="mt-1 space-y-1">
                                <p className="text-xs text-green-700">
                                  <span className="font-medium">File:</span> {resumeDetails.fileName}
                                </p>
                                {resumeDetails.fileSize && (
                                  <p className="text-xs text-green-700">
                                    <span className="font-medium">Size:</span> {(resumeDetails.fileSize / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                                {resumeDetails.uploadDate && (
                                  <p className="text-xs text-green-700">
                                    <span className="font-medium">Uploaded:</span> {new Date(resumeDetails.uploadDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  {!hasResume() && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800">
                            No Profile Resume Found
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Upload a resume to your profile or use the custom resume option below.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Resume Option */}
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="customResume"
                  name="resumeType"
                  checked={!useProfileResume}
                  onChange={() => setUseProfileResume(false)}
                  className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300"
                />
                <div className="flex-1">
                  <label htmlFor="customResume" className="text-sm font-medium text-gray-900 font-['Roboto'] cursor-pointer">
                    Upload different resume
                  </label>
                  
                  {!useProfileResume && (
                    <div 
                      className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      {customResumeFile ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">{customResumeFile.name}</span>
                          </div>
                          
                          {isProcessing && (
                            <div className="space-y-1">
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-black h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500">Processing...</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div>
                            <label className="cursor-pointer text-black hover:text-gray-800 font-medium font-['Roboto']">
                              Click to upload or drag and drop
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleCustomResumeUpload}
                                className="hidden"
                              />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 5MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Application Details
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                  Skills
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
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
                      value={skillInput}
                      onChange={handleSkillInputChange}
                      onKeyPress={handleSkillInputKeyPress}
                      placeholder="Type a skill and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Experience and Salary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Experience Level
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white text-gray-900"
                  >
                    <option value="">Select level</option>
                    <option value="fresher">Fresher</option>
                    <option value="mid-level">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Expected Salary (Min)
                  </label>
                  <input
                    type="number"
                    name="expectedSalaryMin"
                    value={formData.expectedSalaryMin}
                    onChange={handleInputChange}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Expected Salary (Max)
                  </label>
                  <input
                    type="number"
                    name="expectedSalaryMax"
                    value={formData.expectedSalaryMax}
                    onChange={handleInputChange}
                    placeholder="80000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                  Cover Letter <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] resize-none text-gray-900"
                  placeholder="Tell us why you're interested in this position and how your experience makes you a great fit..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.coverLetter.length}/2000 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (useProfileResume && !hasResume())}
                className={`w-full py-3 px-4 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  isSubmitting || (useProfileResume && !hasResume())
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting Application...</span>
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>

              {useProfileResume && !hasResume() && (
                <p className="text-sm text-amber-600 text-center">
                  Please add a resume to your profile or upload a custom resume to continue.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobApplicationPage;
