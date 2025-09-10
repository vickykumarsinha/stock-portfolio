
import express from 'express';
import mysql2 from 'mysql2';
const app = express();
app.use(express.json());
import dotenv from 'dotenv';
import userRoutes from './src/Routes/userRoutes.js';
import stockRoutes from './src/Routes/stockRoutes.js';
import cors from 'cors';
app.use(cors({
    origin: 'http://localhost:5173', // Adjust this to your frontend's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
dotenv.config();
const PORT = 3000;
  
const db = mysql2.createConnection({
    host: process.env.HOST,
    port: process.env.DB_PORT || 3306,
    user: 'root',
    password: process.env.PASSWORD,   
    database: process.env.USER_DB  
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);   
});


app.use('/users', userRoutes);
app.use('/stocks', stockRoutes);

export default db;

