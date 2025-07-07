let currentType = 'expense';
let categories = {};
let transactions = [];

// Base API URL - adjust this to match your backend server
const API_BASE_URL = 'http://localhost:5000';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadTransactions();
    loadStats();
});

// Load categories from server
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        categories = await response.json();
        updateCategoryOptions();
        updateFilterCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        showMessage('Failed to load categories. Please check if the server is running.', 'error');
    }
}

// Load transactions from server
async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Backend returns paginated data with expenses array
        transactions = data.expenses || data;
        renderTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showMessage('Failed to load transactions. Please check if the server is running.', 'error');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stats = await response.json();
        updateStats(stats);
        updateCategoryChart(stats.expensesByCategory);
    } catch (error) {
        console.error('Error loading stats:', error);
        showMessage('Failed to load statistics. Please check if the server is running.', 'error');
    }
}

// Select transaction type
function selectType(type) {
    currentType = type;
    document.getElementById('expenseBtn').classList.toggle('active', type === 'expense');
    document.getElementById('incomeBtn').classList.toggle('active', type === 'income');
    updateCategoryOptions();
}

// Update category dropdown based on selected type
function updateCategoryOptions() {
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">Select a category</option>';
    
    if (categories[currentType]) {
        categories[currentType].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
}

// Update filter category options
function updateFilterCategories() {
    const filterSelect = document.getElementById('filterCategory');
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    
    const allCategories = [...(categories.expense || []), ...(categories.income || [])];
    [...new Set(allCategories)].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterSelect.appendChild(option);
    });
}

// Add new transaction
async function addTransaction() {
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (!description || !amount || !category) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (amount <= 0) {
        showMessage('Amount must be greater than 0', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                description,
                amount,
                category,
                type: currentType
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add transaction');
        }

        showMessage('Transaction added successfully!', 'success');
        clearForm();
        loadTransactions();
        loadStats();
    } catch (error) {
        console.error('Error adding transaction:', error);
        showMessage(error.message || 'Failed to add transaction', 'error');
    }
}

// Delete transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete transaction');
        }

        showMessage('Transaction deleted successfully!', 'success');
        loadTransactions();
        loadStats();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showMessage('Failed to delete transaction', 'error');
    }
}

// Filter transactions
async function filterTransactions() {
    const type = document.getElementById('filterType').value;
    const category = document.getElementById('filterCategory').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const filteredTransactions = data.expenses || data;
        renderTransactions(filteredTransactions);
    } catch (error) {
        console.error('Error filtering transactions:', error);
        showMessage('Failed to filter transactions', 'error');
    }
}

// Render transactions in the UI
function renderTransactions(transactionsList) {
    const container = document.getElementById('transactionsList');
    
    if (!transactionsList || transactionsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No transactions found</h3>
                <p>Add your first transaction above to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = transactionsList.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-meta">
                    <span>📅 ${formatDate(transaction.date)}</span>
                    <span>🏷️ ${transaction.category}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
            </div>
            <button class="btn btn-danger" onclick="deleteTransaction('${transaction.id}')">Delete</button>
        </div>
    `).join('');
}

// Update statistics display
function updateStats(stats) {
    document.getElementById('totalIncome').textContent = `${stats.totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `${stats.totalExpenses.toFixed(2)}`;
    document.getElementById('currentBalance').textContent = `${stats.balance.toFixed(2)}`;
    
    // Color balance based on positive/negative
    const balanceElement = document.getElementById('currentBalance');
    const balanceCard = balanceElement.closest('.stat-card');
    if (stats.balance < 0) {
        balanceCard.style.background = 'linear-gradient(135deg, #ff416c, #ff4b2b)';
    } else {
        balanceCard.style.background = 'linear-gradient(135deg, #4776e6, #8e54e9)';
    }
}

// Update category chart
function updateCategoryChart(expensesByCategory) {
    const chartContainer = document.getElementById('categoryChart');
    
    if (!expensesByCategory || Object.keys(expensesByCategory).length === 0) {
        chartContainer.innerHTML = `
            <div class="empty-state">
                <p>No expense data available</p>
            </div>
        `;
        return;
    }

    const total = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
    
    chartContainer.innerHTML = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => {
            const percentage = (amount / total * 100).toFixed(1);
            return `
                <div class="category-item">
                    <span>${category}</span>
                    <div class="category-bar">
                        <div class="category-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span>${amount.toFixed(2)} (${percentage}%)</span>
                </div>
            `;
        }).join('');
}

// Clear form
function clearForm() {
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
}

// Show message
function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}