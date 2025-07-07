const express = require('express');
const Expense = require('../models/Expense');

const router = express.Router();

// Get financial statistics
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }
    
    // Get total income and expenses
    const [incomeResult, expenseResult] = await Promise.all([
      Expense.aggregate([
        { $match: { type: 'income', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { type: 'expense', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;
    const balance = totalIncome - totalExpenses;
    
    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: { type: 'expense', ...dateFilter } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    
    const categoryBreakdown = {};
    expensesByCategory.forEach(item => {
      categoryBreakdown[item._id] = item.total;
    });
    
    // Get monthly data
    const monthlyData = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format monthly data
    const monthlyBreakdown = {};
    monthlyData.forEach(item => {
      const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { income: 0, expenses: 0 };
      }
      monthlyBreakdown[monthKey][item._id.type === 'income' ? 'income' : 'expenses'] = item.total;
    });
    
    // Get transaction count
    const totalTransactions = await Expense.countDocuments(dateFilter);
    
    // Get recent transactions
    const recentTransactions = await Expense.find(dateFilter)
      .sort({ date: -1 })
      .limit(5);
    
    res.json({
      totalIncome,
      totalExpenses,
      balance,
      expensesByCategory: categoryBreakdown,
      monthlyData: monthlyBreakdown,
      totalTransactions,
      recentTransactions
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly trends
router.get('/trends', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);
    
    const trends = await Expense.aggregate([
      { $match: { date: { $gte: monthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category-wise spending trends
router.get('/category-trends', async (req, res) => {
  try {
    const { category, months = 6 } = req.query;
    
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);
    
    let matchCondition = { 
      date: { $gte: monthsAgo },
      type: 'expense'
    };
    
    if (category) {
      matchCondition.category = category;
    }
    
    const trends = await Expense.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.category': 1 } }
    ]);
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching category trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;