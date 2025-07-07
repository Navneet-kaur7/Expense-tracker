// Switch to the expense_tracker database
db = db.getSiblingDB('expense_tracker');

// Create a user for the application
db.createUser({
  user: 'expense_user',
  pwd: 'expense_password',
  roles: [
    {
      role: 'readWrite',
      db: 'expense_tracker'
    }
  ]
});

// Create collections with some sample data
db.createCollection('categories');
db.createCollection('expenses');

// Insert default categories
db.categories.insertMany([
  { name: 'Food', type: 'expense', isDefault: true },
  { name: 'Transportation', type: 'expense', isDefault: true },
  { name: 'Entertainment', type: 'expense', isDefault: true },
  { name: 'Utilities', type: 'expense', isDefault: true },
  { name: 'Healthcare', type: 'expense', isDefault: true },
  { name: 'Shopping', type: 'expense', isDefault: true },
  { name: 'Other', type: 'expense', isDefault: true },
  { name: 'Salary', type: 'income', isDefault: true },
  { name: 'Freelance', type: 'income', isDefault: true },
  { name: 'Investment', type: 'income', isDefault: true },
  { name: 'Gift', type: 'income', isDefault: true },
  { name: 'Other', type: 'income', isDefault: true }
]);

print('Database initialized successfully');