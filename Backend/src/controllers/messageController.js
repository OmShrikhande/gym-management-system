import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import MessageTemplate from '../models/messageTemplateModel.js';
import Message from '../models/messageModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get all message templates
export const getMessageTemplates = catchAsync(async (req, res, next) => {
  const templates = await MessageTemplate.find();

  res.status(200).json({
    status: 'success',
    results: templates.length,
    data: {
      templates
    }
  });
});

// Create a new message template
export const createMessageTemplate = catchAsync(async (req, res, next) => {
  const { type, title, content, isActive } = req.body;

  const template = await MessageTemplate.create({
    type,
    title,
    content,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      template
    }
  });
});

// Update a message template
export const updateMessageTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type, title, content, isActive } = req.body;

  const template = await MessageTemplate.findByIdAndUpdate(
    id,
    { type, title, content, isActive },
    { new: true, runValidators: true }
  );

  if (!template) {
    return next(new AppError('No template found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      template
    }
  });
});

// Delete a message template
export const deleteMessageTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const template = await MessageTemplate.findByIdAndDelete(id);

  if (!template) {
    return next(new AppError('No template found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Helper function to create notifications and messages
const createNotificationsAndMessage = async (recipients, messageData, sender) => {
  const { type, title, content, channel } = messageData;
  
  // Create a new message record
  const message = await Message.create({
    type,
    content,
    sender: sender.id,
    recipients: recipients.map(r => r._id),
    channel,
    totalRecipients: recipients.length,
    sentStatus: 'Sent'
  });
  
  // Create notifications for each recipient
  const notifications = await Promise.all(
    recipients.map(recipient => 
      Notification.create({
        recipient: recipient._id,
        type: 'message',
        title,
        message: content,
        read: false
      })
    )
  );
  
  // Update message with delivered count
  await Message.findByIdAndUpdate(
    message._id,
    { deliveredCount: notifications.length }
  );
  
  return { message, notifications };
};

// Send message to all members
export const sendMessageToAllMembers = catchAsync(async (req, res, next) => {
  const { type, title, content, channel } = req.body;
  
  // Find all active members
  const members = await User.find({ 
    role: 'member',
    active: true
  });
  
  if (members.length === 0) {
    return next(new AppError('No active members found', 404));
  }
  
  // Create notifications and message
  const result = await createNotificationsAndMessage(
    members,
    { type, title, content, channel },
    req.user
  );
  
  res.status(201).json({
    status: 'success',
    data: {
      message: result.message,
      recipientCount: members.length,
      deliveredCount: result.notifications.length
    }
  });
});

// Send message to specific member
export const sendMessageToMember = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;
  const { type, title, content, channel } = req.body;
  
  // Find the member
  const member = await User.findOne({ 
    _id: memberId,
    role: 'member',
    active: true
  });
  
  if (!member) {
    return next(new AppError('No active member found with that ID', 404));
  }
  
  // Create notification and message
  const result = await createNotificationsAndMessage(
    [member],
    { type, title, content, channel },
    req.user
  );
  
  res.status(201).json({
    status: 'success',
    data: {
      message: result.message,
      recipientCount: 1,
      deliveredCount: result.notifications.length
    }
  });
});

// Get message history
export const getMessageHistory = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, type, status } = req.query;
  
  const skip = (page - 1) * limit;
  
  // Build query
  const query = { sender: req.user.id };
  
  if (type && type !== 'all') {
    query.type = type;
  }
  
  if (status && status !== 'all') {
    query.sentStatus = status;
  }
  
  // Get messages
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('recipients', 'name email');
  
  // Get total count
  const total = await Message.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      messages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});