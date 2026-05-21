const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// @desc    Get list of conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const me = new mongoose.Types.ObjectId(req.user._id);

  const conversations = await Message.aggregate([
    {
      $match: { $or: [{ sender: me }, { recipient: me }] },
    },
    {
      $addFields: {
        otherUser: {
          $cond: [{ $eq: ['$sender', me] }, '$recipient', '$sender'],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$otherUser',
        lastMessage: { $first: '$content' },
        lastMessageAt: { $first: '$createdAt' },
        lastSender: { $first: '$sender' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$recipient', me] }, { $eq: ['$read', false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        user: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          avatar: '$user.avatar',
        },
        lastMessage: 1,
        lastMessageAt: 1,
        lastSenderIsMe: { $eq: ['$lastSender', me] },
        unreadCount: 1,
      },
    },
    { $sort: { lastMessageAt: -1 } },
  ]);

  res.json(conversations);
});

// @desc    Get all messages between current user and another user
// @route   GET /api/messages/with/:userId
// @access  Private
const getMessagesWith = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const other = req.params.userId;

  const otherUser = await User.findById(other).select('name email role avatar');
  if (!otherUser) {
    res.status(404);
    throw new Error('User not found');
  }

  const messages = await Message.find({
    $or: [
      { sender: me, recipient: other },
      { sender: other, recipient: me },
    ],
  }).sort('createdAt');

  await Message.updateMany(
    { sender: other, recipient: me, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  res.json({ user: otherUser, messages });
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { recipient, content } = req.body;
  if (!recipient || !content?.trim()) {
    res.status(400);
    throw new Error('Recipient and content are required');
  }
  if (recipient === String(req.user._id)) {
    res.status(400);
    throw new Error('Cannot send a message to yourself');
  }

  const recipientUser = await User.findById(recipient);
  if (!recipientUser || !recipientUser.isActive) {
    res.status(404);
    throw new Error('Recipient not found or inactive');
  }

  const allowedRoles = ['admin', 'doctor', 'receptionist', 'patient'];
  if (!allowedRoles.includes(recipientUser.role)) {
    res.status(403);
    throw new Error('Cannot message this user');
  }

  const msg = await Message.create({
    sender: req.user._id,
    recipient,
    content: content.trim(),
  });

  res.status(201).json(msg);
});

// @desc    Unread message count for current user
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    recipient: req.user._id,
    read: false,
  });
  res.json({ count });
});

// @desc    List of users I can start a chat with
// @route   GET /api/messages/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res) => {
  const me = req.user;
  let users = [];

  if (me.role === 'patient') {
    const doctors = await Doctor.find().populate('user', 'name email role avatar isActive');
    users = doctors
      .map((d) => d.user)
      .filter((u) => u && u.isActive && String(u._id) !== String(me._id));
    const admins = await User.find({ role: { $in: ['admin', 'receptionist'] }, isActive: true })
      .select('name email role avatar');
    users = [...users, ...admins];
  } else if (me.role === 'doctor') {
    const patients = await Patient.find().populate('user', 'name email role avatar isActive');
    users = patients
      .map((p) => p.user)
      .filter((u) => u && u.isActive && String(u._id) !== String(me._id));
    const staff = await User.find({ role: { $in: ['admin', 'receptionist', 'doctor'] }, isActive: true, _id: { $ne: me._id } })
      .select('name email role avatar');
    users = [...users, ...staff];
  } else {
    users = await User.find({ isActive: true, _id: { $ne: me._id } })
      .select('name email role avatar')
      .sort('name');
  }

  const seen = new Set();
  const unique = users.filter((u) => {
    const id = String(u._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  res.json(unique);
});

module.exports = {
  getConversations,
  getMessagesWith,
  sendMessage,
  getUnreadCount,
  getContacts,
};
