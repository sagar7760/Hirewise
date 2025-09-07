import React, { useState } from 'react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    // Account Info (mandatory)
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Profile Info (basic)
    currentLocation: '',
    highestQualification: '',
    fieldOfStudy: '',
    universityName: '',
    graduationYear: '',
    currentStatus: '',
    cgpaPercentage: '',
    primarySkills: '',
    yearsOfExperience: '',
    
    // Resume Upload (optional)
    resume: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Predefined options for dropdowns
  const qualificationOptions = [
    'High School',
    'Diploma/Certificate',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD/Doctorate',
    'Other'
  ];

  const experienceOptions = [
    'Fresher',
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5-7 years',
    '7-10 years',
    '10+ years'
  ];

  const currentStatusOptions = [
    'Fresher',
    'Student',
    'Working Professional'
  ];

  // Generate graduation years (current year back to 1980)
  const currentYear = new Date().getFullYear();
  const graduationYears = [];
  for (let year = currentYear; year >= 1980; year--) {
    graduationYears.push(year);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          resume: 'Please upload a PDF, DOC, or DOCX file'
        }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          resume: 'File size should be less than 5MB'
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        resume: file
      }));
      
      // Clear error if file is valid
      if (errors.resume) {
        setErrors(prev => ({
          ...prev,
          resume: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
    if (!formData.currentLocation.trim()) newErrors.currentLocation = 'Current location is required';
    if (!formData.highestQualification) newErrors.highestQualification = 'Highest qualification is required';
    if (!formData.fieldOfStudy.trim()) newErrors.fieldOfStudy = 'Field of study is required';
    if (!formData.universityName.trim()) newErrors.universityName = 'University/College name is required';
    if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required';
    if (!formData.currentStatus) newErrors.currentStatus = 'Current status is required';
    if (!formData.primarySkills.trim()) newErrors.primarySkills = 'Primary skills are required';
    if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Years of experience is required';
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password strength validation
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    // Password confirmation validation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Handle signup logic here
      console.log('Signup attempt:', formData);
      // TODO: Send data to backend API
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
            Create your account
          </h1>
          <p className="text-lg text-gray-600 font-['Roboto']">
            Join HireWise and start your journey to find the perfect job
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Account Information Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] border-b border-gray-200 pb-2">
              Account Information
            </h2>
            
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.05 8.05m1.828 1.828l-.94.94M6.221 6.22l12.574 12.574" />
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] border-b border-gray-200 pb-2">
              Profile Information
            </h2>
            
            {/* Current Location */}
            <div>
              <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Current Location / City <span className="text-red-500">*</span>
              </label>
              <input
                id="currentLocation"
                name="currentLocation"
                type="text"
                required
                value={formData.currentLocation}
                onChange={handleInputChange}
                placeholder="e.g., Mumbai, Bangalore, Delhi"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
              {errors.currentLocation && <p className="mt-1 text-sm text-red-600">{errors.currentLocation}</p>}
            </div>

            {/* Education Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 font-['Open_Sans']">
                Education Details
              </h3>
              
              {/* Highest Qualification */}
              <div>
                <label htmlFor="highestQualification" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                  Highest Qualification <span className="text-red-500">*</span>
                </label>
                <select
                  id="highestQualification"
                  name="highestQualification"
                  required
                  value={formData.highestQualification}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
                >
                  <option value="">Select your qualification</option>
                  {qualificationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.highestQualification && <p className="mt-1 text-sm text-red-600">{errors.highestQualification}</p>}
              </div>

              {/* Field of Study */}
              <div>
                <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                  Field of Study / Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  id="fieldOfStudy"
                  name="fieldOfStudy"
                  type="text"
                  required
                  value={formData.fieldOfStudy}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science, Mechanical Engineering, MBA"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
                />
                {errors.fieldOfStudy && <p className="mt-1 text-sm text-red-600">{errors.fieldOfStudy}</p>}
              </div>

              {/* University/College Name */}
              <div>
                <label htmlFor="universityName" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                  University/College Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="universityName"
                  name="universityName"
                  type="text"
                  required
                  value={formData.universityName}
                  onChange={handleInputChange}
                  placeholder="e.g., Indian Institute of Technology, Delhi University"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
                />
                {errors.universityName && <p className="mt-1 text-sm text-red-600">{errors.universityName}</p>}
              </div>

              {/* Graduation Year and Current Status in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Graduation Year */}
                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="graduationYear"
                    name="graduationYear"
                    required
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
                  >
                    <option value="">Select year</option>
                    {graduationYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.graduationYear && <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>}
                </div>

                {/* Current Status */}
                <div>
                  <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                    Current Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="currentStatus"
                    name="currentStatus"
                    required
                    value={formData.currentStatus}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
                  >
                    <option value="">Select status</option>
                    {currentStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.currentStatus && <p className="mt-1 text-sm text-red-600">{errors.currentStatus}</p>}
                </div>
              </div>

              {/* CGPA/Percentage (Optional) */}
              <div>
                <label htmlFor="cgpaPercentage" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                  CGPA / Percentage <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  id="cgpaPercentage"
                  name="cgpaPercentage"
                  type="text"
                  value={formData.cgpaPercentage}
                  onChange={handleInputChange}
                  placeholder="e.g., 8.5 CGPA or 85%"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
                />
                <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                  This helps HR filter candidates based on academic performance
                </p>
              </div>
            </div>

            {/* Primary Skills */}
            <div>
              <label htmlFor="primarySkills" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Primary Skills / Technologies <span className="text-red-500">*</span>
              </label>
              <input
                id="primarySkills"
                name="primarySkills"
                type="text"
                required
                value={formData.primarySkills}
                onChange={handleInputChange}
                placeholder="e.g., Java, Python, React, Node.js, MySQL"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
              {errors.primarySkills && <p className="mt-1 text-sm text-red-600">{errors.primarySkills}</p>}
              <p className="mt-1 text-sm text-gray-500 font-['Roboto']">
                Separate multiple skills with commas
              </p>
            </div>

            {/* Years of Experience */}
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <select
                id="yearsOfExperience"
                name="yearsOfExperience"
                required
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              >
                <option value="">Select your experience level</option>
                {experienceOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.yearsOfExperience && <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>}
            </div>
          </div>

          {/* Resume Upload Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] border-b border-gray-200 pb-2">
              Resume Upload
            </h2>
            
            <div>
              <label htmlFor="resume" className="block text-sm font-medium text-gray-700 font-['Open_Sans'] mb-2">
                Upload Resume <span className="text-gray-400">(Optional - can be added later)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="resume"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black"
                    >
                      <span>Upload a file</span>
                      <input
                        id="resume"
                        name="resume"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1 font-['Roboto']">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 font-['Roboto']">
                    PDF, DOC, DOCX up to 5MB
                  </p>
                  {formData.resume && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {formData.resume.name}
                    </p>
                  )}
                </div>
              </div>
              {errors.resume && <p className="mt-1 text-sm text-red-600">{errors.resume}</p>}
              <p className="mt-2 text-sm text-gray-500 font-['Roboto']">
                You can skip this now and upload your resume when applying for jobs. 
                If uploaded, we'll help auto-fill your profile information.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 py-3 px-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors"
            >
              Create Account
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 font-['Roboto']">
              Already have an account?{' '}
              <a 
                href="#" 
                className="text-black hover:underline font-semibold transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
