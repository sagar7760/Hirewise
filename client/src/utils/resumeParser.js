import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set the workerSrc to the local path relative to your public folder.
// The worker file will be copied to the public directory during build
pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

export class ResumeParser {
  static async parseFile(file) {
    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        extractedText = await this.parsePDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.type === 'application/msword') {
        extractedText = await this.parseDocx(file);
      } else {
        throw new Error('Unsupported file format. Please upload PDF or DOCX files.');
      }

      return this.extractFormData(extractedText);
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw error;
    }
  }

  static async parsePDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
      });

      const pdf = await loadingTask.promise;
      let structuredData = {
        fullText: '',
        sections: {},
        tables: [],
        metadata: {}
      };

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Get structured text with coordinate analysis
        const pageStructuredText = this.getStructuredText(textContent.items, viewport);
        structuredData.fullText += pageStructuredText + '\n\n';

        // Extract sections using coordinate analysis
        const pageSections = this.extractSectionsWithCoordinates(textContent.items, viewport);
        Object.assign(structuredData.sections, pageSections);

        // Extract tables if any
        const pageTables = this.extractTables(textContent.items, viewport);
        structuredData.tables.push(...pageTables);
      }

      return structuredData.fullText.trim();
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Unable to parse PDF file. It may be corrupted, password-protected, or a scanned image.');
    }
  }

  // Advanced text structuring using coordinates and font properties
  static getStructuredText(items, viewport) {
    let structuredText = '';
    let lastY = viewport.height + 10;
    let lastX = 0;

    // Sort items primarily by y-coordinate (top to bottom), then by x-coordinate (left to right)
    const sortedItems = items.slice().sort((a, b) => {
      const yComparison = b.transform[5] - a.transform[5];
      if (Math.abs(yComparison) > 1) return yComparison;
      return a.transform[4] - b.transform[4];
    });

    for (const item of sortedItems) {
      const currentY = item.transform[5];
      const currentX = item.transform[4];
      const itemHeight = item.height || 12; // Default height if not available
      const itemWidth = item.width || 0;
      let separator = '';

      // Check for a new line (significant change in Y)
      if (Math.abs(currentY - lastY) > itemHeight * 1.5) {
        separator = '\n';
        // Check for a new paragraph (even larger change)
        if (Math.abs(currentY - lastY) > itemHeight * 3) {
          separator = '\n\n';
        }
      } else if (currentX > lastX + itemWidth + 5) { 
        // Check for a new column (large change in X)
        separator = '  '; // Use double space for columns
      } else {
        separator = ' '; // Standard space for words on the same line
      }

      structuredText += separator + item.str;
      lastY = currentY;
      lastX = currentX + itemWidth;
    }

    return structuredText.trim();
  }

  // Extract sections using coordinate analysis and font properties
  static extractSectionsWithCoordinates(items, viewport) {
    const sections = {};
    const sectionKeywords = [
      'education', 'experience', 'work', 'employment', 'skills', 'projects', 
      'certifications', 'achievements', 'summary', 'objective', 'personal',
      'contact', 'academic', 'professional', 'career'
    ];

    // Sort items by Y coordinate (top to bottom)
    const sortedItems = items.slice().sort((a, b) => b.transform[5] - a.transform[5]);

    let currentSection = null;
    let sectionStartY = null;

    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      const itemText = item.str.trim().toLowerCase();
      const currentY = item.transform[5];

      // Check if this item is a section header
      const isHeader = this.isSectionHeader(item, itemText, sectionKeywords);
      
      if (isHeader) {
        // Save previous section if exists
        if (currentSection && sectionStartY !== null) {
          sections[currentSection] = this.extractSectionContent(
            sortedItems, sectionStartY, currentY, viewport
          );
        }
        
        // Start new section
        currentSection = itemText;
        sectionStartY = currentY;
      }
    }

    // Handle the last section
    if (currentSection && sectionStartY !== null) {
      sections[currentSection] = this.extractSectionContent(
        sortedItems, sectionStartY, 0, viewport
      );
    }

    return sections;
  }

  // Determine if a text item is a section header
  static isSectionHeader(item, itemText, sectionKeywords) {
    const matchesKeyword = sectionKeywords.some(keyword => 
      itemText.includes(keyword) && itemText.length < 30
    );
    
    // Check for header characteristics
    const isBold = item.fontName && item.fontName.toLowerCase().includes('bold');
    const isLargeFont = item.height && item.height > 12;
    const isShortLine = itemText.length < 50;
    const isStandalone = itemText.split(' ').length <= 3;

    return matchesKeyword && (isBold || isLargeFont) && isShortLine && isStandalone;
  }

  // Extract content for a specific section based on Y coordinates
  static extractSectionContent(sortedItems, startY, endY, viewport) {
    const sectionItems = sortedItems.filter(item => {
      const itemY = item.transform[5];
      return itemY <= startY && itemY > endY;
    });

    return this.getStructuredText(sectionItems, viewport);
  }

  // Extract tables using column and row alignment
  static extractTables(items, viewport) {
    const tables = [];
    const gridTolerance = 5; // Pixel tolerance for alignment

    // Group items by Y coordinate (rows)
    const rowGroups = {};
    items.forEach(item => {
      const y = Math.round(item.transform[5] / gridTolerance) * gridTolerance;
      if (!rowGroups[y]) rowGroups[y] = [];
      rowGroups[y].push(item);
    });

    // Sort rows by Y coordinate
    const sortedRows = Object.keys(rowGroups)
      .map(Number)
      .sort((a, b) => b - a)
      .map(y => rowGroups[y]);

    // Detect table patterns (3+ consecutive rows with similar column structure)
    for (let i = 0; i < sortedRows.length - 2; i++) {
      const tableCandidate = [];
      let consecutiveRows = 0;
      
      for (let j = i; j < sortedRows.length; j++) {
        const row = sortedRows[j];
        if (row.length >= 2) { // At least 2 columns
          tableCandidate.push(row);
          consecutiveRows++;
        } else {
          break;
        }
      }

      if (consecutiveRows >= 3) {
        tables.push(this.processTableCandidate(tableCandidate));
        i += consecutiveRows - 1; // Skip processed rows
      }
    }

    return tables;
  }

  // Process a table candidate into structured data
  static processTableCandidate(tableRows) {
    const table = [];
    
    tableRows.forEach(rowItems => {
      // Sort items in row by X coordinate
      const sortedRowItems = rowItems.sort((a, b) => a.transform[4] - b.transform[4]);
      const rowData = sortedRowItems.map(item => item.str.trim());
      table.push(rowData);
    });

    return table;
  }

  static async parseDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  static extractFormData(text) {
    console.log('Extracted text sample:', text.substring(0, 500));
    
    const extractedData = {
      // Extract name (usually at the beginning)
      fullName: this.extractNameAdvanced(text),
      
      // Extract email
      email: this.extractEmail(text.toLowerCase()),
      
      // Extract phone
      phone: this.extractPhoneAdvanced(text),
      
      // Extract location
      currentLocation: this.extractLocationAdvanced(text),
      
      // Extract skills
      primarySkills: this.extractSkillsAdvanced(text),
      
      // Extract education
      educationEntries: this.extractEducationAdvanced(text),
      
      // Extract work experience
      workExperienceEntries: this.extractWorkExperienceAdvanced(text),
    };
    
    console.log('Extracted form data:', extractedData);
    return extractedData;
  }

  // Advanced name extraction using position and format analysis
  static extractNameAdvanced(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Look for name in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      
      // Skip lines with common non-name patterns
      if (this.isNonNameLine(line)) continue;
      
      // Check if it looks like a name
      if (this.looksLikeName(line)) {
        return this.cleanName(line);
      }
    }
    
    return '';
  }

  static isNonNameLine(line) {
    const nonNamePatterns = [
      /@/, // Email
      /\d{10,}/, // Long numbers (phone)
      /resume|cv|curriculum/i,
      /linkedin|github|portfolio/i,
      /address|phone|email/i,
      /^(mr|ms|mrs|dr)\.?\s/i, // Titles at start
      /\.(com|org|net|edu)/i // Domains
    ];
    
    return nonNamePatterns.some(pattern => pattern.test(line));
  }

  static looksLikeName(line) {
    const words = line.split(/\s+/).filter(w => w.length > 0);
    
    // Name characteristics
    const hasProperLength = line.length >= 4 && line.length <= 60;
    const hasProperWordCount = words.length >= 2 && words.length <= 4;
    const isAlphabetic = words.every(word => /^[A-Za-z]+\.?$/.test(word));
    const hasCapitalization = words.every(word => /^[A-Z]/.test(word));
    
    return hasProperLength && hasProperWordCount && isAlphabetic && hasCapitalization;
  }

  static cleanName(name) {
    return name.replace(/[^\w\s\.]/g, '').trim();
  }

  // Advanced phone extraction with multiple patterns
  static extractPhoneAdvanced(text) {
    const phonePatterns = [
      // Indian patterns
      /(?:\+91[\s\-]?)?[6-9]\d{9}/g,
      // International patterns with better context
      /(?:phone|mobile|tel|contact)[\s:]*(\+?\d{1,3}[\s\-\(\)]?\d{3,4}[\s\-\(\)]?\d{3,4}[\s\-]?\d{3,4})/gi,
      // General patterns
      /(\+?\d{1,3}[\s\-\(\)]?\d{3,4}[\s\-\(\)]?\d{3,4}[\s\-]?\d{3,4})/g
    ];
    
    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match.replace(/[^\d\+]/g, '');
          if (cleaned.length >= 10 && cleaned.length <= 15) {
            return match.trim();
          }
        }
      }
    }
    
    return '';
  }

  // Advanced location extraction with context analysis
  static extractLocationAdvanced(text) {
    const locationPatterns = [
      // Context-based patterns
      /(?:address|location|based in|lives in|residing in)[\s:]+([^\n.]+)/gi,
      // City, State/Country patterns
      /([A-Za-z\s]+),\s*([A-Za-z\s]{2,})/g,
      // Standalone location indicators
      /\b(Mumbai|Delhi|Bangalore|Chennai|Hyderabad|Pune|Kolkata|Ahmedabad|Jaipur|Lucknow|New York|London|Toronto|Sydney)\b/gi
    ];
    
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match.replace(/^(address|location|based in|lives in|residing in)[\s:]+/gi, '').trim();
          if (cleaned.length > 2 && cleaned.length < 100) {
            return cleaned;
          }
        }
      }
    }
    
    return '';
  }

  // Advanced skills extraction using context and proximity
  static extractSkillsAdvanced(text) {
    const skillSectionKeywords = ['skills', 'technologies', 'technical skills', 'competencies'];
    const lines = text.split('\n');
    
    // Find skills section
    let skillsSection = '';
    let inSkillsSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (skillSectionKeywords.some(keyword => line.includes(keyword))) {
        inSkillsSection = true;
        continue;
      }
      
      if (inSkillsSection) {
        if (line.match(/^(experience|education|projects|certification)/)) {
          break;
        }
        skillsSection += lines[i] + ' ';
      }
    }
    
    // Fallback to full text if no skills section found
    if (!skillsSection.trim()) {
      skillsSection = text;
    }
    
    const skillKeywords = [
      // Programming Languages
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      // Web Technologies
      'react', 'angular', 'vue', 'node.js', 'express', 'html5', 'css3', 'sass', 'bootstrap', 'tailwind',
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'dynamodb',
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'linux', 'ci/cd',
      // Mobile
      'react native', 'flutter', 'android', 'ios',
      // Data & Analytics
      'sql', 'excel', 'power bi', 'tableau', 'pandas', 'numpy', 'machine learning', 'data science',
      // Design & Others
      'figma', 'photoshop', 'ui/ux', 'agile', 'scrum'
    ];

    const foundSkills = [];
    const lowerSkillsSection = skillsSection.toLowerCase();
    
    skillKeywords.forEach(skill => {
      if (lowerSkillsSection.includes(skill.toLowerCase())) {
        const formattedSkill = skill.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        if (!foundSkills.includes(formattedSkill)) {
          foundSkills.push(formattedSkill);
        }
      }
    });

    return foundSkills;
  }

  static extractName(text) {
    // Look for name at the beginning of the document
    const lines = text.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and lines with email/phone/common resume words
      if (!line || line.match(/@|phone|email|resume|cv|linkedin|github|portfolio/i)) {
        continue;
      }
      
      // Check if it looks like a name (2-4 words, proper case, no numbers)
      const words = line.split(' ').filter(w => w.length > 0);
      if (words.length >= 2 && words.length <= 4 && 
          !line.match(/\d/) && 
          line.length < 60 &&
          words.every(word => /^[A-Za-z]+$/.test(word))) {
        return line;
      }
    }
    
    return '';
  }

  static extractEmail(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  static extractPhone(text) {
    // Multiple phone patterns to catch different formats
    const phonePatterns = [
      /(\+91[\s-]?)?[6-9]\d{9}/g, // Indian mobile numbers
      /(\+1[\s-]?)?[\(]?[0-9]{3}[\)]?[\s-]?[0-9]{3}[\s-]?[0-9]{4}/g, // US format
      /(\+\d{1,3}[\s-]?)?[\(]?\d{3,4}[\)]?[\s-]?\d{3,4}[\s-]?\d{3,4}/g // International
    ];
    
    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Return the first valid looking phone number
        for (const match of matches) {
          const cleaned = match.replace(/[\s\-\(\)]/g, '');
          if (cleaned.length >= 10) {
            return match.trim();
          }
        }
      }
    }
    
    return '';
  }

  static extractLocation(text) {
    // Look for location patterns
    const locationPatterns = [
      // City, State format
      /([A-Za-z\s]+),\s*([A-Za-z\s]{2,})/g,
      // Address patterns
      /address[\s:]+([^.\n]+)/gi,
      // Location patterns
      /location[\s:]+([^.\n]+)/gi,
      // Common city names (add more as needed)
      /(Mumbai|Delhi|Bangalore|Chennai|Hyderabad|Pune|Kolkata|Ahmedabad|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Bhopal|Visakhapatnam|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Vasai|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Navi Mumbai|Allahabad|Ranchi|Howrah|Coimbatore|Jabalpur|Gwalior|Vijayawada|Jodhpur|Madurai|Raipur|Kota|Guwahati)/gi
    ];
    
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match.replace(/^(address|location)[\s:]+/gi, '').trim();
          if (cleaned.length > 2 && cleaned.length < 50) {
            return cleaned;
          }
        }
      }
    }
    
    return '';
  }

  static extractSkills(text) {
    const skillKeywords = [
      // Programming Languages
      'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'typescript',
      // Web Technologies
      'react', 'angular', 'vue', 'node.js', 'express', 'html', 'css', 'sass', 'bootstrap', 'tailwind',
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle',
      // Cloud & DevOps
      'aws', 'azure', 'docker', 'kubernetes', 'jenkins', 'git', 'linux',
      // Mobile
      'react native', 'flutter', 'android', 'ios', 'swift', 'kotlin',
      // Data
      'sql', 'excel', 'power bi', 'tableau', 'pandas', 'numpy', 'machine learning',
      // Design
      'figma', 'photoshop', 'ui/ux'
    ];

    const foundSkills = [];
    skillKeywords.forEach(skill => {
      if (text.includes(skill)) {
        foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    return foundSkills;
  }

  // Advanced education extraction using section analysis
  static extractEducationAdvanced(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const educationEntries = [];
    
    // Find education section boundaries
    const { startIndex, endIndex } = this.findSectionBoundaries(lines, 'education');
    
    if (startIndex === -1) {
      // Fallback: look for degree keywords anywhere
      return this.extractEducationFallback(text);
    }
    
    // Process education section
    const educationLines = lines.slice(startIndex + 1, endIndex);
    let currentEducation = null;
    
    for (let i = 0; i < educationLines.length; i++) {
      const line = educationLines[i].trim();
      const lowerLine = line.toLowerCase();
      
      // Detect degree/qualification lines
      const degreeMatch = this.findDegreeInLine(line);
      if (degreeMatch) {
        // Save previous education if exists
        if (currentEducation && currentEducation.qualification) {
          educationEntries.push(currentEducation);
        }
        
        // Start new education entry
        currentEducation = {
          id: educationEntries.length + 1,
          qualification: degreeMatch.degree,
          fieldOfStudy: degreeMatch.field || '',
          universityName: '',
          graduationYear: '',
          cgpaPercentage: ''
        };
        
        // Look for year in the same line
        const yearMatch = line.match(/(19|20)\d{2}/);
        if (yearMatch) {
          currentEducation.graduationYear = yearMatch[0];
        }
      }
      
      // Look for university/institution names
      if (currentEducation && !currentEducation.universityName) {
        const institutionMatch = line.match(/(university|college|institute|school|academy)/i);
        if (institutionMatch) {
          currentEducation.universityName = line;
        }
      }
      
      // Look for CGPA/percentage
      if (currentEducation) {
        const gradeMatch = line.match(/(?:cgpa|gpa|percentage|marks?)[\s:]*(\d+\.?\d*)/i);
        if (gradeMatch) {
          currentEducation.cgpaPercentage = gradeMatch[1];
        }
      }
      
      // Look for years in nearby lines if not found
      if (currentEducation && !currentEducation.graduationYear) {
        const yearMatch = line.match(/(19|20)\d{2}/);
        if (yearMatch) {
          currentEducation.graduationYear = yearMatch[0];
        }
      }
    }
    
    // Add last education entry
    if (currentEducation && currentEducation.qualification) {
      educationEntries.push(currentEducation);
    }
    
    return educationEntries.length > 0 ? educationEntries : this.getDefaultEducationEntry();
  }

  // Advanced work experience extraction
  static extractWorkExperienceAdvanced(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const workEntries = [];
    
    // Find experience section boundaries
    const { startIndex, endIndex } = this.findSectionBoundaries(lines, 'experience');
    
    if (startIndex === -1) {
      return this.getDefaultWorkEntry();
    }
    
    // Process experience section
    const experienceLines = lines.slice(startIndex + 1, endIndex);
    let currentWork = null;
    
    for (let i = 0; i < experienceLines.length; i++) {
      const line = experienceLines[i].trim();
      
      if (line.length < 5) continue; // Skip short lines
      
      // Detect job title and company patterns
      const jobMatch = this.findJobInLine(line);
      if (jobMatch) {
        // Save previous work entry if exists
        if (currentWork && (currentWork.position || currentWork.company)) {
          workEntries.push(currentWork);
        }
        
        // Start new work entry
        currentWork = {
          id: workEntries.length + 1,
          company: jobMatch.company || '',
          position: jobMatch.position || '',
          startDate: '',
          endDate: '',
          isCurrentlyWorking: false,
          description: '',
          yearsOfExperience: ''
        };
        
        // Look for dates in the same line
        const dateMatch = this.extractDatesFromLine(line);
        if (dateMatch) {
          currentWork.startDate = dateMatch.start;
          currentWork.endDate = dateMatch.end;
          currentWork.isCurrentlyWorking = dateMatch.isCurrent;
        }
      }
      
      // Look for dates in subsequent lines if not found
      if (currentWork && !currentWork.startDate) {
        const dateMatch = this.extractDatesFromLine(line);
        if (dateMatch) {
          currentWork.startDate = dateMatch.start;
          currentWork.endDate = dateMatch.end;
          currentWork.isCurrentlyWorking = dateMatch.isCurrent;
        }
      }
      
      // Look for job descriptions (bullet points or longer text)
      if (currentWork && line.length > 20 && !this.findJobInLine(line)) {
        if (currentWork.description) {
          currentWork.description += ' ' + line;
        } else {
          currentWork.description = line;
        }
      }
    }
    
    // Add last work entry
    if (currentWork && (currentWork.position || currentWork.company)) {
      workEntries.push(currentWork);
    }
    
    return workEntries.length > 0 ? workEntries : this.getDefaultWorkEntry();
  }

  // Helper methods for advanced extraction
  static findSectionBoundaries(lines, sectionKeyword) {
    let startIndex = -1;
    let endIndex = lines.length;
    
    const sectionKeywords = {
      'education': ['education', 'academic', 'qualification'],
      'experience': ['experience', 'work', 'employment', 'career', 'professional']
    };
    
    const keywords = sectionKeywords[sectionKeyword] || [sectionKeyword];
    const otherSections = ['education', 'experience', 'skills', 'projects', 'certifications'];
    
    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (keywords.some(keyword => line.includes(keyword) && line.length < 30)) {
        startIndex = i;
        break;
      }
    }
    
    // Find section end
    if (startIndex !== -1) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();
        if (otherSections.some(section => 
          section !== sectionKeyword && line.includes(section) && line.length < 30
        )) {
          endIndex = i;
          break;
        }
      }
    }
    
    return { startIndex, endIndex };
  }

  static findDegreeInLine(line) {
    const degreePatterns = [
      { pattern: /bachelor['\s]*of[^,\n]*/gi, type: "Bachelor's" },
      { pattern: /master['\s]*of[^,\n]*/gi, type: "Master's" },
      { pattern: /b\.?\s*tech|b\.?\s*e\b/gi, type: "Bachelor of Technology" },
      { pattern: /m\.?\s*tech|m\.?\s*e\b/gi, type: "Master of Technology" },
      { pattern: /b\.?\s*sc\b/gi, type: "Bachelor of Science" },
      { pattern: /m\.?\s*sc\b/gi, type: "Master of Science" },
      { pattern: /mba\b/gi, type: "Master of Business Administration" },
      { pattern: /phd|ph\.d|doctorate/gi, type: "Doctor of Philosophy" },
      { pattern: /diploma/gi, type: "Diploma" }
    ];
    
    for (const { pattern, type } of degreePatterns) {
      const match = line.match(pattern);
      if (match) {
        const field = line.replace(pattern, '').replace(/[^\w\s]/g, '').trim();
        return {
          degree: type,
          field: field.length > 3 ? field : ''
        };
      }
    }
    
    return null;
  }

  static findJobInLine(line) {
    const jobPatterns = [
      { pattern: /(.+?)\s+at\s+(.+)/i, positionIndex: 1, companyIndex: 2 },
      { pattern: /(.+?)\s*[-|]\s*(.+)/i, positionIndex: 1, companyIndex: 2 },
      { pattern: /(.+?)\s*,\s*(.+)/i, positionIndex: 1, companyIndex: 2 }
    ];
    
    for (const { pattern, positionIndex, companyIndex } of jobPatterns) {
      const match = line.match(pattern);
      if (match && match[positionIndex] && match[companyIndex]) {
        return {
          position: match[positionIndex].trim(),
          company: match[companyIndex].trim()
        };
      }
    }
    
    // If no pattern matches, check if it looks like a standalone job title or company
    if (line.length > 5 && line.length < 50 && !line.match(/\d{4}/)) {
      return { position: line, company: '' };
    }
    
    return null;
  }

  static extractDatesFromLine(line) {
    const datePatterns = [
      /(19|20)\d{2}\s*[-to]*\s*(present|current|now)/gi,
      /(19|20)\d{2}\s*[-to]*\s*(19|20)\d{2}/gi,
      /(\w+\s+\d{4})\s*[-to]*\s*(\w+\s+\d{4})/gi
    ];
    
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        const start = match[1];
        const end = match[2];
        const isCurrent = /present|current|now/i.test(end);
        
        return {
          start: start,
          end: isCurrent ? '' : end,
          isCurrent: isCurrent
        };
      }
    }
    
    return null;
  }

  static extractEducationFallback(text) {
    // Fallback method for education extraction
    const degreeKeywords = ['bachelor', 'master', 'phd', 'diploma', 'b.tech', 'm.tech', 'mba'];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (degreeKeywords.some(keyword => lowerLine.includes(keyword))) {
        return [{
          id: 1,
          qualification: line.trim(),
          fieldOfStudy: '',
          universityName: '',
          graduationYear: '',
          cgpaPercentage: ''
        }];
      }
    }
    
    return this.getDefaultEducationEntry();
  }

  static getDefaultEducationEntry() {
    return [{
      id: 1,
      qualification: '',
      fieldOfStudy: '',
      universityName: '',
      graduationYear: '',
      cgpaPercentage: ''
    }];
  }

  static getDefaultWorkEntry() {
    return [{
      id: 1,
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrentlyWorking: false,
      description: '',
      yearsOfExperience: ''
    }];
  }
}