import { Router } from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getBanners);
router.post('/', authenticate, authorize(UserRole.ADMIN), createBanner);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateBanner);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteBanner);

export default router;
