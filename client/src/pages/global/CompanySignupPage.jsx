import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../utils/api';

const CompanySignupPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const isTransitioning = useRef(false); // Track if we're moving between steps

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Organization Details
    companyName: '',
    industry: '',
    companySize: '',
    headquarters: '',
    country: 'India', // Default to India
    companyLogo: null,
    website: '',
    registrationNumber: '',
    
    // Step 2: Admin HR Details
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    adminPhone: '',
    
    // Step 3: Additional Info
    companyDescription: '',
    linkedinUrl: '',
    careersPageUrl: '',
    hiringRegions: '',
    remotePolicy: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-scroll to first error field when validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0 && errors.submit === undefined) {
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorKey) || document.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  }, [errors]);

  // Dropdown options
  const industryOptions = [
    'Information Technology',
    'Financial Services',
    'Healthcare',
    'Manufacturing',
    'E-commerce',
    'Education',
    'Consulting',
    'Real Estate',
    'Media & Entertainment',
    'Automotive',
    'Retail',
    'Food & Beverage',
    'Telecommunications',
    'Energy',
    'Other'
  ];

  const companySizeOptions = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const remotePolicyOptions = [
    'Fully Remote',
    'Hybrid (Remote + Office)',
    'On-site Only',
    'Flexible'
  ];

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik'
  ];

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
      // Validate file type (images only)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          companyLogo: 'Please upload a JPG, PNG, or SVG file'
        }));
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          companyLogo: 'File size should be less than 2MB'
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        companyLogo: file
      }));
      
      // Clear error
      setErrors(prev => ({
        ...prev,
        companyLogo: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Organization Details validation
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!formData.industry) {
        newErrors.industry = 'Industry selection is required';
      }
      if (!formData.companySize) {
        newErrors.companySize = 'Company size is required';
      }
      if (!formData.headquarters.trim()) {
        newErrors.headquarters = 'Headquarters location is required';
      }
    }

    if (step === 2) {
      // Admin HR Details validation
      if (!formData.adminFullName.trim()) {
        newErrors.adminFullName = 'Full name is required';
      } else {
        const nameParts = formData.adminFullName.trim().split(/\s+/);
        if (nameParts.length < 2) {
          newErrors.adminFullName = 'Please enter your full name (first and last name)';
        } else if (nameParts[0].length < 2 || nameParts[nameParts.length - 1].length < 2) {
          newErrors.adminFullName = 'First and last name must be at least 2 characters each';
        }
      }
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        newErrors.adminEmail = 'Please enter a valid email address';
      }
      if (!formData.adminPassword) {
        newErrors.adminPassword = 'Password is required';
      } else if (formData.adminPassword.length < 6) {
        newErrors.adminPassword = 'Password must be at least 6 characters';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.adminPassword)) {
        newErrors.adminPassword = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (formData.adminPhone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.adminPhone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.adminPhone = 'Please enter a valid phone number';
      }
    }

    if (step === 3) {
      // Additional Info validation (optional fields with format validation)
      if (formData.linkedinUrl && !/^https?:\/\/(www\.)?linkedin\.com\/.*$/.test(formData.linkedinUrl)) {
        newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL (https://linkedin.com/...)';
      }
      if (formData.careersPageUrl && !/^https?:\/\/.+\..+/.test(formData.careersPageUrl)) {
        newErrors.careersPageUrl = 'Please enter a valid URL (e.g., https://company.com/careers)';
      }
      if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
        newErrors.website = 'Please enter a valid website URL (e.g., https://company.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async (e) => {
    // Prevent form submission if this is called from a button click
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('handleNext called, currentStep:', currentStep);
    
    if (!validateStep(currentStep)) {
      console.log('Validation failed for step', currentStep);
      return;
    }
    
    console.log('Validation passed for step', currentStep);
    
    // Additional backend validation for Step 1 (Company Details)
    if (currentStep === 1) {
      console.log('Running backend validation for Step 1');
      try {
        // Check if company name already exists
        const response = await fetch(buildApiUrl('/api/auth/company/check-name'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName: formData.companyName.trim() })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          console.log('Company name validation failed:', data.message);
          setErrors({ companyName: data.message || 'This company name is already registered' });
          return;
        }
        console.log('Company name validation passed');
      } catch (error) {
        console.error('Error checking company name:', error);
        // Continue anyway if network error (will be caught at final submission)
      }
    }
    
    console.log('Moving to next step');
    isTransitioning.current = true;
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    
    // Reset transition flag after a brief delay
    setTimeout(() => {
      isTransitioning.current = false;
      console.log('Transition complete, flag reset');
    }, 100);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    console.log('handleSubmit called, currentStep:', currentStep, 'isSubmitting:', isSubmitting, 'isTransitioning:', isTransitioning.current);
    
    // Prevent submission during step transitions
    if (isTransitioning.current) {
      console.log('Currently transitioning, ignoring submit');
      return;
    }
    
    // Prevent double submissions
    if (isSubmitting) {
      console.log('Already submitting, returning');
      return;
    }
    
    // Only allow submission on the final step (Step 3)
    if (currentStep !== 3) {
      console.log('Not on step 3, calling handleNext');
      // If not on final step, just move to next step
      await handleNext();
      console.log('handleNext completed, returning from handleSubmit');
      return;
    }
    
    console.log('On step 3, proceeding with submission');
    
    // We're on step 3, validate before submitting
    if (!validateStep(currentStep)) {
      console.log('Validation failed on step 3');
      return;
    }

    console.log('Validation passed, submitting form');
    setIsSubmitting(true);
    try {
      // Create FormData for file upload support
      const formDataToSend = new FormData();
      
      // Add all text fields
      formDataToSend.append('companyName', formData.companyName);
      formDataToSend.append('industry', formData.industry);
      formDataToSend.append('companySize', formData.companySize.replace(' employees', ''));
      formDataToSend.append('headquarters', formData.headquarters);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('adminFullName', formData.adminFullName);
      formDataToSend.append('adminEmail', formData.adminEmail);
      formDataToSend.append('adminPassword', formData.adminPassword);
      
      // Add optional text fields only if they have values
      if (formData.website) formDataToSend.append('website', formData.website);
      if (formData.registrationNumber) formDataToSend.append('registrationNumber', formData.registrationNumber);
      if (formData.adminPhone) formDataToSend.append('adminPhone', formData.adminPhone);
      if (formData.companyDescription) formDataToSend.append('companyDescription', formData.companyDescription);
      if (formData.linkedinUrl) formDataToSend.append('linkedinUrl', formData.linkedinUrl);
      if (formData.careersPageUrl) formDataToSend.append('careersPageUrl', formData.careersPageUrl);
      if (formData.hiringRegions) formDataToSend.append('hiringRegions', formData.hiringRegions);
      if (formData.remotePolicy) formDataToSend.append('remotePolicy', formData.remotePolicy);
      
      // Add logo file if it exists
      if (formData.companyLogo) {
        formDataToSend.append('companyLogo', formData.companyLogo);
      }
      
      console.log('Sending form data with file upload support'); // Debug log
      
      const response = await fetch(buildApiUrl('/api/auth/company/register'), {
        method: 'POST',
        // Don't set Content-Type header - let browser set it with boundary for FormData
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to email OTP verification
        navigate('/verify-email', {
          state: { email: formData.adminEmail }
        });
      } else {
        // Handle API validation errors
        const newErrors = {};
        
        if (data.errors && Array.isArray(data.errors)) {
          // Multiple validation errors
          data.errors.forEach(error => {
            newErrors[error.field] = error.message;
          });
        } else if (data.field) {
          // Single field error
          newErrors[data.field] = data.message;
        } else {
          // General error
          newErrors.submit = data.message || 'Registration failed. Please try again.';
        }
        
        setErrors(newErrors);
        
        // Navigate to the step with the error
        if (Object.keys(newErrors).length > 0 && newErrors.submit === undefined) {
          const errorField = Object.keys(newErrors)[0];
          // Step 1 fields
          if (['companyName', 'industry', 'companySize', 'headquarters', 'country', 'website', 'registrationNumber'].includes(errorField)) {
            setCurrentStep(1);
          }
          // Step 2 fields
          else if (['adminFullName', 'adminEmail', 'adminPassword', 'confirmPassword'].includes(errorField)) {
            setCurrentStep(2);
          }
          // Step 3 fields
          else if (['adminPhone', 'companyDescription', 'linkedinUrl', 'careersPageUrl', 'hiringRegions', 'remotePolicy'].includes(errorField)) {
            setCurrentStep(3);
          }
        }
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium font-['Open_Sans'] ${
              step <= currentStep
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {step}
          </div>
          {step < totalSteps && (
            <div
              className={`w-16 h-0.5 mx-4 ${
                step < currentStep ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">
          Organization Details
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto']">
          Tell us about your company
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="md:col-span-2">
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Enter your company's official name"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.companyName}</p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            id="industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          >
            <option value="">Select industry</option>
            {industryOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.industry}</p>
          )}
        </div>

        {/* Company Size */}
        <div>
          <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Company Size <span className="text-red-500">*</span>
          </label>
          <select
            id="companySize"
            name="companySize"
            value={formData.companySize}
            onChange={handleInputChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          >
            <option value="">Select company size</option>
            {companySizeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.companySize && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.companySize}</p>
          )}
        </div>

        {/* Headquarters */}
        <div>
          <label htmlFor="headquarters" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Headquarters <span className="text-red-500">*</span>
          </label>
          <select
            id="headquarters"
            name="headquarters"
            value={formData.headquarters}
            onChange={handleInputChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          >
            <option value="">Select city</option>
            {indianCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.headquarters && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.headquarters}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Website URL
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://www.yourcompany.com"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          />
        </div>

        {/* Company Logo */}
        <div className="md:col-span-2">
          <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Company Logo
          </label>
          <div className="flex items-center space-x-4">
            <input
              id="companyLogo"
              name="companyLogo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black dark:file:bg-gray-100 file:text-white dark:file:text-black hover:file:bg-gray-800 dark:hover:file:bg-gray-200 font-['Roboto']"
            />
            {formData.companyLogo && (
              <span className="text-green-600 text-sm font-['Roboto']">
                {formData.companyLogo.name}
              </span>
            )}
          </div>
          {errors.companyLogo && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.companyLogo}</p>
          )}
        </div>

        {/* Registration Number */}
        <div className="md:col-span-2">
          <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Registration Number / GST (Optional)
          </label>
          <input
            id="registrationNumber"
            name="registrationNumber"
            type="text"
            value={formData.registrationNumber}
            onChange={handleInputChange}
            placeholder="Company registration number or GST number"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">
          Admin Account Setup
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto']">
          Create the primary admin account for your organization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label htmlFor="adminFullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="adminFullName"
            name="adminFullName"
            type="text"
            required
            value={formData.adminFullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          />
          {errors.adminFullName && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.adminFullName}</p>
          )}
        </div>

        {/* Work Email */}
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Work Email <span className="text-red-500">*</span>
          </label>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            required
            value={formData.adminEmail}
            onChange={handleInputChange}
            placeholder="admin@yourcompany.com"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          />
          {errors.adminEmail && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.adminEmail}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Phone Number
          </label>
          <input
            id="adminPhone"
            name="adminPhone"
            type="tel"
            value={formData.adminPhone}
            onChange={handleInputChange}
            placeholder="+91 12345 67890"
            className={`block w-full px-4 py-3 border rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 font-['Roboto'] transition-colors ${
              errors.adminPhone 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-white'
            }`}
          />
          {errors.adminPhone && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.adminPhone}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="adminPassword"
              name="adminPassword"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.adminPassword}
              onChange={handleInputChange}
              placeholder="Create a strong password"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
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
          {errors.adminPassword && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.adminPassword}</p>
          )}
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
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Role Information */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-start space-x-3">
          <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 font-['Open_Sans']">Admin Role</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] mt-1">
              As the first user, you'll be assigned the Admin role with full access to manage HR users, interviewers, and organization settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">
          Additional Information
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto']">
          Help us understand your hiring needs (optional)
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Description */}
        <div>
          <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
            Company Description
          </label>
          <textarea
            id="companyDescription"
            name="companyDescription"
            rows={4}
            value={formData.companyDescription}
            onChange={handleInputChange}
            placeholder="Brief description of your company, mission, and values..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LinkedIn URL */}
          <div>
            <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
              LinkedIn Company Page
            </label>
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              value={formData.linkedinUrl}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/company/yourcompany"
              className={`block w-full px-4 py-3 border rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 font-['Roboto'] transition-colors ${
                errors.linkedinUrl 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-white'
              }`}
            />
            {errors.linkedinUrl && (
              <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.linkedinUrl}</p>
            )}
          </div>

          {/* Careers Page */}
          <div>
            <label htmlFor="careersPageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
              Careers Page URL
            </label>
            <input
              id="careersPageUrl"
              name="careersPageUrl"
              type="url"
              value={formData.careersPageUrl}
              onChange={handleInputChange}
              placeholder="https://www.yourcompany.com/careers"
              className={`block w-full px-4 py-3 border rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 font-['Roboto'] transition-colors ${
                errors.careersPageUrl 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-white'
              }`}
            />
            {errors.careersPageUrl && (
              <p className="mt-1 text-sm text-red-600 font-['Roboto']">{errors.careersPageUrl}</p>
            )}
          </div>

          {/* Hiring Regions */}
          <div>
            <label htmlFor="hiringRegions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
              Primary Hiring Regions
            </label>
            <input
              id="hiringRegions"
              name="hiringRegions"
              type="text"
              value={formData.hiringRegions}
              onChange={handleInputChange}
              placeholder="e.g., India, Asia-Pacific, Global"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
            />
          </div>

          {/* Remote Policy */}
          <div>
            <label htmlFor="remotePolicy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans'] mb-2">
              Remote Work Policy
            </label>
            <select
              id="remotePolicy"
              name="remotePolicy"
              value={formData.remotePolicy}
              onChange={handleInputChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
            >
              <option value="">Select remote policy</option>
              {remotePolicyOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Review Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Open_Sans'] mb-4">Registration Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans']">Company:</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-['Roboto']">{formData.companyName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans']">Industry:</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-['Roboto']">{formData.industry}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans']">Size:</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-['Roboto']">{formData.companySize}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans']">Location:</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-['Roboto']">{formData.headquarters}, {formData.country}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans']">Admin:</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-['Roboto']">{formData.adminFullName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 font-['Open_Sans']">Admin Email:</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-['Roboto']">{formData.adminEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300 font-['Open_Sans'] mb-2">
            Join HireWise
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 font-['Roboto']">
            Register your company and start your hiring journey
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm transition-colors duration-300">
          {/* Render current step */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Error Message */}
          {errors.submit && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 font-['Roboto']">{errors.submit}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium font-['Open_Sans'] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium font-['Open_Sans'] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium font-['Open_Sans'] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Creating Account...' : 'Create Company Account'}</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">
            Already have an account?{' '}
            <Link to="/login" className="text-black dark:text-indigo-400 hover:underline font-semibold transition-colors font-['Open_Sans']">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySignupPage;