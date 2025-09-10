//import getUserByID from '../Controller/userController.js';
import { getUserByID, getStocksByUserID } from '../Controller/userController.js';

//import getStocksByUserID from '../Controller/userController.js';
import express from 'express';
const router = express.Router();

router.get('/:id', getUserByID);
router.get('/:id/stocks', getStocksByUserID);


export default router;