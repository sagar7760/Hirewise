const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found in environment variables');
      this.genAI = null;
      return;
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Analyze resume content against job requirements
   * @param {string} resumeText - Extracted text from resume
   * @param {Object} job - Job object with requirements and skills
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeResume(resumeText, job) {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      const prompt = this.createAnalysisPrompt(resumeText, job);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAnalysisResponse(text);
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  /**
   * Generate interview questions based on resume and job
   * @param {string} resumeText - Extracted text from resume
   * @param {Object} job - Job object
   * @returns {Promise<Array>} Array of interview questions
   */
  async generateInterviewQuestions(resumeText, job) {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      const prompt = `
Based on the following resume and job requirements, generate 8-10 relevant interview questions.
Include technical, behavioral, and situational questions.

Job Title: ${job.title}
Job Requirements: ${job.requirements.join(', ')}
Required Skills: ${job.skills.join(', ')}

Resume Content:
${resumeText}

Please provide questions in JSON format:
{
  "technical": [questions array],
  "behavioral": [questions array],
  "situational": [questions array]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseQuestionsResponse(text);
    } catch (error) {
      console.error('Gemini questions generation error:', error);
      return {
        technical: [],
        behavioral: [],
        situational: []
      };
    }
  }

  /**
   * Extract key information from resume text
   * @param {string} resumeText - Raw text from resume
   * @returns {Promise<Object>} Extracted information
   */
  async extractResumeInfo(resumeText) {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      const prompt = `
Extract key information from the following resume and return it in JSON format:

Resume Content:
${resumeText}

Please extract:
- Personal information (name, email, phone, location)
- Work experience (company, position, duration, key achievements)
- Education (institution, degree, graduation year)
- Skills (technical and soft skills)
- Projects (name, description, technologies used)
- Years of experience

Return in JSON format:
{
  "personalInfo": { "name": "", "email": "", "phone": "", "location": "" },
  "workExperience": [{ "company": "", "position": "", "duration": "", "achievements": [] }],
  "education": [{ "institution": "", "degree": "", "year": "" }],
  "skills": { "technical": [], "soft": [] },
  "projects": [{ "name": "", "description": "", "technologies": [] }],
  "totalExperience": ""
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseExtractionResponse(text);
    } catch (error) {
      console.error('Gemini extraction error:', error);
      return null;
    }
  }

  /**
   * Create analysis prompt for resume evaluation
   * @private
   */
  createAnalysisPrompt(resumeText, job) {
    return `
Analyze the following resume against the job requirements and provide a comprehensive evaluation.

Job Title: ${job.title}
Job Description: ${job.description}
Required Skills: ${job.skills.join(', ')}
Experience Level: ${job.experienceLevel}
Job Requirements: ${job.requirements.join(', ')}

Resume Content:
${resumeText}

Please provide analysis in JSON format with the following structure:
{
  "resumeScore": number (0-100, overall quality of resume),
  "skillsMatch": number (0-100, how well skills match job requirements),
  "experienceMatch": number (0-100, how well experience matches job level),
  "overallScore": number (0-100, combined score for job fit),
  "keyStrengths": [array of 3-5 key strengths],
  "potentialConcerns": [array of 2-4 potential concerns or gaps],
  "recommendedQuestions": [array of 3-5 interview questions based on resume],
  "skillsAnalysis": {
    "matchingSkills": [array of skills that match],
    "missingSkills": [array of important skills not found],
    "additionalSkills": [array of relevant bonus skills found]
  },
  "experienceAnalysis": {
    "relevantExperience": "description of relevant experience",
    "totalYears": number,
    "levelMatch": "entry/mid/senior/lead based on experience"
  }
}

Be thorough but constructive in your analysis.
`;
  }

  /**
   * Parse analysis response from Gemini
   * @private
   */
  parseAnalysisResponse(text) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if JSON is not properly formatted
      return this.createFallbackAnalysis();
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return this.createFallbackAnalysis();
    }
  }

  /**
   * Parse questions response from Gemini
   * @private
   */
  parseQuestionsResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        technical: [],
        behavioral: [],
        situational: []
      };
    } catch (error) {
      console.error('Error parsing questions response:', error);
      return {
        technical: [],
        behavioral: [],
        situational: []
      };
    }
  }

  /**
   * Parse extraction response from Gemini
   * @private
   */
  parseExtractionResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing extraction response:', error);
      return null;
    }
  }

  /**
   * Create fallback analysis if AI analysis fails
   * @private
   */
  createFallbackAnalysis() {
    return {
      resumeScore: 70,
      skillsMatch: 60,
      experienceMatch: 65,
      overallScore: 65,
      keyStrengths: ['Resume submitted successfully'],
      potentialConcerns: ['AI analysis unavailable'],
      recommendedQuestions: ['Tell me about your background'],
      skillsAnalysis: {
        matchingSkills: [],
        missingSkills: [],
        additionalSkills: []
      },
      experienceAnalysis: {
        relevantExperience: 'Analysis pending',
        totalYears: 0,
        levelMatch: 'unknown'
      }
    };
  }
}

module.exports = new GeminiService();