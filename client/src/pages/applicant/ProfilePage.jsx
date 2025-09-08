import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    summary: 'Experienced software engineer with 5+ years in full-stack development. Passionate about creating scalable web applications and working with modern technologies.',
    
    // Resume
    resume: {
      fileName: 'John_Doe_Resume.pdf',
      uploadDate: 'March 15, 2024',
      fileSize: '245 KB'
    },
    
    // Education
    education: [
      {
        id: 1,
        institution: 'University of Technology',
        degree: 'Bachelor of Science in Computer Science',
        graduationDate: 'May 2019',
        description: 'University of Technology, Bachelor of Science in Computer Science'
      }
    ],
    
    // Work Experience
    workExperience: [
      {
        id: 1,
        company: 'Tech Solutions Inc.',
        position: 'Senior Software Engineer',
        duration: 'June 2019 - Present',
        description: 'Software Engineer'
      }
    ],
    
    // Skills
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Agile Development'],
    
    // Projects
    projects: [
      {
        id: 1,
        name: 'Project Management Tool',
        technologies: 'GitHub, github.com/nodejs-center/project-manager',
        description: 'Developed a web application for managing project tasks and team collaboration.'
      }
    ]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayAdd = (section, newItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], { ...newItem, id: Date.now() }]
    }));
  };

  const handleArrayUpdate = (section, id, updatedItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, ...updatedItem } : item
      )
    }));
  };

  const handleArrayRemove = (section, id) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const handleSkillsChange = (e) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
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

      setFormData(prev => ({
        ...prev,
        resume: {
          fileName: file.name,
          uploadDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          fileSize: `${(file.size / 1024).toFixed(0)} KB`
        }
      }));
      
      console.log('Resume uploaded:', file);
      // TODO: Implement actual file upload to server
    }
  };

  const handleResumeDelete = () => {
    setFormData(prev => ({
      ...prev,
      resume: null
    }));
    console.log('Resume deleted');
  };

  const handleResumeDownload = () => {
    console.log('Downloading resume:', formData.resume.fileName);
    // TODO: Implement actual file download
  };

  const handleSave = () => {
    console.log('Saving profile data:', formData);
    setIsEditing(false);
    // TODO: Implement API call to save profile data
  };

  const handleCancel = () => {
    setIsEditing(false);
    // TODO: Reset form data to original values
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                Profile
              </h1>
              <p className="text-gray-600 font-['Roboto']">
                Review and update your profile information.
              </p>
            </div>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{formData.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{formData.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{formData.phone}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  />
                ) : (
                  <p className="text-gray-900 font-['Roboto'] py-2">{formData.location}</p>
                )}
              </div>
            </div>

            {/* Summary/Objective */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                Summary/Objective
              </label>
              {isEditing ? (
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] resize-none text-gray-900"
                />
              ) : (
                <p className="text-gray-900 font-['Roboto'] py-2 leading-relaxed">{formData.summary}</p>
              )}
            </div>
          </div>

          {/* Resume Section */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Resume
            </h2>
            
            {formData.resume ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 font-['Open_Sans']">
                        {formData.resume.fileName}
                      </h3>
                      <p className="text-sm text-gray-600 font-['Roboto']">
                        Uploaded: {formData.resume.uploadDate} • {formData.resume.fileSize}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResumeDownload}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Download Resume"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    
                    {isEditing && (
                      <button
                        onClick={handleResumeDelete}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Resume"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                      Upload New Resume
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800 file:transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500 font-['Roboto']">
                      Supported formats: PDF, DOC, DOCX (Max size: 5MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
                    No resume uploaded
                  </h3>
                  <p className="text-gray-600 font-['Roboto'] mb-4">
                    Upload your resume to let employers know more about your experience
                  </p>
                  
                  {isEditing && (
                    <div>
                      <label className="cursor-pointer bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors inline-block">
                        Upload Resume
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500 font-['Roboto']">
                        Supported formats: PDF, DOC, DOCX (Max size: 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Education */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Education
            </h2>
            
            {formData.education.map((edu) => (
              <div key={edu.id} className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 font-['Open_Sans']">{edu.institution}</h3>
                  <p className="text-sm text-gray-600 font-['Roboto'] mb-1">Graduated: {edu.graduationDate}</p>
                  <p className="text-sm text-gray-700 font-['Roboto']">{edu.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Work Experience */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Work Experience
            </h2>
            
            {formData.workExperience.map((work) => (
              <div key={work.id} className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 font-['Open_Sans']">{work.company}</h3>
                  <p className="text-sm text-gray-600 font-['Roboto'] mb-1">{work.duration}</p>
                  <p className="text-sm text-gray-700 font-['Roboto']">{work.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Skills
            </h2>
            
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 font-['Roboto'] mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills.join(', ')}
                  onChange={handleSkillsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] text-gray-900"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 font-['Roboto']"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans'] mb-6">
              Projects
            </h2>
            
            {formData.projects.map((project) => (
              <div key={project.id} className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 font-['Open_Sans']">{project.name}</h3>
                  <p className="text-sm text-gray-600 font-['Roboto'] mb-1">{project.technologies}</p>
                  <p className="text-sm text-gray-700 font-['Roboto']">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Action Buttons (Mobile) */}
        {isEditing && (
          <div className="mt-6 flex space-x-3 md:hidden">
            <button
              onClick={handleCancel}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
