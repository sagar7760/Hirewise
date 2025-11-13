// Gemini service using the latest @google/genai SDK with dynamic import (works in CJS)

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found in environment variables');
      this.ai = null;
      this.modelId = null;
      return;
    }
    this.ai = null; // will be initialized lazily via dynamic import
    this.modelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  /**
   * Analyze aggregated interview feedback text for sentiment & summary
   * @param {Object} params
   * @param {string} params.feedbackText - Aggregated textual feedback from interviews
   * @param {string} params.candidateName - Candidate name for context
   * @param {string} params.jobTitle - Job title for framing
   * @returns {Promise<Object>} Structured analysis result
   */
  async analyzeInterviewFeedback({ feedbackText, candidateName, jobTitle, jobDescription, applicationId, jobId, skills, status }) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API not configured');
    }
    try {
      // Short-circuit: if there's no substantive feedback, avoid model call and return a minimal object
      const raw = (feedbackText || '').trim();
      const normalized = raw.replace(/\s+/g, ' ').toLowerCase();
      const isPlaceholder = normalized === '' || normalized === 'no interview feedback available.' || normalized === 'no interview feedback available' || normalized === 'n/a' || normalized === 'none';
      if (isPlaceholder) {
        return this.createNoFeedbackResult(applicationId);
      }

      const identityBlock = `Application ID: ${applicationId || 'n/a'}\nJob ID: ${jobId || 'n/a'}\nStatus: ${status || 'n/a'}`;
      const skillsBlock = Array.isArray(skills) && skills.length ? `Candidate / Parsed Skills: ${skills.slice(0,30).join(', ')}` : 'Candidate / Parsed Skills: (none captured)';
      const prompt = `You are an unbiased HR talent assistant. Analyze interview feedback and produce a structured, fair, non-discriminatory assessment.
If feedback is missing, state that clearly but DO NOT invent strengths or concerns.
Flag any potentially biased wording (age, gender, ethnicity, etc.) in 'flags'.

${identityBlock}
Candidate: ${candidateName || 'Unknown'}
Job Title: ${jobTitle || 'Unknown'}
Job Description (truncated): ${(jobDescription || '').slice(0, 1200)}
${skillsBlock}

Interview Feedback Aggregate (verbatim):\n${feedbackText}\nEND_FEEDBACK

Respond ONLY with JSON, no prose, matching EXACT schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": number (0-1),
  "summary": string,  
  "strengths": [string],
  "concerns": [string],
  "flags": [string],
  "suggestedDecisionNote": string,
  "reasoning": {"summaryOfEvidence": string, "upsideFactors": [string], "riskFactors": [string]}
}`;

      const ai = await this.getClient();
      const response = await ai.models.generateContent({ model: this.modelId, contents: prompt });
      let text = typeof response.text === 'function' ? response.text() : response.text;
      if (typeof text === 'string') {
        // Strip code fences if present
        text = text.replace(/```json/gi,'```').replace(/```/g,'').trim();
      }
      return this.parseInterviewFeedbackResponse(text);
    } catch (error) {
      console.error('Gemini interview feedback analysis error:', error);
      return this.createFallbackInterviewFeedback();
    }
  }

  /**
   * Parse interview feedback response
   * @private
   */
  parseInterviewFeedbackResponse(text) {
    try {
      const jsonMatch = text && text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.createFallbackInterviewFeedback();
    } catch (e) {
      console.error('Error parsing interview feedback response:', e);
      return this.createFallbackInterviewFeedback();
    }
  }

  /**
   * Fallback interview feedback analysis
   * @private
   */
  createFallbackInterviewFeedback() {
    return {
      sentiment: 'neutral',
      confidence: 0,
      summary: 'AI analysis unavailable at the moment.',
      strengths: [],
      concerns: [],
      flags: ['AI_UNAVAILABLE'],
      suggestedDecisionNote: '',
      reasoning: {
        summaryOfEvidence: 'No AI analysis; manual review pending.',
        upsideFactors: [],
        riskFactors: []
      }
    };
  }

  /**
   * Minimal object when there is no interview feedback to analyze
   * @private
   */
  createNoFeedbackResult(applicationId) {
    return {
      sentiment: 'neutral',
      confidence: 0,
      summary: 'No interview feedback submitted yet.',
      strengths: [],
      concerns: [],
      flags: ['NO_FEEDBACK'],
      suggestedDecisionNote: '',
      reasoning: {
        summaryOfEvidence: 'There is no interviewer-provided feedback to analyze.',
        upsideFactors: [],
        riskFactors: []
      },
      _meta: { applicationId }
    };
  }

  async getClient() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API not configured');
    }
    if (!this.ai) {
      const { GoogleGenAI } = await import('@google/genai');
      this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.ai;
  }

  /**
   * Analyze resume content against job requirements
   * @param {string} resumeText - Extracted text from resume
   * @param {Object} job - Job object with requirements and skills
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeResume(resumeText, job) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API not configured');
    }

    try {
      const prompt = this.createAnalysisPrompt(resumeText, job);
      const ai = await this.getClient();
      const response = await ai.models.generateContent({
        model: this.modelId,
        contents: prompt
      });
      const text = typeof response.text === 'function' ? response.text() : response.text;

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
    if (!process.env.GEMINI_API_KEY) {
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

      const ai = await this.getClient();
      const response = await ai.models.generateContent({
        model: this.modelId,
        contents: prompt
      });
      const text = typeof response.text === 'function' ? response.text() : response.text;

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
    if (!process.env.GEMINI_API_KEY) {
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

      const ai = await this.getClient();
      const response = await ai.models.generateContent({
        model: this.modelId,
        contents: prompt
      });
      const text = typeof response.text === 'function' ? response.text() : response.text;

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