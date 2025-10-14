const Notification = require('../models/Notification');
const User = require('../models/User');

let ioInstance = null;

function init(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

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

  // Emit in real-time if socket is available
  if (ioInstance) {
    try {
      if (toUserId) {
        const room = `user:${toUserId.toString()}`;
        ioInstance.to(room).emit('notification:new', notif.toObject());
        console.log(`🔔 Emitted to room: ${room}`);
      }
      if (toCompanyId && toRole) {
        const room = `company:${toCompanyId.toString()}:${toRole}`;
        ioInstance.to(room).emit('notification:new', notif.toObject());
        console.log(`🔔 Emitted to room: ${room}`);
      }
    } catch (e) {
      console.warn('Socket emit failed:', e.message);
    }
  } else {
    console.warn('⚠️ Socket.IO not initialized');
  }
  return notif;
}

async function broadcastToCompanyRole(companyId, role, payload) {
  // Persist for all users with that role in the company
  const users = await User.find({ company: companyId, role }).select('_id');
  const promises = users.map(u => createAndEmit({ ...payload, toUserId: u._id, toCompanyId: companyId, toRole: role }));
  return Promise.all(promises);
}

module.exports = { init, getIo, createAndEmit, broadcastToCompanyRole };
