const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { auth, authorize } = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const documentParser = require('../services/documentParser');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// @route   POST /api/ai/analyze-application/:applicationId
// @desc    Analyze application with AI
// @access  Private (HR, Admin)
router.post('/analyze-application/:applicationId', auth, authorize('hr', 'admin'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('job')
      .populate('applicant');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if analysis already exists
    if (application.aiAnalysis && application.aiAnalysis.analysisDate) {
      return res.json({
        success: true,
        message: 'Analysis already exists',
        data: application.aiAnalysis
      });
    }

    // Parse resume using document parser
    const resumePath = path.join(__dirname, '..', application.resume.fileUrl);
    const parsedDocument = await documentParser.parseDocument(resumePath);

    if (!parsedDocument.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to parse resume: ${parsedDocument.error}`
      });
    }

    // Extract structured resume information
    const resumeInfo = documentParser.extractResumeInfo(parsedDocument.text);

    // Analyze with Gemini AI
    const analysis = await geminiService.analyzeResume(parsedDocument.text, application.job);

    // Update application with AI analysis and parsed data
    application.aiAnalysis = {
      ...analysis,
      analysisDate: new Date(),
      extractedInfo: resumeInfo,
      documentMetadata: parsedDocument.metadata,
      validation: documentParser.validateExtractedData(parsedDocument)
    };

    await application.save();

    res.json({
      success: true,
      message: 'Analysis completed successfully',
      data: application.aiAnalysis
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/ai/generate-questions/:applicationId
// @desc    Generate interview questions for application
// @access  Private (HR, Admin, Interviewer)
router.post('/generate-questions/:applicationId', auth, authorize('hr', 'admin', 'interviewer'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('job')
      .populate('applicant');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Parse resume using document parser
    const resumePath = path.join(__dirname, '..', application.resume.fileUrl);
    const parsedDocument = await documentParser.parseDocument(resumePath);

    if (!parsedDocument.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to parse resume: ${parsedDocument.error}`
      });
    }

    // Generate questions with Gemini
    const questions = await geminiService.generateInterviewQuestions(parsedDocument.text, application.job);

    res.json({
      success: true,
      message: 'Interview questions generated successfully',
      data: questions
    });

  } catch (error) {
    console.error('Questions generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/ai/extract-resume/:applicationId
// @desc    Extract structured data from resume
// @access  Private (HR, Admin)
router.post('/extract-resume/:applicationId', auth, authorize('hr', 'admin'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Parse resume using document parser
    const resumePath = path.join(__dirname, '..', application.resume.fileUrl);
    const parsedDocument = await documentParser.parseDocument(resumePath);

    if (!parsedDocument.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to parse resume: ${parsedDocument.error}`
      });
    }

    // Extract structured information
    const extractedInfo = documentParser.extractResumeInfo(parsedDocument.text);
    const validation = documentParser.validateExtractedData(parsedDocument);

    res.json({
      success: true,
      message: 'Resume information extracted successfully',
      data: {
        extractedInfo,
        metadata: parsedDocument.metadata,
        validation,
        rawText: parsedDocument.text.substring(0, 1000) + '...' // First 1000 chars for preview
      }
    });

  } catch (error) {
    console.error('Resume extraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/ai/batch-analyze
// @desc    Analyze multiple applications in batch
// @access  Private (HR, Admin)
router.post('/batch-analyze', auth, authorize('hr', 'admin'), [
  body('applicationIds').isArray().withMessage('Application IDs must be an array'),
  body('applicationIds.*').isMongoId().withMessage('Invalid application ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { applicationIds } = req.body;
    const results = [];
    const failed = [];

      for (const applicationId of applicationIds) {
      try {
        const application = await Application.findById(applicationId)
          .populate('job')
          .populate('applicant');

        if (!application) {
          failed.push({ applicationId, error: 'Application not found' });
          continue;
        }

        // Skip if already analyzed
        if (application.aiAnalysis && application.aiAnalysis.analysisDate) {
          results.push({
            applicationId,
            status: 'already_analyzed',
            data: application.aiAnalysis
          });
          continue;
        }

        // Parse resume and analyze
        const resumePath = path.join(__dirname, '..', application.resume.fileUrl);
        const parsedDocument = await documentParser.parseDocument(resumePath);

        if (!parsedDocument.success) {
          failed.push({ applicationId, error: `Document parsing failed: ${parsedDocument.error}` });
          continue;
        }

        const resumeInfo = documentParser.extractResumeInfo(parsedDocument.text);
        const analysis = await geminiService.analyzeResume(parsedDocument.text, application.job);

        // Update application
        application.aiAnalysis = {
          ...analysis,
          analysisDate: new Date(),
          extractedInfo: resumeInfo,
          documentMetadata: parsedDocument.metadata,
          validation: documentParser.validateExtractedData(parsedDocument)
        };
        await application.save();

        results.push({
          applicationId,
          status: 'analyzed',
          data: application.aiAnalysis
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error analyzing application ${applicationId}:`, error);
        failed.push({ applicationId, error: error.message });
      }
    }    res.json({
      success: true,
      message: 'Batch analysis completed',
      data: {
        successful: results,
        failed: failed,
        total: applicationIds.length,
        successCount: results.length,
        failedCount: failed.length
      }
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/ai/analysis-stats
// @desc    Get AI analysis statistics
// @access  Private (HR, Admin)
router.get('/analysis-stats', auth, authorize('hr', 'admin'), async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const analyzedApplications = await Application.countDocuments({
      'aiAnalysis.analysisDate': { $exists: true }
    });

    const averageScores = await Application.aggregate([
      { $match: { 'aiAnalysis.overallScore': { $exists: true } } },
      {
        $group: {
          _id: null,
          avgOverallScore: { $avg: '$aiAnalysis.overallScore' },
          avgSkillsMatch: { $avg: '$aiAnalysis.skillsMatch' },
          avgExperienceMatch: { $avg: '$aiAnalysis.experienceMatch' },
          avgResumeScore: { $avg: '$aiAnalysis.resumeScore' }
        }
      }
    ]);

    const scoreDistribution = await Application.aggregate([
      { $match: { 'aiAnalysis.overallScore': { $exists: true } } },
      {
        $bucket: {
          groupBy: '$aiAnalysis.overallScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalApplications,
        analyzedApplications,
        analysisRate: analyzedApplications / totalApplications * 100,
        averageScores: averageScores[0] || {},
        scoreDistribution
      }
    });

  } catch (error) {
    console.error('Analysis stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/ai/parse-document
// @desc    Parse document and extract text (standalone endpoint for testing)
// @access  Private (HR, Admin)
router.post('/parse-document', auth, authorize('hr', 'admin'), async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const fullPath = path.join(__dirname, '..', filePath);
    const parsedDocument = await documentParser.parseDocument(fullPath);

    if (!parsedDocument.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to parse document: ${parsedDocument.error}`
      });
    }

    const extractedInfo = documentParser.extractResumeInfo(parsedDocument.text);
    const validation = documentParser.validateExtractedData(parsedDocument);

    res.json({
      success: true,
      message: 'Document parsed successfully',
      data: {
        metadata: parsedDocument.metadata,
        extractedInfo,
        validation,
        textPreview: parsedDocument.text.substring(0, 500) + '...',
        fullTextAvailable: parsedDocument.text.length > 500
      }
    });

  } catch (error) {
    console.error('Parse document error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;