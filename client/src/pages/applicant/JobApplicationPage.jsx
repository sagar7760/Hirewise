import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const JobApplicationPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    agreeToTerms: false
  });

  // Mock job data - in real app, this would be fetched based on jobId
  const job = {
    id: jobId,
    title: 'Senior Software Engineer',
    company: 'Tech Solutions Inc.',
    location: 'San Francisco, CA'
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleResumeUpload = (e) => {
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

      setResumeFile(file);
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
      
      console.log('Resume uploaded:', file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a fake event object to reuse the upload handler
      const fakeEvent = { target: { files: [file] } };
      handleResumeUpload(fakeEvent);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resumeFile) {
      alert('Please upload your resume before submitting.');
      return;
    }
    
    if (!formData.agreeToTerms) {
      alert('Please agree to the terms and conditions.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    console.log('Submitting application:', {
      jobId,
      formData,
      resumeFile
    });
    
    // Simulate processing time
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Application submitted successfully!');
      navigate('/jobs');
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
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
                  {job.title}
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

        {/* Page Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Resume Upload Section */}
          <div className="p-8 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
              Upload Your Resume
            </h1>
            
            <div 
              className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {resumeFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-gray-500 font-['Roboto']">
                          {(resumeFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {isProcessing && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-['Roboto']">Processing...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 font-['Roboto']">
                        Extracting key information from your resume
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-lg font-medium text-gray-900 font-['Open_Sans']">
                      Drag and drop your resume here, or
                    </p>
                    <p className="text-sm text-gray-600 font-['Roboto'] mb-4">
                      Accepted formats: PDF, DOC, DOCX
                    </p>
                  </div>
                  <label className="cursor-pointer bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors inline-block">
                    Browse Files
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Application Form */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Apply for {job.title}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                    Skills
                  </label>
                  <select
                    name="skills"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white text-gray-900"
                  >
                    <option value="">Select your skills</option>
                    <option value="javascript">JavaScript</option>
                    <option value="react">React</option>
                    <option value="nodejs">Node.js</option>
                    <option value="python">Python</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                  Email
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

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                  Phone number
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

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-1">
                  Cover letter (optional)
                </label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] resize-none text-gray-900"
                  placeholder="Tell us why you're interested in this position..."
                />
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700 font-['Roboto']">
                  I agree to the terms and conditions
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium font-['Roboto'] transition-colors ${
                  isSubmitting
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
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobApplicationPage;
