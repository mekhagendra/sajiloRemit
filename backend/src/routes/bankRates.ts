import { Router } from 'express';
import { getBankRates, getFeaturedBankRates, createBankRate, updateBankRate, deleteBankRate } from '../controllers/bankRateController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getBankRates);
router.get('/featured', getFeaturedBankRates);
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), createBankRate);
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), updateBankRate);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.EDITOR), deleteBankRate);

export default router;
