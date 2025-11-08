const Notification = require('../models/Notification');
const User = require('../models/User');

// Socket removed: keep init/getIo as no-ops for backward compatibility
function init() { /* no-op */ }
function getIo() { return null; }

async function createAndEmit({
  toUserId,
  toCompanyId,
  toRole,
  type,
  title,
  message,
  actionUrl,
  entity,
  priority = 'low',
  metadata,
  createdBy
}) {
  console.log('📧 Creating notification:', {
    toUserId,
    toCompanyId,
    toRole,
    type,
    title
  });

  const notif = new Notification({
    user: toUserId || undefined,
    company: toCompanyId || undefined,
    role: toRole || undefined,
    type,
    title,
    message,
    actionUrl,
    entity,
    priority,
    metadata,
    createdBy
  });
  await notif.save();
  console.log('✅ Notification saved to DB:', notif._id);

  // Real-time socket emission removed. Clients should fetch via REST when needed.
  return notif;
}

async function broadcastToCompanyRole(companyId, role, payload) {
  // Persist for all users with that role in the company
  const users = await User.find({ company: companyId, role }).select('_id');
  const promises = users.map(u => createAndEmit({ ...payload, toUserId: u._id, toCompanyId: companyId, toRole: role }));
  return Promise.all(promises);
}

module.exports = { init, getIo, createAndEmit, broadcastToCompanyRole };
