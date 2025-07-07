const mongoose = require('mongoose');
const Category = require('../models/category');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize default categories
    await initializeDefaultCategories();
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const initializeDefaultCategories = async () => {
  try {
    const existingCategories = await Category.countDocuments();
    
    if (existingCategories === 0) {
      const defaultCategories = [
        // Expense categories
        { name: 'Food', type: 'expense', isDefault: true },
        { name: 'Transportation', type: 'expense', isDefault: true },
        { name: 'Entertainment', type: 'expense', isDefault: true },
        { name: 'Utilities', type: 'expense', isDefault: true },
        { name: 'Healthcare', type: 'expense', isDefault: true },
        { name: 'Shopping', type: 'expense', isDefault: true },
        { name: 'Other', type: 'expense', isDefault: true },
        
        // Income categories
        { name: 'Salary', type: 'income', isDefault: true },
        { name: 'Freelance', type: 'income', isDefault: true },
        { name: 'Investment', type: 'income', isDefault: true },
        { name: 'Gift', type: 'income', isDefault: true },
        { name: 'Other', type: 'income', isDefault: true }
      ];

      await Category.insertMany(defaultCategories);
      console.log('Default categories initialized');
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

module.exports = connectDB;