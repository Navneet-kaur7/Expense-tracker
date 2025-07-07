const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/category');

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense')
];

// GET /api/categories - Get all categories grouped by type
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ type: 1, name: 1 });
    
    // Group categories by type
    const grouped = {
      income: [],
      expense: []
    };
    
    categories.forEach(category => {
      grouped[category.type].push(category.name);
    });
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/all - Get all categories with details
router.get('/all', async (req, res) => {
  try {
    const categories = await Category.find().sort({ type: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/:type - Get categories by type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Invalid category type' });
    }
    
    const categories = await Category.find({ type }).sort({ name: 1 });
    
    res.json(categories.map(cat => cat.name));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - Create new category
router.post('/', validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { name, type } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name, type });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    const category = new Category({
      name,
      type,
      isDefault: false
    });
    
    await category.save();
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { name, type } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, type },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Prevent deletion of default categories
    if (category.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default category' });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;