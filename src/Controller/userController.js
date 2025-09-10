import db from '../../server.js';  // make sure you import your db connection

export const getUserByID = (req, res) => {
  const user_id = req.params.id;
  const query = `SELECT user_name, email, balance, investment, profit_loss FROM users WHERE user_id = ?`;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      data: results[0]
    });
  });
};

export const getStocksByUserID = (req, res) => {
  const user_id = req.params.id;
  const query = `SELECT * FROM stock_holdings WHERE user_id = ?`;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching stocks:', err);
      return res.status(500).json({ error: 'Failed to retrieve stocks' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No stocks found for this user' });
    }

    res.status(200).json({
      data: results,
      count: results.length
    });
  });
};
