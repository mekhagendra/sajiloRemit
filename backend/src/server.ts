import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import connectDB from './config/db';

// Import routes
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import rateRoutes from './routes/rates';
import reviewRoutes from './routes/reviews';
import blogRoutes from './routes/blogs';
import bankRateRoutes from './routes/bankRates';
import bankRoutes from './routes/banks';
import bannerRoutes from './routes/banners';
import adminRoutes from './routes/admin';
import forexRoutes from './routes/forex';
import statisticsRoutes from './routes/statistics';
import countryRoutes from './routes/countries';
import partnerRoutes from './routes/partners';
import partnerRouteRoutes from './routes/partnerRoutes';
import uploadRoutes from './routes/upload';
import exchangeChartRoutes from './routes/exchangeChart';
import galleryRoutes from './routes/gallery';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Uploads must be served AFTER cors but with cross-origin resource policy
// so the frontend (different port/domain) can load images.
// We re-declare the static route here with CORP overridden to cross-origin,
// which takes precedence over the helmet-protected route registered later.
app.use(
  `/${config.uploadDir}`,
  (_req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); },
  express.static(path.resolve(config.uploadDir))
);

// Rate limiting — skip CORS preflight (OPTIONS) so they don't consume quota
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', limiter);

// Stricter limit for auth endpoints (login/register brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' },
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/bank-rates', bankRateRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/partner-routes', partnerRouteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/exchange-chart', exchangeChartRoutes);
app.use('/api/gallery', galleryRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Daily rate-snapshot scheduler ---
import DailyRateSnapshot from './models/DailyRateSnapshot';
import RemittanceRate from './models/RemittanceRate';
import Vendor from './models/Vendor';
import { VendorStatus } from './types/enums';

async function takeDailySnapshotIfNeeded() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await DailyRateSnapshot.findOne({ date: today });
    if (existing) return; // already taken today

    const approvedVendors = await Vendor.find({ status: VendorStatus.APPROVED }).select('_id');
    const vendorIds = approvedVendors.map((v) => v._id);
    const allRates = await RemittanceRate.find({ vendorId: { $in: vendorIds } });

    const rateEntries = allRates.map((r) => ({
      vendorId: r.vendorId,
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: r.rate,
      unit: r.unit,
      fee: r.fee,
    }));

    await DailyRateSnapshot.create({ date: today, rates: rateEntries });
    console.log(`Daily snapshot saved for ${today} (${rateEntries.length} rates)`);
  } catch (err) {
    console.error('Failed to take daily snapshot:', err);
  }
}

// Start server
const startServer = async () => {
  await connectDB();

  // Take snapshot on startup if not already done today, then every 24 h
  takeDailySnapshotIfNeeded();
  setInterval(takeDailySnapshotIfNeeded, 24 * 60 * 60 * 1000);

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

startServer();

export default app;
