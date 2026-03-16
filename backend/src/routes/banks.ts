import { Router } from 'express';
import { getBanks, createBank, updateBank, deleteBank } from '../controllers/bankController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getBanks);
router.post('/', authenticate, authorize(UserRole.ADMIN), createBank);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateBank);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteBank);

export default router;
