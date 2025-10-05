const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Job = require('../../models/Job');
const Interview = require('../../models/Interview');

// Helper to format interviewer response
const formatInterviewer = (user, metrics = {}) => ({
  id: user._id,
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  department: user.department || 'N/A',
  expertise: user.interviewerProfile?.expertise || [],
  assignedJobs: metrics.assignedJobs || 0,
  completedInterviews: metrics.completedInterviews || 0,
  status: user.isActive !== false ? 'active' : 'inactive',
  dateAdded: user.joiningDate ? user.joiningDate.toISOString().split('T')[0] : new Date(user.createdAt).toISOString().split('T')[0]
});

// GET all interviewers for admin's company
const getAllInterviewers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const interviewers = await User.find({ role: 'interviewer', companyId })
      .select('-password')
      .sort({ createdAt: -1 });

    const interviewerIds = interviewers.map(i => i._id);

    // Assigned jobs = jobs where interviewer id appears as defaultInterviewer OR postedBy (if that pattern is used)
    const assignedAgg = await Job.aggregate([
      { $match: { company: companyId, $or: [ { defaultInterviewer: { $in: interviewerIds.map(id => id.toString()) } }, { postedBy: { $in: interviewerIds } } ] } },
      { $group: { _id: '$postedBy', count: { $sum: 1 } } }
    ]);
    const assignedMap = assignedAgg.reduce((acc, r) => { acc[r._id?.toString()] = r.count; return acc; }, {});

    // Completed interviews per interviewer (status completed)
    const completedAgg = await Interview.aggregate([
      { $match: { interviewer: { $in: interviewerIds }, status: 'completed' } },
      { $group: { _id: '$interviewer', count: { $sum: 1 } } }
    ]);
    const completedMap = completedAgg.reduce((acc, r) => { acc[r._id.toString()] = r.count; return acc; }, {});

    const formatted = interviewers.map(i => formatInterviewer(i, {
      assignedJobs: assignedMap[i._id.toString()] || 0,
      completedInterviews: completedMap[i._id.toString()] || 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching interviewers:', error);
    res.status(500).json({ error: 'Failed to fetch interviewers', details: error.message });
  }
};

// Create interviewer
const createInterviewer = async (req, res) => {
  try {
    const { firstName, lastName, email, department, password, expertise = [] } = req.body;
    if (!firstName || !lastName || !email || !department || !password) {
      return res.status(400).json({ error: 'Required: firstName, lastName, email, department, password' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    const companyId = req.user.companyId || (req.user.company?._id || req.user.company);
    if (!companyId) return res.status(400).json({ error: 'Company context missing' });

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: 'interviewer',
      department: department.trim(),
      company: companyId,
      companyId: companyId,
      joiningDate: new Date(),
      isActive: true,
      interviewerProfile: { expertise },
      createdBy: req.user._id
    });

    const saved = await newUser.save();
    res.status(201).json({ message: 'Interviewer created', interviewer: formatInterviewer(saved) });
  } catch (error) {
    console.error('Error creating interviewer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create interviewer', details: error.message });
  }
};

// Update interviewer
const updateInterviewer = async (req, res) => {
  try {
    const { interviewerId } = req.params;
    const { firstName, lastName, email, department, password, expertise = [] } = req.body;
    if (!firstName || !lastName || !email || !department) {
      return res.status(400).json({ error: 'Required: firstName, lastName, email, department' });
    }
    const interviewer = await User.findOne({ _id: interviewerId, role: 'interviewer', companyId: req.user.companyId });
    if (!interviewer) return res.status(404).json({ error: 'Interviewer not found' });

    if (email.toLowerCase().trim() !== interviewer.email) {
      const exists = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: interviewerId } });
      if (exists) return res.status(400).json({ error: 'A user with this email already exists' });
    }

    interviewer.firstName = firstName.trim();
    interviewer.lastName = lastName.trim();
    interviewer.email = email.toLowerCase().trim();
    interviewer.department = department.trim();
    interviewer.interviewerProfile = interviewer.interviewerProfile || {};
    interviewer.interviewerProfile.expertise = expertise;
    interviewer.updatedAt = new Date();
    interviewer.updatedBy = req.user._id;
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(12);
      interviewer.password = await bcrypt.hash(password.trim(), salt);
    }
    const saved = await interviewer.save();
    res.json({ message: 'Interviewer updated', interviewer: formatInterviewer(saved) });
  } catch (error) {
    console.error('Error updating interviewer:', error);
    if (error.name === 'ValidationError') return res.status(400).json({ error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) });
    if (error.code === 11000) return res.status(400).json({ error: 'A user with this email already exists' });
    res.status(500).json({ error: 'Failed to update interviewer', details: error.message });
  }
};

// Delete interviewer
const deleteInterviewer = async (req, res) => {
  try {
    const { interviewerId } = req.params;
    const deleted = await User.findOneAndDelete({ _id: interviewerId, role: 'interviewer', companyId: req.user.companyId });
    if (!deleted) return res.status(404).json({ error: 'Interviewer not found' });
    res.json({ message: 'Interviewer deleted', deleted: { id: deleted._id, name: `${deleted.firstName} ${deleted.lastName}`, email: deleted.email } });
  } catch (error) {
    console.error('Error deleting interviewer:', error);
    res.status(500).json({ error: 'Failed to delete interviewer', details: error.message });
  }
};

// Toggle status
const toggleInterviewerStatus = async (req, res) => {
  try {
    const { interviewerId } = req.params;
    const interviewer = await User.findOne({ _id: interviewerId, role: 'interviewer', companyId: req.user.companyId });
    if (!interviewer) return res.status(404).json({ error: 'Interviewer not found' });
    interviewer.isActive = interviewer.isActive === false ? true : false;
    interviewer.updatedAt = new Date();
    interviewer.updatedBy = req.user._id;
    const saved = await interviewer.save();

    // recompute metrics
    const assignedJobs = await Job.countDocuments({ company: req.user.companyId, postedBy: saved._id });
    const completedInterviews = await Interview.countDocuments({ interviewer: saved._id, status: 'completed' });

    res.json({ message: `Interviewer ${saved.isActive ? 'activated' : 'deactivated'}`, interviewer: formatInterviewer(saved, { assignedJobs, completedInterviews }) });
  } catch (error) {
    console.error('Error toggling interviewer status:', error);
    res.status(500).json({ error: 'Failed to toggle status', details: error.message });
  }
};

module.exports = { getAllInterviewers, createInterviewer, updateInterviewer, deleteInterviewer, toggleInterviewerStatus };