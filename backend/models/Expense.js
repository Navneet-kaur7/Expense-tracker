const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [100, 'Description cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for better query performance
expenseSchema.index({ date: -1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ category: 1 });

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Expense', expenseSchema);