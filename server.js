import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToSF } from './server/config/salesforce.js';

import authRoutes from './server/routes/authRoutes.js';
import studentRoutes from './server/routes/studentRoutes.js';
import menuRoutes from './server/routes/menuRoutes.js';
import tokenRoutes from './server/routes/tokenRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';
import { errorHandler } from './server/middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectToSF();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to Salesforce connection error:', error);
  }
};

startServer();
