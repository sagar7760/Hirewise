const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentParserService {
  /**
   * Extract text from various document formats
   * @param {string} filePath - Path to the document file
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async parseDocument(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const fileStats = fs.statSync(filePath);
      
      let extractedData = {
        text: '',
        metadata: {
          fileSize: fileStats.size,
          fileName: path.basename(filePath),
          fileType: ext,
          extractedAt: new Date(),
          pages: null,
          wordCount: 0,
          characterCount: 0
        },
        success: true,
        error: null
      };

      switch (ext) {
        case '.pdf':
          extractedData = await this.parsePDF(filePath, extractedData);
          break;
        case '.doc':
        case '.docx':
          extractedData = await this.parseDocx(filePath, extractedData);
          break;
        default:
          throw new Error(`Unsupported file format: ${ext}`);
      }

      // Calculate text statistics
      extractedData.metadata.wordCount = this.countWords(extractedData.text);
      extractedData.metadata.characterCount = extractedData.text.length;

      return extractedData;

    } catch (error) {
      console.error('Document parsing error:', error);
      return {
        text: '',
        metadata: {
          fileName: path.basename(filePath),
          fileType: path.extname(filePath).toLowerCase(),
          extractedAt: new Date()
        },
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse PDF files using pdf-parse
   * @private
   */
  async parsePDF(filePath, extractedData) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      extractedData.text = pdfData.text;
      extractedData.metadata.pages = pdfData.numpages;
      extractedData.metadata.info = pdfData.info;

      return extractedData;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse DOCX/DOC files using mammoth
   * @private
   */
  async parseDocx(filePath, extractedData) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      extractedData.text = result.value;
      
      // Include any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        extractedData.metadata.warnings = result.messages.map(msg => msg.message);
      }

      return extractedData;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Extract structured information from resume text using pattern matching
   * @param {string} text - Raw text from resume
   * @returns {Object} Structured resume data
   */
  extractResumeInfo(text) {
    const resumeData = {
      personalInfo: this.extractPersonalInfo(text),
      contactInfo: this.extractContactInfo(text),
      skills: this.extractSkills(text),
      education: this.extractEducation(text),
      workExperience: this.extractWorkExperience(text),
      projects: this.extractProjects(text),
      certifications: this.extractCertifications(text)
    };

    return resumeData;
  }

  /**
   * Extract personal information using regex patterns
   * @private
   */
  extractPersonalInfo(text) {
    const personalInfo = {};
    
    // Extract name (usually at the beginning)
    const namePattern = /^([A-Z][a-z]+ [A-Z][a-z]+)/m;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      personalInfo.name = nameMatch[1];
    }

    return personalInfo;
  }

  /**
   * Extract contact information
   * @private
   */
  extractContactInfo(text) {
    const contactInfo = {};

    // Email extraction
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails && emails.length > 0) {
      contactInfo.email = emails[0];
    }

    // Phone number extraction
    const phonePattern = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phones = text.match(phonePattern);
    if (phones && phones.length > 0) {
      contactInfo.phone = phones[0];
    }

    // LinkedIn extraction
    const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([\w\-_À-ÿ%]+)/gi;
    const linkedin = text.match(linkedinPattern);
    if (linkedin && linkedin.length > 0) {
      contactInfo.linkedin = linkedin[0];
    }

    // GitHub extraction
    const githubPattern = /(?:github\.com\/)([\w\-_À-ÿ%]+)/gi;
    const github = text.match(githubPattern);
    if (github && github.length > 0) {
      contactInfo.github = github[0];
    }

    return contactInfo;
  }

  /**
   * Extract skills section
   * @private
   */
  extractSkills(text) {
    const skills = [];
    
    // Common programming languages and technologies
    const techSkills = [
      'JavaScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
      'HTML', 'CSS', 'TypeScript', 'GraphQL', 'REST', 'Git', 'Jenkins', 'Jira'
    ];

    techSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      if (regex.test(text)) {
        skills.push(skill);
      }
    });

    // Extract from Skills section if it exists
    const skillsSection = /(?:SKILLS|TECHNICAL SKILLS|TECHNOLOGIES)[\s\S]*?(?=\n[A-Z]|\n\n|$)/gi;
    const skillsMatch = text.match(skillsSection);
    
    if (skillsMatch && skillsMatch.length > 0) {
      const skillsText = skillsMatch[0];
      // Extract comma or bullet separated skills
      const extractedSkills = skillsText.match(/[A-Za-z][A-Za-z0-9+#.]*[A-Za-z0-9+#]/g) || [];
      skills.push(...extractedSkills.filter(skill => skill.length > 2));
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Extract education information
   * @private
   */
  extractEducation(text) {
    const education = [];
    
    // Look for education section
    const educationSection = /(?:EDUCATION|ACADEMIC|QUALIFICATION)[\s\S]*?(?=\n[A-Z]{2,}|\n\n|$)/gi;
    const educationMatch = text.match(educationSection);
    
    if (educationMatch && educationMatch.length > 0) {
      const eduText = educationMatch[0];
      
      // Extract degree patterns
      const degreePatterns = [
        /(?:Bachelor|Master|PhD|B\.?\s*[AS]|M\.?\s*[AS]|Ph\.?D)[\s\w]*(?:in|of)\s*([\w\s]+)/gi,
        /(?:Bachelor|Master|PhD)\s+(?:of\s+)?(?:Science|Arts|Engineering|Technology)/gi
      ];
      
      degreePatterns.forEach(pattern => {
        const matches = eduText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            education.push({
              degree: match.trim(),
              institution: '', // Would need more sophisticated parsing
              year: this.extractYear(eduText)
            });
          });
        }
      });
    }

    return education;
  }

  /**
   * Extract work experience
   * @private
   */
  extractWorkExperience(text) {
    const experience = [];
    
    // Look for experience section
    const expSection = /(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|PROFESSIONAL EXPERIENCE)[\s\S]*?(?=\n[A-Z]{2,}|\n\n|$)/gi;
    const expMatch = text.match(expSection);
    
    if (expMatch && expMatch.length > 0) {
      const expText = expMatch[0];
      
      // Extract company and position patterns
      const jobPattern = /([A-Z][A-Za-z\s&,.-]+(?:Inc|Corp|LLC|Ltd|Company)?)[\s\n]+([A-Z][A-Za-z\s]+)[\s\n]+(\d{4}(?:\s*-\s*(?:\d{4}|Present))?)/g;
      
      let match;
      while ((match = jobPattern.exec(expText)) !== null) {
        experience.push({
          company: match[1].trim(),
          position: match[2].trim(),
          duration: match[3].trim()
        });
      }
    }

    return experience;
  }

  /**
   * Extract projects information
   * @private
   */
  extractProjects(text) {
    const projects = [];
    
    // Look for projects section
    const projectsSection = /(?:PROJECTS|PERSONAL PROJECTS|PORTFOLIO)[\s\S]*?(?=\n[A-Z]{2,}|\n\n|$)/gi;
    const projectsMatch = text.match(projectsSection);
    
    if (projectsMatch && projectsMatch.length > 0) {
      const projectsText = projectsMatch[0];
      
      // Extract project names (usually bold or capitalized)
      const projectPattern = /([A-Z][A-Za-z\s]+(?:App|System|Tool|Platform|Website))/g;
      const matches = projectsText.match(projectPattern);
      
      if (matches) {
        matches.forEach(project => {
          projects.push({
            name: project.trim(),
            description: '', // Would need more sophisticated parsing
            technologies: []
          });
        });
      }
    }

    return projects;
  }

  /**
   * Extract certifications
   * @private
   */
  extractCertifications(text) {
    const certifications = [];
    
    // Look for certifications section
    const certsSection = /(?:CERTIFICATIONS|CERTIFICATES|CREDENTIALS)[\s\S]*?(?=\n[A-Z]{2,}|\n\n|$)/gi;
    const certsMatch = text.match(certsSection);
    
    if (certsMatch && certsMatch.length > 0) {
      const certsText = certsMatch[0];
      
      // Common certification patterns
      const certPatterns = [
        /AWS\s+[\w\s]+/gi,
        /Microsoft\s+[\w\s]+/gi,
        /Google\s+[\w\s]+/gi,
        /Cisco\s+[\w\s]+/gi,
        /Oracle\s+[\w\s]+/gi
      ];
      
      certPatterns.forEach(pattern => {
        const matches = certsText.match(pattern);
        if (matches) {
          certifications.push(...matches.map(cert => cert.trim()));
        }
      });
    }

    return certifications;
  }

  /**
   * Extract year from text
   * @private
   */
  extractYear(text) {
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const years = text.match(yearPattern);
    return years ? years[years.length - 1] : null; // Return most recent year
  }

  /**
   * Count words in text
   * @private
   */
  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Clean and normalize text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  /**
   * Validate extracted data quality
   * @param {Object} extractedData - Parsed document data
   * @returns {Object} Validation results
   */
  validateExtractedData(extractedData) {
    const validation = {
      isValid: true,
      warnings: [],
      confidence: 100
    };

    // Check if text is too short
    if (extractedData.text.length < 100) {
      validation.warnings.push('Document text is very short, may indicate parsing issues');
      validation.confidence -= 30;
    }

    // Check if text contains garbled characters
    const garbledPattern = /[^\w\s\-.,;:!?()[\]{}'"@#$%^&*+=<>\/\\|`~]/g;
    const garbledCount = (extractedData.text.match(garbledPattern) || []).length;
    
    if (garbledCount > extractedData.text.length * 0.1) {
      validation.warnings.push('Document may contain encoding issues or garbled text');
      validation.confidence -= 20;
    }

    // Check if essential sections are missing
    const hasContact = /email|phone|contact/gi.test(extractedData.text);
    const hasExperience = /experience|work|job|position/gi.test(extractedData.text);
    
    if (!hasContact) {
      validation.warnings.push('No contact information detected');
      validation.confidence -= 15;
    }
    
    if (!hasExperience) {
      validation.warnings.push('No work experience section detected');
      validation.confidence -= 15;
    }

    validation.isValid = validation.confidence > 50;
    
    return validation;
  }
}

module.exports = new DocumentParserService();