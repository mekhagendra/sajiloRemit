import { Router } from 'express';
import {
  getPartners,
  adminGetPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from '../controllers/partnerController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getPartners);
router.get('/all', authenticate, authorize(UserRole.ADMIN), adminGetPartners);
router.post('/', authenticate, authorize(UserRole.ADMIN), createPartner);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updatePartner);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deletePartner);

export default router;
