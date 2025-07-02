import Enquiry from '../models/enquiryModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Create a new enquiry
export const createEnquiry = catchAsync(async (req, res, next) => {
  const { name, phoneNumber, email, purpose, description, dateTime, priority, followUpDate, notes } = req.body;

  // Get gym owner ID from authenticated user
  const gymOwnerId = req.user.role === 'gym-owner' ? req.user._id : req.user.createdBy;

  const enquiry = await Enquiry.create({
    name,
    phoneNumber,
    email,
    purpose,
    description,
    dateTime: dateTime || Date.now(),
    priority: priority || 'medium',
    gymOwner: gymOwnerId,
    followUpDate,
    notes
  });

  res.status(201).json({
    status: 'success',
    data: {
      enquiry
    }
  });
});

// Get all enquiries for a gym owner
export const getEnquiries = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user.role === 'gym-owner' ? req.user._id : req.user.createdBy;
  
  const { status, priority, purpose, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build filter object
  const filter = { gymOwner: gymOwnerId };
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (purpose) filter.purpose = purpose;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  const enquiries = await Enquiry.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('gymOwner', 'name email');

  const total = await Enquiry.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: enquiries.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: {
      enquiries
    }
  });
});

// Get a single enquiry
export const getEnquiry = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user.role === 'gym-owner' ? req.user._id : req.user.createdBy;
  
  const enquiry = await Enquiry.findOne({
    _id: req.params.id,
    gymOwner: gymOwnerId
  }).populate('gymOwner', 'name email');

  if (!enquiry) {
    return next(new AppError('No enquiry found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      enquiry
    }
  });
});

// Update an enquiry
export const updateEnquiry = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user.role === 'gym-owner' ? req.user._id : req.user.createdBy;
  
  const enquiry = await Enquiry.findOneAndUpdate(
    {
      _id: req.params.id,
      gymOwner: gymOwnerId
    },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('gymOwner', 'name email');

  if (!enquiry) {
    return next(new AppError('No enquiry found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      enquiry
    }
  });
});

// Delete an enquiry
export const deleteEnquiry = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user.role === 'gym-owner' ? req.user._id : req.user.createdBy;
  
  const enquiry = await Enquiry.findOneAndDelete({
    _id: req.params.id,
    gymOwner: gymOwnerId
  });

  if (!enquiry) {
    return next(new AppError('No enquiry found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get enquiry statistics
export const getEnquiryStats = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user.role === 'gym-owner' ? req.user._id : req.user.createdBy;

  const stats = await Enquiry.aggregate([
    {
      $match: { gymOwner: gymOwnerId }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const purposeStats = await Enquiry.aggregate([
    {
      $match: { gymOwner: gymOwnerId }
    },
    {
      $group: {
        _id: '$purpose',
        count: { $sum: 1 }
      }
    }
  ]);

  const priorityStats = await Enquiry.aggregate([
    {
      $match: { gymOwner: gymOwnerId }
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalEnquiries = await Enquiry.countDocuments({ gymOwner: gymOwnerId });

  res.status(200).json({
    status: 'success',
    data: {
      totalEnquiries,
      statusStats: stats,
      purposeStats,
      priorityStats
    }
  });
});