import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  gymOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    enum: [
      'equipment',
      'rent',
      'utilities',
      'staff-salary',
      'marketing',
      'maintenance',
      'insurance',
      'supplies',
      'other',
      // Also allow capitalized versions for backward compatibility
      'Equipment',
      'Rent',
      'Utilities',
      'Staff Salary',
      'Marketing',
      'Maintenance',
      'Insurance',
      'Supplies',
      'Other'
    ],
    default: 'other'
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Other'],
    default: 'Cash'
  },
  receipt: {
    type: String, // URL to receipt image/document
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    required: function() {
      return this.isRecurring;
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
expenseSchema.index({ gymOwner: 1, date: -1 });
expenseSchema.index({ gymOwner: 1, category: 1 });
expenseSchema.index({ date: -1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString('en-IN')}`;
});

// Method to get expenses by date range
expenseSchema.statics.getExpensesByDateRange = function(gymOwnerId, startDate, endDate) {
  return this.find({
    gymOwner: gymOwnerId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Method to get monthly expenses summary
expenseSchema.statics.getMonthlyExpensesSummary = function(gymOwnerId, year) {
  return this.aggregate([
    {
      $match: {
        gymOwner: new mongoose.Types.ObjectId(gymOwnerId),
        date: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          category: '$category'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        categories: {
          $push: {
            category: '$_id.category',
            amount: '$totalAmount',
            count: '$count'
          }
        },
        totalMonthlyExpenses: { $sum: '$totalAmount' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;