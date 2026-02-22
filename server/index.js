/**
 * AI Agents Forum Infrastructure Engine - Backend Server
 * Express API with PostgreSQL, JWT auth, admin dashboard support
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { apiRouter } from './routes/api.js';
import { assessmentsRouter } from './routes/assessments.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Production security check
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set. Set it to a secure random string in production.');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (frontend + admin dashboard)
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', assessmentsRouter);
app.use('/api', apiRouter);

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Agents Forum API running on port ${PORT}`);
});
