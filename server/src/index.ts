import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { initDatabase } from './config/database.js';
import { errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

const app = express();

// Middleware — CORS_ORIGIN 支持逗号分隔的多个域名
const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    // 允许无 origin（curl / 移动端）或在白名单中
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize database then start server
initDatabase()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

export default app;
