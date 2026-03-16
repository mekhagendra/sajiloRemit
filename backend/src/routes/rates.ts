import { Router } from 'express';
import { searchRates, getBestRates, addRate, updateRate, getRemitterRates, deleteRate } from '../controllers/rateController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/search', searchRates);
router.get('/best', getBestRates);
router.get('/remitter', authenticate, authorize(UserRole.REMITTER), getRemitterRates);
router.post('/', authenticate, authorize(UserRole.REMITTER), addRate);
router.put('/:id', authenticate, authorize(UserRole.REMITTER), updateRate);
router.delete('/:id', authenticate, authorize(UserRole.REMITTER), deleteRate);

export default router;
