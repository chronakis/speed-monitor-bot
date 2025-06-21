import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';

// Routes
import healthRoutes from './routes/health';
import hereRoutes from './routes/here';
import testRoutes from './routes/test';
import configRoutes from './routes/config';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all requests
app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check (no auth required)
app.use('/health', healthRoutes);

// Test routes (no auth required)
app.use('/test', testRoutes);

// API routes - Note: Authentication is now handled by Supabase in frontend
// These routes can implement their own token verification if needed
app.use('/api/here', hereRoutes);
app.use('/api/config', configRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Traffic Flow Bot API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      here: '/api/here',
      config: '/api/config',
    },
    note: 'Authentication is handled by Supabase directly in the frontend'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app; 