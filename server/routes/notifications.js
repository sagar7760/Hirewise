const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// All routes require auth
router.use(auth);

// GET /api/notifications
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'unread', 'read'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { page = 1, limit = 20, status = 'all' } = req.query;
      const filter = {
        $or: [
          { user: req.user.id },
          { $and: [{ company: req.user.company?._id || req.user.companyId }, { role: req.user.role }] }
        ]
      };
      if (status === 'unread') filter.read = false;
      if (status === 'read') filter.read = true;

      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Notification.countDocuments(filter)
      ]);

      return res.json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (e) {
      console.error('List notifications error:', e);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const filter = {
      $or: [
        { user: req.user.id },
        { $and: [{ company: (req.user.company && req.user.company._id) || req.user.companyId }, { role: req.user.role }] }
      ],
      read: false
    };
    const count = await Notification.countDocuments(filter);
    return res.json({ success: true, data: { count } });
  } catch (e) {
    console.error('Unread count error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', [param('id').isMongoId()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const notif = await Notification.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { company: req.user.company?._id || req.user.companyId }]
    });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    notif.read = true;
    notif.readAt = new Date();
    await notif.save();
    return res.json({ success: true, data: notif });
  } catch (e) {
    console.error('Mark read error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    const filter = {
      $or: [
        { user: req.user.id },
        { $and: [{ company: (req.user.company && req.user.company._id) || req.user.companyId }, { role: req.user.role }] }
      ],
      read: false
    };
    const result = await Notification.updateMany(filter, { $set: { read: true, readAt: new Date() } });
    return res.json({ success: true, data: { modified: result.modifiedCount } });
  } catch (e) {
    console.error('Mark all read error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/notifications/:id - Delete a single notification the user has access to
router.delete('/:id', [param('id').isMongoId()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const filter = {
      _id: req.params.id,
      $or: [{ user: req.user.id }, { company: req.user.company?._id || req.user.companyId }]
    };
    const deleted = await Notification.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, data: { _id: deleted._id } });
  } catch (e) {
    console.error('Delete notification error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/notifications - Bulk delete notifications by ids array
router.delete('/', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'ids array is required' });

    // Validate ids are ObjectId-like
    const invalid = ids.find((id) => !id || !id.match(/^[a-f\d]{24}$/i));
    if (invalid) return res.status(400).json({ success: false, message: 'Invalid id in ids array' });

    const baseFilter = { $or: [{ user: req.user.id }, { company: req.user.company?._id || req.user.companyId }] };
    const result = await Notification.deleteMany({ ...baseFilter, _id: { $in: ids } });
    return res.json({ success: true, data: { deleted: result.deletedCount } });
  } catch (e) {
    console.error('Bulk delete notifications error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
