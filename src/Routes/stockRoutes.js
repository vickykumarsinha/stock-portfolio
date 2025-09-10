import express from 'express';
import { buyStock, sellStock, getUserPortfolio, updateUserBalance, getUserTransactions } from '../Controller/stockController.js';

const router = express.Router();

// Buy stock
router.post('/buy', buyStock);

// Sell stock
router.post('/sell', sellStock);

// Get user portfolio
router.get('/portfolio/:userId', getUserPortfolio);

// Get user transactions
router.get('/transactions/:userId', getUserTransactions);

// Update user balance
router.put('/balance/:userId', updateUserBalance);

export default router;
