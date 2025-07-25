import { registerRoutes } from '../server/routes';
import express from 'express';
import cors from 'cors';

const app = express();

// Configure CORS for Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://fixinguru-petty-cash.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Configure Express
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add trust proxy for Vercel
app.set('trust proxy', 1);

// Register all routes
registerRoutes(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;