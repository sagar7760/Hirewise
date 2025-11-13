// Gemini service (interview feedback sentiment/summary only) using @google/genai with dynamic import (CJS compatible)

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

  // Analyze aggregated interview feedback text for sentiment & summary
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
}

module.exports = new GeminiService();