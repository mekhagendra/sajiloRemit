import { Router } from 'express';
import {
  getExchangeChart,
  updateChartRate,
  takeDailySnapshot,
  listSnapshots,
  getSnapshotByDate,
} from '../controllers/exchangeChartController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

// Admin-only: view chart, update rates, manage snapshots
router.get('/', authenticate, authorize(UserRole.ADMIN), getExchangeChart);
router.put('/rate', authenticate, authorize(UserRole.ADMIN), updateChartRate);
router.post('/snapshot', authenticate, authorize(UserRole.ADMIN), takeDailySnapshot);
router.get('/snapshots', authenticate, authorize(UserRole.ADMIN), listSnapshots);
router.get('/snapshot/:date', authenticate, authorize(UserRole.ADMIN), getSnapshotByDate);

export default router;
