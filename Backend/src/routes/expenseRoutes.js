import express from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  syncExpenses,
  getExpenseStats,
  getExpensesByDateRange
} from '../controllers/expenseController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Sync expenses from frontend (bulk create/update)
router.post('/sync', restrictTo('gym-owner', 'super-admin'), syncExpenses);

// Get expense statistics
router.get('/stats', restrictTo('gym-owner', 'super-admin'), getExpenseStats);

// Get expenses by date range
router.get('/range', restrictTo('gym-owner', 'super-admin'), getExpensesByDateRange);

// CRUD operations
router.route('/')
  .get(restrictTo('gym-owner', 'super-admin'), getExpenses)
  .post(restrictTo('gym-owner', 'super-admin'), createExpense);

router.route('/:id')
  .get(restrictTo('gym-owner', 'super-admin'), getExpenseById)
  .put(restrictTo('gym-owner', 'super-admin'), updateExpense)
  .delete(restrictTo('gym-owner', 'super-admin'), deleteExpense);

export default router;