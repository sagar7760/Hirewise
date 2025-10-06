const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Interview = require('../../models/Interview');

// Helper to compute stats over last N days
const computeStats = async (userId, days = 90) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const match = { interviewer: userId, scheduledDate: { $gte: since } };

  const interviews = await Interview.find(match).select('scheduledDate feedback');
  const totalInterviews = interviews.length;
  const withFeedback = interviews.filter(i => i.feedback && i.feedback.overallRating);
  let averageRating = null;
  if (withFeedback.length) {
    averageRating = withFeedback.reduce((s, i) => s + (i.feedback.overallRating || 0), 0) / withFeedback.length;
    averageRating = Number(averageRating.toFixed(2));
  }
  // response time: submittedAt - scheduledDate in days
  const responseDurations = withFeedback
    .filter(i => i.feedback.submittedAt)
    .map(i => (i.feedback.submittedAt - i.scheduledDate) / (1000 * 60 * 60 * 24))
    .filter(v => v >= 0);
  let responseTime = null;
  if (responseDurations.length) {
    responseTime = Number((responseDurations.reduce((a,b)=>a+b,0) / responseDurations.length).toFixed(2));
  }
  return { totalInterviews, averageRating, responseTime };
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('+password')
      .populate('createdBy', 'firstName lastName email')
      .populate('company', 'name logo');
    if (!user || !user.isInterviewer()) {
      return res.status(404).json({ success:false, message:'Interviewer not found' });
    }
    const stats = await computeStats(user._id, 90);
    const specialization = user.interviewerSettings?.specialization || user.interviewerProfile?.expertise?.[0] || '';
    const notificationPreferences = user.interviewerSettings?.notificationPreferences || {};
    const payload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      specialization,
      status: user.accountStatus === 'active' ? 'Active' : user.accountStatus,
      profilePicture: user.avatar || user.profilePicture || null,
      addedBy: user.createdBy ? `${user.createdBy.firstName} ${user.createdBy.lastName}` : null,
      company: user.company ? { name: user.company.name, logo: user.company.logo || null } : null,
      addedOn: user.createdAt,
      joinedOn: user.joiningDate || user.createdAt,
      interviewerSettings: {
        specialization,
        notificationPreferences: {
          interviewReminders: true,
          candidateUpdates: true,
          feedbackDeadlines: true,
          scheduleChanges: true,
          weeklyReports: false,
          emailDigests: true,
          ...notificationPreferences
        }
      },
      lastPasswordChange: user.lastPasswordChange || null,
      interviewStats: {
        totalInterviews: stats.totalInterviews,
        averageRating: stats.averageRating,
        responseTime: stats.responseTime !== null ? `${stats.responseTime} days` : null
      }
    };
    return res.json({ success:true, data: payload });
  } catch (e) {
    console.error('getProfile error', e);
    return res.status(500).json({ success:false, message:'Failed to load profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { phone, specialization, notificationPreferences } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.isInterviewer()) {
      return res.status(404).json({ success:false, message:'Interviewer not found' });
    }
    if (typeof phone === 'string') user.phone = phone;
    if (typeof specialization === 'string') {
      user.interviewerSettings = user.interviewerSettings || {};
      user.interviewerSettings.specialization = specialization;
      // keep expertise array in sync (first element)
      user.interviewerProfile = user.interviewerProfile || {};
      user.interviewerProfile.expertise = [specialization];
    }
    if (notificationPreferences && typeof notificationPreferences === 'object') {
      user.interviewerSettings = user.interviewerSettings || {};
      user.interviewerSettings.notificationPreferences = {
        ...user.interviewerSettings.notificationPreferences,
        ...notificationPreferences
      };
    }
    await user.save();
    return res.json({ success:true, message:'Profile updated' });
  } catch (e) {
    console.error('updateProfile error', e);
    return res.status(500).json({ success:false, message:'Failed to update profile' });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const { notificationPreferences } = req.body;
    if (!notificationPreferences || typeof notificationPreferences !== 'object') {
      return res.status(400).json({ success:false, message:'notificationPreferences object required' });
    }
    const user = await User.findById(req.user.id);
    if (!user || !user.isInterviewer()) {
      return res.status(404).json({ success:false, message:'Interviewer not found' });
    }
    user.interviewerSettings = user.interviewerSettings || {};
    user.interviewerSettings.notificationPreferences = {
      interviewReminders: true,
      candidateUpdates: true,
      feedbackDeadlines: true,
      scheduleChanges: true,
      weeklyReports: false,
      emailDigests: true,
      ...user.interviewerSettings.notificationPreferences,
      ...notificationPreferences
    };
    await user.save();
    return res.json({ success:true, data: user.interviewerSettings.notificationPreferences });
  } catch (e) {
    console.error('updateNotifications error', e);
    return res.status(500).json({ success:false, message:'Failed to update notification preferences' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success:false, message:'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success:false, message:'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user || !user.isInterviewer()) {
      return res.status(404).json({ success:false, message:'Interviewer not found' });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ success:false, message:'Current password incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.lastPasswordChange = new Date();
    await user.save();
    return res.json({ success:true, message:'Password updated successfully', lastPasswordChange: user.lastPasswordChange });
  } catch (e) {
    console.error('changePassword error', e);
    return res.status(500).json({ success:false, message:'Failed to change password' });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success:false, message:'No file uploaded' });
    }
    // Size & mime validated by upload middleware ideally
    const user = await User.findById(req.user.id);
    if (!user || !user.isInterviewer()) {
      return res.status(404).json({ success:false, message:'Interviewer not found' });
    }
    // Convert to base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    user.avatar = base64;
    user.profilePicture = base64;
    await user.save();
    return res.json({ success:true, message:'Avatar updated', avatar: base64 });
  } catch (e) {
    console.error('updateAvatar error', e);
    return res.status(500).json({ success:false, message:'Failed to update avatar' });
  }
};