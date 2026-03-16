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

// Admin + Editor: view chart, update rates, manage snapshots
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), getExchangeChart);
router.put('/rate', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), updateChartRate);
router.post('/snapshot', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), takeDailySnapshot);
router.get('/snapshots', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), listSnapshots);
router.get('/snapshot/:date', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), getSnapshotByDate);

export default router;
