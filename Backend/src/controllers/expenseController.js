import mongoose from 'mongoose';
import Expense from '../models/expenseModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * Get all expenses for a gym owner
 * @route GET /api/expenses
 * @access Private (Gym Owner, Super Admin)
 */
export const getExpenses = catchAsync(async (req, res, next) => {
  let gymOwnerId;
  
  // Super admin can view all expenses or specific gym owner's expenses
  if (req.user.role === 'super-admin') {
    gymOwnerId = req.query.gymOwnerId || req.user._id;
  } else if (req.user.role === 'gym-owner') {
    gymOwnerId = req.user._id;
  } else {
    return next(new AppError('Access denied. Only gym owners can view expenses.', 403));
  }

  const { startDate, endDate, category, page = 1, limit = 50 } = req.query;
  
  let query = { gymOwner: gymOwnerId };
  
  // Add date range filter if provided
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  // Add category filter if provided
  if (category && category !== 'all') {
    query.category = category;
  }

  const expenses = await Expense.find(query)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalExpenses = await Expense.countDocuments(query);
  const totalAmount = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      expenses,
      totalExpenses,
      totalAmount: totalAmount[0]?.total || 0,
      currentPage: page,
      totalPages: Math.ceil(totalExpenses / limit)
    }
  });
});

/**
 * Get a single expense by ID
 * @route GET /api/expenses/:id
 * @access Private (Gym Owner, Super Admin)
 */
export const getExpenseById = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError('Expense not found', 404));
  }

  // Check if user has permission to view this expense
  if (req.user.role !== 'super-admin' && expense.gymOwner.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied. You can only view your own expenses.', 403));
  }

  res.status(200).json({
    success: true,
    data: { expense }
  });
});

/**
 * Create a new expense
 * @route POST /api/expenses
 * @access Private (Gym Owner)
 */
export const createExpense = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'gym-owner' && req.user.role !== 'super-admin') {
    return next(new AppError('Access denied. Only gym owners can create expenses.', 403));
  }

  // Validate required fields
  const { description, amount, category, date } = req.body;
  
  if (!description || !amount || !category) {
    return next(new AppError('Description, amount, and category are required fields.', 400));
  }

  // Validate amount is a positive number
  if (isNaN(amount) || parseFloat(amount) < 0) {
    return next(new AppError('Amount must be a positive number.', 400));
  }

  // Validate date format
  if (date && isNaN(new Date(date).getTime())) {
    return next(new AppError('Invalid date format.', 400));
  }

  const expenseData = {
    ...req.body,
    amount: parseFloat(amount), // Ensure amount is a number
    gymOwner: req.user.role === 'super-admin' ? req.body.gymOwner : req.user._id
  };

  try {
    const expense = await Expense.create(expenseData);

    res.status(201).json({
      success: true,
      data: { expense },
      message: 'Expense created successfully'
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation Error: ${validationErrors.join(', ')}`, 400));
    }
    throw error;
  }
});

/**
 * Update an expense
 * @route PUT /api/expenses/:id
 * @access Private (Gym Owner, Super Admin)
 */
export const updateExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError('Expense not found', 404));
  }

  // Check if user has permission to update this expense
  if (req.user.role !== 'super-admin' && expense.gymOwner.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied. You can only update your own expenses.', 403));
  }

  const updatedExpense = await Expense.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: { expense: updatedExpense },
    message: 'Expense updated successfully'
  });
});

/**
 * Delete an expense
 * @route DELETE /api/expenses/:id
 * @access Private (Gym Owner, Super Admin)
 */
export const deleteExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError('Expense not found', 404));
  }

  // Check if user has permission to delete this expense
  if (req.user.role !== 'super-admin' && expense.gymOwner.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied. You can only delete your own expenses.', 403));
  }

  await Expense.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

/**
 * Sync expenses from frontend (bulk create/update)
 * @route POST /api/expenses/sync
 * @access Private (Gym Owner)
 */
export const syncExpenses = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'gym-owner' && req.user.role !== 'super-admin') {
    return next(new AppError('Access denied. Only gym owners can sync expenses.', 403));
  }

  const { expenses } = req.body;

  if (!expenses || !Array.isArray(expenses)) {
    return next(new AppError('Invalid expenses data. Expected an array of expenses.', 400));
  }

  const gymOwnerId = req.user.role === 'super-admin' ? req.body.gymOwnerId : req.user._id;
  const syncResults = {
    created: 0,
    updated: 0,
    errors: []
  };

  for (const expenseData of expenses) {
    try {
      // Add gymOwner to each expense
      const expenseWithOwner = {
        ...expenseData,
        gymOwner: gymOwnerId
      };

      if (expenseData._id) {
        // Try to update existing expense
        const existingExpense = await Expense.findOne({
          _id: expenseData._id,
          gymOwner: gymOwnerId
        });

        if (existingExpense) {
          await Expense.findByIdAndUpdate(expenseData._id, expenseWithOwner);
          syncResults.updated++;
        } else {
          // Create new expense if not found
          delete expenseWithOwner._id;
          await Expense.create(expenseWithOwner);
          syncResults.created++;
        }
      } else {
        // Create new expense
        await Expense.create(expenseWithOwner);
        syncResults.created++;
      }
    } catch (error) {
      syncResults.errors.push({
        expense: expenseData,
        error: error.message
      });
    }
  }

  res.status(200).json({
    success: true,
    data: syncResults,
    message: `Sync completed. Created: ${syncResults.created}, Updated: ${syncResults.updated}, Errors: ${syncResults.errors.length}`
  });
});

/**
 * Get expense statistics
 * @route GET /api/expenses/stats
 * @access Private (Gym Owner, Super Admin)
 */
export const getExpenseStats = catchAsync(async (req, res, next) => {
  let gymOwnerId;
  
  if (req.user.role === 'super-admin') {
    gymOwnerId = req.query.gymOwnerId || req.user._id;
  } else if (req.user.role === 'gym-owner') {
    gymOwnerId = req.user._id;
  } else {
    return next(new AppError('Access denied. Only gym owners can view expense statistics.', 403));
  }

  const { year = new Date().getFullYear() } = req.query;

  // Get monthly expenses summary
  const monthlyStats = await Expense.getMonthlyExpensesSummary(gymOwnerId, parseInt(year));

  // Get category-wise expenses for the year
  const categoryStats = await Expense.aggregate([
    {
      $match: {
        gymOwner: new mongoose.Types.ObjectId(gymOwnerId),
        date: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(parseInt(year) + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);

  // Get total expenses for the year
  const yearlyTotal = await Expense.aggregate([
    {
      $match: {
        gymOwner: new mongoose.Types.ObjectId(gymOwnerId),
        date: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(parseInt(year) + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      monthlyStats,
      categoryStats,
      yearlyTotal: yearlyTotal[0] || { totalAmount: 0, count: 0 },
      year: parseInt(year)
    }
  });
});

/**
 * Get expenses by date range
 * @route GET /api/expenses/range
 * @access Private (Gym Owner, Super Admin)
 */
export const getExpensesByDateRange = catchAsync(async (req, res, next) => {
  let gymOwnerId;
  
  if (req.user.role === 'super-admin') {
    gymOwnerId = req.query.gymOwnerId || req.user._id;
  } else if (req.user.role === 'gym-owner') {
    gymOwnerId = req.user._id;
  } else {
    return next(new AppError('Access denied. Only gym owners can view expenses.', 403));
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError('Start date and end date are required', 400));
  }

  const expenses = await Expense.getExpensesByDateRange(
    gymOwnerId,
    new Date(startDate),
    new Date(endDate)
  );

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  res.status(200).json({
    success: true,
    data: {
      expenses,
      totalAmount,
      count: expenses.length,
      dateRange: { startDate, endDate }
    }
  });
});