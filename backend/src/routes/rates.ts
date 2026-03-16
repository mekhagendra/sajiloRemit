import { Router } from 'express';
import { searchRates, getBestRates, addRate, updateRate, getVendorRates, deleteRate } from '../controllers/rateController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/search', searchRates);
router.get('/best', getBestRates);
router.get('/vendor', authenticate, authorize(UserRole.VENDOR), getVendorRates);
router.post('/', authenticate, authorize(UserRole.VENDOR), addRate);
router.put('/:id', authenticate, authorize(UserRole.VENDOR), updateRate);
router.delete('/:id', authenticate, authorize(UserRole.VENDOR), deleteRate);

export default router;
