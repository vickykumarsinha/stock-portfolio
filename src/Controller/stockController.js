import db from '../../server.js';

// Buy stock function
export const buyStock = async (req, res) => {
  const { stockId, symbol, quantity, price, userId } = req.body;
  
  try {
    // Check if user has enough balance
    const userQuery = 'SELECT balance FROM users WHERE user_id = ?';
    const [userResult] = await db.promise().query(userQuery, [userId]);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const totalCost = quantity * price;
    const userBalance = parseFloat(userResult[0].balance);
    
    if (userBalance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Check if user already owns this stock
    const existingStockQuery = 'SELECT * FROM stock_holdings WHERE user_id = ? AND stock_id = ?';
    const [existingStock] = await db.promise().query(existingStockQuery, [userId, symbol]);
    
    if (existingStock.length > 0) {
      // Update existing stock
      const currentShares = parseInt(existingStock[0].share_quantity);
      const currentAvgPrice = parseFloat(existingStock[0].share_value);
      const newShares = currentShares + quantity;
      const newAvgPrice = ((currentShares * currentAvgPrice) + (quantity * price)) / newShares;
      
      const updateStockQuery = 'UPDATE stock_holdings SET share_quantity = ?, share_value = ? WHERE user_id = ? AND stock_id = ?';
      await db.promise().query(updateStockQuery, [newShares, newAvgPrice, userId, symbol]);
    } else {
      // Insert new stock - need to get stock name first
      const insertStockQuery = 'INSERT INTO stock_holdings (user_id, stock_id, share_name, share_quantity, share_value) VALUES (?, ?, ?, ?, ?)';
      await db.promise().query(insertStockQuery, [userId, symbol, symbol, quantity, price]);
    }
    
    // Update user balance
    const newBalance = userBalance - totalCost;
    const updateBalanceQuery = 'UPDATE users SET balance = ? WHERE user_id = ?';
    await db.promise().query(updateBalanceQuery, [newBalance, userId]);

    // Insert transaction record
    const insertTransactionQuery = `
      INSERT INTO transactions (user_id, stock_id, transaction_per_stock, transaction_quantity, transaction_type) 
      VALUES (?, ?, ?, ?, 'BUY')`;
    await db.promise().query(insertTransactionQuery, [userId, symbol, price, quantity]);
    
    res.status(200).json({ 
      message: 'Stock purchased successfully',
      transaction: {
        type: 'buy',
        symbol,
        quantity,
        price,
        totalCost,
        newBalance
      }
    });
    
  } catch (error) {
    console.error('Buy stock error:', error);
    res.status(500).json({ error: 'Failed to buy stock' });
  }
};

// Sell stock function
export const sellStock = async (req, res) => {
  const { stockId, symbol, quantity, price, userId } = req.body;
  
  try {
    // Check if user owns this stock
    const stockQuery = 'SELECT * FROM stock_holdings WHERE user_id = ? AND stock_id = ?';
    const [stockResult] = await db.promise().query(stockQuery, [userId, symbol]);
    
    if (stockResult.length === 0) {
      return res.status(404).json({ error: 'Stock not found in portfolio' });
    }
    
    const currentShares = parseInt(stockResult[0].share_quantity);
    
    if (currentShares < quantity) {
      return res.status(400).json({ error: 'Insufficient shares to sell' });
    }
    
    const totalValue = quantity * price;
    const newShares = currentShares - quantity;
    
    if (newShares === 0) {
      // Remove stock from portfolio
      const deleteStockQuery = 'DELETE FROM stock_holdings WHERE user_id = ? AND stock_id = ?';
      await db.promise().query(deleteStockQuery, [userId, symbol]);
    } else {
      // Update shares
      const updateStockQuery = 'UPDATE stock_holdings SET share_quantity = ? WHERE user_id = ? AND stock_id = ?';
      await db.promise().query(updateStockQuery, [newShares, userId, symbol]);
    }
    
    // Update user balance
    const userQuery = 'SELECT balance FROM users WHERE user_id = ?';
    const [userResult] = await db.promise().query(userQuery, [userId]);
    const currentBalance = parseFloat(userResult[0].balance);
    const newBalance = currentBalance + totalValue;
    
    const updateBalanceQuery = 'UPDATE users SET balance = ? WHERE user_id = ?';
    await db.promise().query(updateBalanceQuery, [newBalance, userId]);
    
    // Insert transaction record
    const insertTransactionQuery = `
      INSERT INTO transactions (user_id, stock_id, transaction_per_stock, transaction_quantity, transaction_type) 
      VALUES (?, ?, ?, ?, 'SELL')`;
    await db.promise().query(insertTransactionQuery, [userId, symbol, price, quantity]);
    
    res.status(200).json({ 
      message: 'Stock sold successfully',
      transaction: {
        type: 'sell',
        symbol,
        quantity,
        price,
        totalValue,
        newBalance
      }
    });
    
  } catch (error) {
    console.error('Sell stock error:', error);
    res.status(500).json({ error: 'Failed to sell stock' });
  }
};

// Get user portfolio
export const getUserPortfolio = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const query = 'SELECT * FROM stock_holdings WHERE user_id = ?';
    const [results] = await db.promise().query(query, [userId]);
    
    res.status(200).json({
      data: results
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
};

// Update user balance
export const updateUserBalance = async (req, res) => {
  const { userId } = req.params;
  const { balance } = req.body;
  
  try {
    const query = 'UPDATE users SET balance = ? WHERE user_id = ?';
    await db.promise().query(query, [balance, userId]);
    
    res.status(200).json({ message: 'Balance updated successfully' });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
};

// Get user transactions
export const getUserTransactions = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const query = `
      SELECT 
        transaction_id,
        stock_id,
        transaction_per_stock,
        transaction_quantity,
        transaction_type,
        transaction_date
      FROM transactions 
      WHERE user_id = ? 
      ORDER BY transaction_date DESC`;
    const [results] = await db.promise().query(query, [userId]);
    
    res.status(200).json({
      data: results
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
