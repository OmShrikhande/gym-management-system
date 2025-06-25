import Notification from '../models/notificationModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get all notifications for a user
export const getUserNotifications = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, unreadOnly = false } = req.query;

  const skip = (page - 1) * limit;
  
  // Build query
  const query = { recipient: userId };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  // Get notifications
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await Notification.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// Get unread notification count
export const getUnreadCount = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const count = await Notification.countDocuments({
    recipient: userId,
    read: false
  });

  res.status(200).json({
    status: 'success',
    data: {
      unreadCount: count
    }
  });
});

// Mark notification as read
export const markAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

// Mark all notifications as read
export const markAllAsRead = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

// Create a notification
export const createNotification = catchAsync(async (req, res, next) => {
  const { recipient, type, title, message, actionLink } = req.body;

  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    actionLink
  });

  res.status(201).json({
    status: 'success',
    data: {
      notification
    }
  });
});

// Delete a notification
export const deleteNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});