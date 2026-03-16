import { Router } from 'express';
import {
  getPartnerRoutes,
  adminGetPartnerRoutes,
  createPartnerRoute,
  updatePartnerRoute,
  deletePartnerRoute,
} from '../controllers/partnerRouteController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getPartnerRoutes);
router.get('/all', authenticate, authorize(UserRole.ADMIN), adminGetPartnerRoutes);
router.post('/', authenticate, authorize(UserRole.ADMIN), createPartnerRoute);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updatePartnerRoute);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deletePartnerRoute);

export default router;
