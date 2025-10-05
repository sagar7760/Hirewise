const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const User = require('../../models/User');

// Return a lightweight list of interviewers available to HR (same company)
// GET /api/hr/interviewers
// Access: hr, admin
const router = express.Router();

router.get('/', auth, authorize('hr','admin'), async (req,res) => {
  try {
    const companyId = req.user.companyId || req.user.company?._id;
    if (!companyId) {
      return res.status(400).json({ success:false, message:'Company context missing for user' });
    }

    const interviewers = await User.find({ role: 'interviewer', companyId, isActive: { $ne: false } })
      .select('firstName lastName email department jobTitle interviewerProfile');

    const formatted = interviewers.map(i => ({
      id: i._id,
      name: `${i.firstName} ${i.lastName}`.trim(),
      email: i.email,
      department: i.department || i.jobTitle || 'N/A',
      expertise: i.interviewerProfile?.expertise || []
    }));

    res.json({ success:true, data: formatted });
  } catch (error) {
    console.error('HR get interviewers error:', error);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
