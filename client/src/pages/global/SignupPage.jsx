import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ResumeParser } from '../../utils/resumeParser';

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Account Info (mandatory)
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Profile Info (basic)
    currentLocation: '',
    educationEntries: [{
      id: 1,
      qualification: '',
      fieldOfStudy: '',
      universityName: '',
      graduationYear: '',
      cgpaPercentage: ''
    }],
    currentStatus: '',
    primarySkills: [],
    
    // Work Experience (optional - for working professionals)
    workExperienceEntries: [{
      id: 1,
      yearsOfExperience: '',
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrentlyWorking: false,
      description: ''
    }],
    
    // Resume Upload (optional)
    resume: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Suggested skills for better UX
  const suggestedSkills = [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript',
    // Web Technologies
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS',
    // Databases
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'Linux',
    // Mobile Development
    'React Native', 'Flutter', 'Android', 'iOS', 'Swift', 'Kotlin',
    // Data & Analytics
    'SQL', 'Excel', 'Power BI', 'Tableau', 'R', 'Pandas', 'NumPy', 'Machine Learning',
    // Design
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX Design',
    // Other
    'Project Management', 'Agile', 'Scrum', 'Communication', 'Leadership', 'Problem Solving'
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

  const handleFileChange = async (e) => {
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

      // Parse resume and auto-fill form
      try {
        setIsParsingResume(true);
        setParseSuccess(false);
        
        const parsedData = await ResumeParser.parseFile(file);
        
        // Auto-fill form with parsed data
        setFormData(prev => ({
          ...prev,
          fullName: parsedData.fullName || prev.fullName,
          email: parsedData.email || prev.email,
          phone: parsedData.phone || prev.phone,
          currentLocation: parsedData.currentLocation || prev.currentLocation,
          primarySkills: parsedData.primarySkills.length > 0 ? parsedData.primarySkills : prev.primarySkills,
          educationEntries: parsedData.educationEntries.length > 0 && parsedData.educationEntries[0].qualification 
            ? parsedData.educationEntries 
            : prev.educationEntries,
          workExperienceEntries: parsedData.workExperienceEntries.length > 0 && parsedData.workExperienceEntries[0].position
            ? parsedData.workExperienceEntries 
            : prev.workExperienceEntries
        }));
        
        setParseSuccess(true);
        
        // Show success message briefly
        setTimeout(() => setParseSuccess(false), 3000);
        
      } catch (error) {
        console.error('Resume parsing failed:', error);
        setErrors(prev => ({
          ...prev,
          resume: 'Failed to parse resume. You can still fill the form manually.'
        }));
      } finally {
        setIsParsingResume(false);
      }
    }
  };

  // Education management functions
  const addEducationEntry = () => {
    const newId = Math.max(...formData.educationEntries.map(entry => entry.id)) + 1;
    setFormData(prev => ({
      ...prev,
      educationEntries: [...prev.educationEntries, {
        id: newId,
        qualification: '',
        fieldOfStudy: '',
        universityName: '',
        graduationYear: '',
        cgpaPercentage: ''
      }]
    }));
  };

  const removeEducationEntry = (id) => {
    if (formData.educationEntries.length > 1) {
      setFormData(prev => ({
        ...prev,
        educationEntries: prev.educationEntries.filter(entry => entry.id !== id)
      }));
      
      // Clear any related errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`education_${id}_qualification`];
        delete newErrors[`education_${id}_fieldOfStudy`];
        delete newErrors[`education_${id}_universityName`];
        delete newErrors[`education_${id}_graduationYear`];
        return newErrors;
      });
    }
  };

  const handleEducationChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      educationEntries: prev.educationEntries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
    
    // Clear error when user starts typing
    const errorKey = `education_${id}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  // Skills management functions
  const addSkill = (skill) => {
    if (skill && !formData.primarySkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        primarySkills: [...prev.primarySkills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      primarySkills: prev.primarySkills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Work Experience management functions
  const addWorkExperience = () => {
    const newId = Math.max(...formData.workExperienceEntries.map(entry => entry.id)) + 1;
    setFormData(prev => ({
      ...prev,
      workExperienceEntries: [...prev.workExperienceEntries, {
        id: newId,
        yearsOfExperience: '',
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrentlyWorking: false,
        description: ''
      }]
    }));
  };

  const removeWorkExperience = (id) => {
    if (formData.workExperienceEntries.length > 1) {
      setFormData(prev => ({
        ...prev,
        workExperienceEntries: prev.workExperienceEntries.filter(entry => entry.id !== id)
      }));
    }
  };

  const handleWorkExperienceChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      workExperienceEntries: prev.workExperienceEntries.map(entry =>
        entry.id === id ? { 
          ...entry, 
          [field]: value,
          // Clear end date if currently working is checked
          ...(field === 'isCurrentlyWorking' && value ? { endDate: '' } : {})
        } : entry
      )
    }));
    
    // Clear error when user starts typing
    const errorKey = `work_${id}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
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
    if (!formData.currentStatus) newErrors.currentStatus = 'Current status is required';
    if (!formData.primarySkills || formData.primarySkills.length === 0) newErrors.primarySkills = 'At least one skill is required';
    
    // Education validation - ensure at least one complete education entry
    if (!formData.educationEntries || formData.educationEntries.length === 0) {
      newErrors.education = 'At least one education entry is required';
    } else {
      // Validate each education entry
      formData.educationEntries.forEach((education) => {
        if (!education.qualification) {
          newErrors[`education_${education.id}_qualification`] = 'Qualification is required';
        }
        if (!education.fieldOfStudy.trim()) {
          newErrors[`education_${education.id}_fieldOfStudy`] = 'Field of study is required';
        }
        if (!education.universityName.trim()) {
          newErrors[`education_${education.id}_universityName`] = 'University/College name is required';
        }
        if (!education.graduationYear) {
          newErrors[`education_${education.id}_graduationYear`] = 'Graduation year is required';
        }
      });
    }
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare form data for submission
      const submitData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        currentLocation: formData.currentLocation.trim(),
        currentStatus: formData.currentStatus,
        educationEntries: formData.educationEntries.map(entry => ({
          qualification: entry.qualification,
          fieldOfStudy: entry.fieldOfStudy.trim(),
          universityName: entry.universityName.trim(),
          graduationYear: entry.graduationYear,
          cgpaPercentage: entry.cgpaPercentage.trim()
        })),
        workExperienceEntries: formData.workExperienceEntries.map(entry => ({
          yearsOfExperience: entry.yearsOfExperience,
          company: entry.company.trim(),
          position: entry.position.trim(),
          startDate: entry.startDate,
          endDate: entry.endDate,
          isCurrentlyWorking: entry.isCurrentlyWorking,
          description: entry.description.trim()
        })),
        primarySkills: formData.primarySkills
      };

      console.log('Submitting signup data:', submitData);

      // Step 1: Register the user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (data.success) {
        // Step 2: If resume is provided, upload it
        if (formData.resume) {
          try {
            console.log('Uploading resume file...');
            
            // Create FormData for file upload
            const resumeFormData = new FormData();
            resumeFormData.append('resume', formData.resume);

            const resumeResponse = await fetch('/api/resumes/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${data.token}`
              },
              body: resumeFormData
            });

            const resumeData = await resumeResponse.json();
            console.log('Resume upload response:', resumeData);

            if (resumeData.success) {
              console.log('Resume uploaded successfully');
            } else {
              console.warn('Resume upload failed:', resumeData.message);
              // Don't fail the entire signup process if resume upload fails
            }
          } catch (resumeError) {
            console.error('Resume upload error:', resumeError);
            // Don't fail the entire signup process if resume upload fails
          }
        }

        // Successfully registered (with or without resume), redirect to login
        navigate('/login', { 
          state: { 
            message: formData.resume 
              ? 'Account created successfully with resume! Please log in with your credentials.'
              : 'Account created successfully! Please log in with your credentials.',
            email: formData.email
          }
        });
      } else {
        // Handle API validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const newErrors = {};
          data.errors.forEach(error => {
            newErrors[error.field] = error.message;
          });
          setErrors(newErrors);
        } else if (data.field) {
          setErrors({ [data.field]: data.message });
        } else {
          setErrors({ submit: data.message || 'Registration failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ 
        submit: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">
            Create your account
          </h1>
          <p className="text-lg text-gray-600 font-['Roboto']">
            Join HireWise and start your journey to find the perfect job
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Resume Upload Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 border-b border-gray-200 pb-2">
              Resume Upload
            </h2>
            
            <div>
              <label htmlFor="resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                Upload Resume <span className="text-gray-400">(Optional - can be added later)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors dark:border-gray-600 dark:hover:border-gray-500">
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
                      className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black dark:bg-gray-800 dark:text-gray-100 dark:focus-within:ring-gray-300"
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
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 font-medium">
                         {formData.resume.name}
                      </p>
                      {isParsingResume && (
                        <p className="text-sm text-blue-600 font-medium">
                           Parsing resume to auto-fill form...
                        </p>
                      )}
                      {parseSuccess && (
                        <p className="text-sm text-green-600 font-medium">
                           Resume parsed successfully! Form fields have been auto-filled please review them.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {errors.resume && <p className="mt-1 text-sm text-red-500">{errors.resume}</p>}
              <p className="mt-2 text-sm text-gray-500 font-['Roboto']">
                You can skip this now and upload your resume when applying for jobs. 
                If uploaded, we'll automatically parse it and help auto-fill your profile information.
              </p>
            </div>
          </div>
          
          {/* Account Information Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 border-b border-gray-200 pb-2">
              Account Information
            </h2>
            
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
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
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
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
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
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
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors pr-12 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
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
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
              />
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 border-b border-gray-200 pb-2">
              Profile Information
            </h2>
            
            {/* Current Location */}
            <div>
              <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
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
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
              />
              {errors.currentLocation && <p className="mt-1 text-sm text-red-600">{errors.currentLocation}</p>}
            </div>

            {/* Education Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 border-b border-gray-200 pb-2 flex-1 mr-4">
                  Education Details
                </h3>
                <button
                  type="button"
                  onClick={addEducationEntry}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium font-['Open_Sans'] transition-colors flex items-center gap-2 shrink-0 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Education
                </button>
              </div>
              
              {formData.educationEntries.map((education, index) => (
                <div key={education.id} className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 font-['Open_Sans']">
                      Education {index + 1}
                    </h4>
                    {formData.educationEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducationEntry(education.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors dark:hover:bg-red-900 dark:hover:text-red-300"
                        title="Remove this education entry"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Qualification */}
                  <div>
                    <label htmlFor={`qualification_${education.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={`qualification_${education.id}`}
                      name={`qualification_${education.id}`}
                      required
                      value={education.qualification}
                      onChange={(e) => handleEducationChange(education.id, 'qualification', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                    >
                      <option value="">Select qualification</option>
                      {qualificationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors[`education_${education.id}_qualification`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`education_${education.id}_qualification`]}</p>
                    )}
                  </div>

                  {/* Field of Study */}
                  <div>
                    <label htmlFor={`fieldOfStudy_${education.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                      Field of Study / Specialization <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`fieldOfStudy_${education.id}`}
                      name={`fieldOfStudy_${education.id}`}
                      type="text"
                      required
                      value={education.fieldOfStudy}
                      onChange={(e) => handleEducationChange(education.id, 'fieldOfStudy', e.target.value)}
                      placeholder="e.g., Computer Science, Mechanical Engineering, MBA"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                    />
                    {errors[`education_${education.id}_fieldOfStudy`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`education_${education.id}_fieldOfStudy`]}</p>
                    )}
                  </div>

                  {/* University/College Name */}
                  <div>
                    <label htmlFor={`universityName_${education.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                      University/College Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`universityName_${education.id}`}
                      name={`universityName_${education.id}`}
                      type="text"
                      required
                      value={education.universityName}
                      onChange={(e) => handleEducationChange(education.id, 'universityName', e.target.value)}
                      placeholder="e.g., Indian Institute of Technology, Delhi University"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                    />
                    {errors[`education_${education.id}_universityName`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`education_${education.id}_universityName`]}</p>
                    )}
                  </div>

                  {/* Graduation Year and CGPA/Percentage in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Graduation Year */}
                    <div>
                      <label htmlFor={`graduationYear_${education.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                        Graduation Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`graduationYear_${education.id}`}
                        name={`graduationYear_${education.id}`}
                        required
                        value={education.graduationYear}
                        onChange={(e) => handleEducationChange(education.id, 'graduationYear', e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                      >
                        <option value="">Select year</option>
                        {graduationYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {errors[`education_${education.id}_graduationYear`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`education_${education.id}_graduationYear`]}</p>
                      )}
                    </div>

                    {/* CGPA/Percentage */}
                    <div>
                      <label htmlFor={`cgpaPercentage_${education.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                        CGPA / Percentage <span className="text-gray-400">(Optional)</span>
                      </label>
                      <input
                        id={`cgpaPercentage_${education.id}`}
                        name={`cgpaPercentage_${education.id}`}
                        type="text"
                        value={education.cgpaPercentage}
                        onChange={(e) => handleEducationChange(education.id, 'cgpaPercentage', e.target.value)}
                        placeholder="e.g., 8.5 CGPA or 85%"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                      />
                     
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-['Roboto']">
                        Add multiple education qualifications if you have degrees from different institutions or multiple qualifications.
                      </p>
                </div>
              ))}
              
              
            </div>

            {/* Current Status */}
            <div>
              <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                Current Status <span className="text-red-500">*</span>
              </label>
              <select
                id="currentStatus"
                name="currentStatus"
                required
                value={formData.currentStatus}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
              >
                <option value="">Select status</option>
                {currentStatusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.currentStatus && <p className="mt-1 text-sm text-red-600">{errors.currentStatus}</p>}
            </div>

            {/* Primary Skills */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                Primary Skills / Technologies <span className="text-red-500">*</span>
              </label>
              
              {/* Selected Skills Display */}
              {formData.primarySkills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[60px] dark:border-gray-700 dark:bg-gray-800">
                  {formData.primarySkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded-full font-['Roboto'] dark:bg-white dark:text-black"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 text-gray-300 hover:text-white transition-colors dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Custom Skill Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const skill = e.target.value.trim();
                      if (skill) {
                        addSkill(skill);
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    const skill = input.value.trim();
                    if (skill) {
                      addSkill(skill);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-['Open_Sans'] text-sm dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Add
                </button>
              </div>
              
              {/* Suggested Skills */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-['Open_Sans'] mb-2">Popular Skills (click to add):</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {suggestedSkills
                    .filter(skill => !formData.primarySkills.includes(skill))
                    .slice(0, 30)
                    .map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-colors font-['Roboto'] text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
              
              {errors.primarySkills && <p className="mt-1 text-sm text-red-600">{errors.primarySkills}</p>}
              <p className="text-sm text-gray-500 font-['Roboto']">
                Add skills that best represent your expertise. You can type custom skills or select from popular ones.
              </p>
            </div>

            {/* Work Experience Section - Only show for Working Professionals */}
            {formData.currentStatus === 'Working Professional' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 border-b border-gray-200 pb-2 flex-1 mr-4">
                    Work Experience Details <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addWorkExperience}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium font-['Open_Sans'] transition-colors flex items-center gap-2 shrink-0 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Experience
                  </button>
                </div>
                
                {formData.workExperienceEntries.map((experience, index) => (
                  <div key={experience.id} className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 font-['Open_Sans']">
                        Experience {index + 1}
                      </h4>
                      {formData.workExperienceEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWorkExperience(experience.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Remove this work experience"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Years of Experience for this role */}
                    <div>
                      <label htmlFor={`yearsOfExperience_${experience.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                        Experience Level for this Role
                      </label>
                      <select
                        id={`yearsOfExperience_${experience.id}`}
                        value={experience.yearsOfExperience}
                        onChange={(e) => handleWorkExperienceChange(experience.id, 'yearsOfExperience', e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                      >
                        <option value="">Select experience level</option>
                        {experienceOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label htmlFor={`company_${experience.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                        Company Name
                      </label>
                      <input
                        id={`company_${experience.id}`}
                        type="text"
                        value={experience.company}
                        onChange={(e) => handleWorkExperienceChange(experience.id, 'company', e.target.value)}
                        placeholder="e.g., Google, Microsoft, TCS, Infosys"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <label htmlFor={`position_${experience.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                        Position/Role
                      </label>
                      <input
                        id={`position_${experience.id}`}
                        type="text"
                        value={experience.position}
                        onChange={(e) => handleWorkExperienceChange(experience.id, 'position', e.target.value)}
                        placeholder="e.g., Software Engineer, Data Analyst, Project Manager"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                      />
                    </div>

                    {/* Work Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div>
                        <label htmlFor={`startDate_${experience.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                          Start Date
                        </label>
                        <input
                          id={`startDate_${experience.id}`}
                          type="month"
                          value={experience.startDate}
                          onChange={(e) => handleWorkExperienceChange(experience.id, 'startDate', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                        />
                      </div>

                      {/* End Date or Currently Working */}
                      <div>
                        <label htmlFor={`endDate_${experience.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                          End Date
                        </label>
                        <div className="space-y-2">
                          <input
                            id={`endDate_${experience.id}`}
                            type="month"
                            value={experience.endDate}
                            onChange={(e) => handleWorkExperienceChange(experience.id, 'endDate', e.target.value)}
                            disabled={experience.isCurrentlyWorking}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:disabled:bg-gray-700"
                          />
                          <label className="flex items-center text-sm text-gray-600 font-['Roboto']">
                            <input
                              type="checkbox"
                              checked={experience.isCurrentlyWorking}
                              onChange={(e) => handleWorkExperienceChange(experience.id, 'isCurrentlyWorking', e.target.checked)}
                              className="mr-2 rounded border-gray-300 text-black focus:ring-black dark:border-gray-600 dark:text-white dark:focus:ring-gray-300"
                            />
                            I currently work here
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Work Description */}
                    <div>
                      <label htmlFor={`description_${experience.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
                        Job Description/Responsibilities
                      </label>
                      <textarea
                        id={`description_${experience.id}`}
                        rows="3"
                        value={experience.description}
                        onChange={(e) => handleWorkExperienceChange(experience.id, 'description', e.target.value)}
                        placeholder="Briefly describe your key responsibilities and achievements..."
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors resize-vertical dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100 dark:focus:ring-gray-300 dark:focus:border-gray-300"
                      />
                    </div>
                    <p className="text-sm text-gray-500 font-['Roboto']">
                   Adding detailed work experience helps employers understand your background better and improves job matching. You can add multiple roles if you've worked at different companies.
                    </p>
                  </div>
                ))}
                
                
              </div>
            )}
          </div>

          

          {/* Submit Button */}
          <div className="pt-6">
            {/* Display submit errors */}
            {errors.submit && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300">
                <p className="text-sm text-red-600 font-['Roboto']">{errors.submit}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed py-3 px-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors flex items-center justify-center gap-2 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:disabled:bg-gray-600"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-black dark:text-white hover:underline font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
