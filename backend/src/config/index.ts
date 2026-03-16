import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sajiloremit',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_dev_only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
};
