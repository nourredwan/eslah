import express from 'express';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(
  helmet({
    // Enable HSTS only when the public client URL is HTTPS; loopback HTTP
    // must stay HTTP so browsers can load the app's own JS and CSS assets.
    strictTransportSecurity: env.CLIENT_URL.startsWith('https://')
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
        // TLS is terminated by the hosting proxy; don't rewrite localhost HTTP assets to HTTPS.
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  env.CLIENT_URL,
  ...(process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean),
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or from allowed origins
      const localOrigin = origin && /^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(:\d+)?$/.test(origin);
      if (!origin || allowedOrigins.includes(origin) || localOrigin) {
        callback(null, true);
      } else {
        callback(new Error('غير مسموح بهذا النطاق بواسطة سياسة CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request body parsers with strict size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'database_offline';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbStatus,
  });
});

// Root welcome message
app.get('/', (_req, res) => {
  if (env.NODE_ENV === 'production') {
    return res.sendFile(path.resolve(process.cwd(), '../dist/index.html'));
  }
  res.json({
    name: 'Community Problem Reporting Platform API',
    version: '1.0.0',
    documentation: '/api/docs',
    status: 'online',
  });
});

// Register all API routes
app.use('/api', apiRoutes);

if (env.NODE_ENV === 'production') {
  const frontendPath = path.resolve(process.cwd(), '../dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Fallback 404 for unmatched API routes
app.all('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'المسار غير موجود' });
});

// Centralized error handler
app.use(errorHandler);

const PORT = parseInt(env.PORT, 10) || 5000;

app.listen(PORT, () => {
  console.log(`🚀 خادم منصة إصلاح يعمل بنجاح على: http://localhost:${PORT}`);
  console.log(`🛡️ وضع الأمان: ${env.NODE_ENV} | التشفير والحماية: مفعلة`);
});

export default app;
