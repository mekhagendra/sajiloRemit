import { Router } from 'express';
import { getStatistics } from '../controllers/adminController';

const router = Router();

// Public statistics endpoint - no auth required
router.get('/', getStatistics);

export default router;
