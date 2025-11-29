const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const VerificationToken = require('../../models/VerificationToken');
const User = require('../../models/User');
const Company = require('../../models/Company');
const PendingRegistration = require('../../models/PendingRegistration');
const { sendOtpEmail } = require('../../services/emailService');

function otpConfig() {
  return {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSec: parseInt(process.env.OTP_RESEND_COOLDOWN_SEC || '60', 10),
    maxResends: parseInt(process.env.OTP_MAX_RESENDS || '5', 10),
  };
}

function generateCode() {
  const num = crypto.randomInt(0, 1000000); // 0 to 999999
  return num.toString().padStart(6, '0');
}

// POST /api/auth/otp/send
async function sendOtp(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, userId } = req.body;
    const cfg = otpConfig();

    // Check if this is a pending registration or existing user
    let user = null;
    let pendingReg = null;
    
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    
    // If no existing user, check for pending registration
    if (!user && email) {
      pendingReg = await PendingRegistration.findOne({ email: email.toLowerCase() });
      if (!pendingReg) {
        return res.status(404).json({ success: false, message: 'No registration found for this email. Please register first.' });
      }
    }

    const targetEmail = user ? user.email : pendingReg.email;

    // Rate limit: resend cooldown and max resends in the last day
    const lastToken = await VerificationToken.findOne({ email: targetEmail, type: 'email_otp' }).sort({ createdAt: -1 });
    const now = Date.now();
    if (lastToken && lastToken.lastSentAt && (now - lastToken.lastSentAt.getTime()) < cfg.resendCooldownSec * 1000) {
      const waitSec = Math.ceil((cfg.resendCooldownSec * 1000 - (now - lastToken.lastSentAt.getTime())) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${waitSec}s before requesting another code.` });
    }

    // Optional: limit total resends per 24h
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const resendCount24h = await VerificationToken.countDocuments({ email: targetEmail, type: 'email_otp', createdAt: { $gte: since } });
    if (resendCount24h >= cfg.maxResends) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again later.' });
    }

    const code = generateCode();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(now + cfg.expiryMinutes * 60 * 1000);

    const tokenDoc = await VerificationToken.create({
      userId: user ? user._id : null,
      email: targetEmail,
      type: 'email_otp',
      codeHash,
      expiresAt,
      attemptsRemaining: cfg.maxAttempts,
      resendCount: lastToken ? lastToken.resendCount + 1 : 0,
      lastSentAt: new Date(),
    });

    await sendOtpEmail(targetEmail, code);

    return res.json({
      success: true,
      message: 'OTP sent to your email',
      data: {
        userId: user ? user._id : null,
        email: targetEmail,
        expiresAt,
        resendCooldownSec: cfg.resendCooldownSec,
      },
    });
  } catch (error) {
    console.error('sendOtp error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/auth/otp/verify
async function verifyOtp(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, userId, code } = req.body;

    // Locate user or pending registration
    let user = null;
    let pendingReg = null;
    
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    
    // If no existing user, check for pending registration
    if (!user && email) {
      pendingReg = await PendingRegistration.findOne({ email: email.toLowerCase() });
      if (!pendingReg) {
        return res.status(404).json({ success: false, message: 'No registration found for this email' });
      }
    }

    const targetEmail = user ? user.email : pendingReg.email;

    // Find latest active token
    const token = await VerificationToken.findOne({ email: targetEmail, type: 'email_otp', usedAt: null }).sort({ createdAt: -1 });
    if (!token) {
      return res.status(400).json({ success: false, message: 'No active verification code. Please request a new code.' });
    }

    if (token.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    if (token.attemptsRemaining <= 0) {
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new code.' });
    }

    const match = await bcrypt.compare(code, token.codeHash);
    if (!match) {
      token.attemptsRemaining = Math.max(0, token.attemptsRemaining - 1);
      await token.save();
      return res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });
    }

    // Mark token used
    token.usedAt = new Date();
    await token.save();

    // If this is a pending registration, create the actual user now
    if (pendingReg) {
      if (pendingReg.type === 'applicant') {
        // Create applicant user from pending registration
        const userData = {
          firstName: pendingReg.userData.firstName,
          lastName: pendingReg.userData.lastName,
          email: pendingReg.email,
          password: pendingReg.userData.password, // Already hashed
          phone: pendingReg.userData.phone,
          role: pendingReg.userData.role,
          profile: pendingReg.userData.profile,
          accountStatus: 'active',
          emailVerifiedAt: new Date()
        };
        
        user = await User.create(userData);
        
        // Create Resume document if resume was uploaded during registration
        let resumeId = null;
        if (pendingReg.resumeData && pendingReg.resumeData.fileData) {
          try {
            console.log('========== RESUME CREATION START ==========');
            console.log('Resume data found in pending registration:', {
              originalName: pendingReg.resumeData.originalName,
              mimeType: pendingReg.resumeData.mimeType,
              fileSize: pendingReg.resumeData.fileSize,
              hasFileData: !!pendingReg.resumeData.fileData,
              fileDataType: typeof pendingReg.resumeData.fileData
            });
            
            // Validate resume data
            if (!pendingReg.resumeData.fileData || !Buffer.isBuffer(pendingReg.resumeData.fileData)) {
              console.error('Invalid file data - not a Buffer:', typeof pendingReg.resumeData.fileData);
              throw new Error('Invalid resume file data');
            }
            
            // Convert Buffer to Base64 string as required by Resume model
            const fileDataBase64 = pendingReg.resumeData.fileData.toString('base64');
            
            // Generate a unique filename
            const timestamp = Date.now();
            const ext = pendingReg.resumeData.originalName.split('.').pop() || 'pdf';
            const fileName = `resume_${user._id}_${timestamp}.${ext}`;
            
            const Resume = require('../../models/Resume');
            const resumeDoc = {
              userId: user._id,
              fileName: fileName,
              originalName: pendingReg.resumeData.originalName || 'resume.pdf',
              mimeType: pendingReg.resumeData.mimeType || 'application/pdf',
              fileData: fileDataBase64, // Store as Base64 string
              fileSize: pendingReg.resumeData.fileSize || pendingReg.resumeData.fileData.length,
              isActive: true,
              processingStatus: 'completed'
            };
            
            console.log('Creating Resume document with:', {
              userId: resumeDoc.userId,
              fileName: resumeDoc.fileName,
              originalName: resumeDoc.originalName,
              fileSize: resumeDoc.fileSize,
              base64Length: fileDataBase64.length
            });
            
            const resume = new Resume(resumeDoc);
            const savedResume = await resume.save();
            resumeId = savedResume._id;
            
            console.log('✅ Resume document saved successfully:', {
              resumeId: resumeId,
              userId: user._id
            });
            
            // Update user's currentResumeId
            user.currentResumeId = resumeId;
            if (!user.profile) {
              user.profile = {};
            }
            user.profile.currentResumeId = resumeId;
            
            await user.save();
            
            console.log('✅ User updated with resumeId:', resumeId);
            console.log('========== RESUME CREATION END ==========');
          } catch (resumeError) {
            console.error('❌ ERROR saving resume after OTP verification:', {
              error: resumeError.message,
              stack: resumeError.stack,
              name: resumeError.name
            });
            // Don't fail the entire verification if resume save fails
          }
        } else {
          console.log('⚠️ No resume data found in pending registration:', {
            hasResumeData: !!pendingReg.resumeData,
            hasFileData: !!pendingReg.resumeData?.fileData
          });
        }
        
        // Delete pending registration
        await PendingRegistration.deleteOne({ _id: pendingReg._id });
        
        return res.json({ 
          success: true, 
          message: 'Email verified successfully! Your account has been created.',
          data: {
            userId: user._id,
            email: user.email,
            role: user.role,
            resumeUploaded: !!resumeId
          }
        });
      } else if (pendingReg.type === 'company') {
        // Create company and admin user from pending registration
        const cd = pendingReg.companyData;
        
        try {
          // Create company first
          const company = await Company.create({
            name: cd.companyName,
            industry: cd.industry,
            size: cd.companySize,
            headquarters: cd.headquarters,
            country: cd.country,
            website: cd.website,
            registrationNumber: cd.registrationNumber,
            description: cd.description,
            logo: cd.logo,
            socialLinks: cd.socialLinks,
            hiringRegions: cd.hiringRegions,
            remotePolicy: cd.remotePolicy,
            status: 'active'
          });
  
          // Create admin user with reference to company
          const adminUser = await User.create({
            firstName: cd.adminFirstName,
            lastName: cd.adminLastName,
            email: pendingReg.email,
            password: cd.adminPassword, // Already hashed
            phone: cd.adminPhone,
            role: 'admin',
            location: `${cd.headquarters}, ${cd.country}`,
            companyId: company._id,
            isCompanyAdmin: true,
            accountStatus: 'active',
            emailVerifiedAt: new Date(),
            preferences: { emailNotifications: true, pushNotifications: true },
            permissions: {
              canManageUsers: true,
              canManageJobs: true,
              canManageCompany: true,
              canViewReports: true,
              canManageInterviewers: true
            }
          });
  
          // Update company with admin user reference
          company.adminUserId = adminUser._id;
          if (company.verificationStatus) {
            company.verificationStatus.emailVerified = true;
            company.verificationStatus.verifiedAt = new Date();
          }
          await company.save();
          
          // Delete pending registration
          await PendingRegistration.deleteOne({ _id: pendingReg._id });
          
          return res.json({ 
            success: true, 
            message: 'Email verified successfully! Your company account has been created.',
            data: {
              userId: adminUser._id,
              email: adminUser.email,
              role: adminUser.role,
              companyId: company._id,
              companyName: company.name
            }
          });
        } catch (error) {
          console.error('Company creation error:', error);
          throw error;
        }
      }
    }

    // For existing users, just activate their account
    user.accountStatus = 'active';
    user.emailVerifiedAt = new Date();
    await user.save();

    if (user.role !== 'applicant' && user.companyId) {
      const company = await Company.findById(user.companyId);
      if (company) {
        company.status = 'active';
        if (company.verificationStatus) {
          company.verificationStatus.emailVerified = true;
          company.verificationStatus.verifiedAt = new Date();
        }
        await company.save();
      }
    }

    return res.json({ 
      success: true, 
      message: 'Email verified successfully',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during OTP verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
};
