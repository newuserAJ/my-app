import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';

// Load environment variables
config();

import { logger } from './config/logger';
import { appPort, initializeSupabase, checkSupabaseHealth } from './config/supabase';
import { 
  errorHandler, 
  notFoundHandler, 
  handleUnhandledRejection, 
  handleUncaughtException,
  asyncHandler 
} from './middleware/errorHandler';
import { sanitizeRequest } from './utils/validation';
import { requireAuth } from './middleware/auth';
import { 
  generalRateLimit, 
  authRateLimit, 
  createContentRateLimit 
} from './middleware/rateLimiting';
import { 
  securityHeaders, 
  suspiciousRequestDetector, 
  validateUserAgent,
  contentSecurityPolicy,
  securityLogger,
  honeypot,
  enforceApiVersion 
} from './middleware/security';
import { authRouter } from './routes/auth';
import { postsRouter } from './routes/posts';
import { commentsRouter } from './routes/comments';
import { usersRouter } from './routes/users';
import { categoriesRouter } from './routes/categories';
import { tagsRouter } from './routes/tags';

// Handle process events
handleUnhandledRejection();
handleUncaughtException();

const app = express();

// Trust proxy (important for rate limiting and getting real IP addresses)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
};

app.use(cors(corsOptions));

// Security middleware
app.use(securityHeaders);
app.use(contentSecurityPolicy);
app.use(securityLogger);
app.use(validateUserAgent);
app.use(suspiciousRequestDetector);
app.use(enforceApiVersion(['v1']));
app.use(honeypot('/admin'));

// Rate limiting
app.use(generalRateLimit);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(sanitizeRequest);

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string): void => {
      logger.info(message.trim());
    },
  },
}));

// Request ID middleware for tracing
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// API Routes with specific rate limiting
app.use('/api/auth', authRateLimit, authRouter);
app.use('/api/posts', createContentRateLimit, postsRouter);
app.use('/api/comments', createContentRateLimit, commentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/supabase', asyncHandler(async (_req, res) => {
  const healthCheck = await checkSupabaseHealth();
  
  if (!healthCheck.healthy) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not healthy',
      error: healthCheck.error,
    });
  }
  
  return res.json({
    success: true,
    message: 'Supabase is healthy',
  });
}));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'My App Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Protected route example
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user!.id,
        email: req.user!.email,
        firstName: req.user!.user_metadata?.firstName,
        lastName: req.user!.user_metadata?.lastName,
        emailConfirmed: req.user!.email_confirmed_at !== null,
      },
    },
  });
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Server startup
const startServer = async (): Promise<void> => {
  try {
    // Initialize Supabase connection
    await initializeSupabase();
    
    // Ensure logs directory exists
    const fs = await import('fs');
    const path = await import('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Start server
    app.listen(appPort, () => {
      logger.info(`🚀 Server running on port ${appPort}`, {
        port: appPort,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;