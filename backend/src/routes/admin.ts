import { Router } from 'express';
import {
  getAllVendors,
  updateVendorStatus,
  adminCreateAgent,
  adminGetVendorRates,
  adminCreateRateForVendor,
  adminUpdateRateForVendor,
  adminDeleteRateForVendor,
  adminToggleVendorCountry,
  getAllUsers,
  updateUserStatus,
  getAllReviews,
  moderateReview,
  deleteReview,
  getStatistics,
  getAllBlogs,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/vendors', getAllVendors);
router.post('/vendors', adminCreateAgent);
router.put('/vendors/:id/status', updateVendorStatus);
router.get('/vendors/:id/rates', adminGetVendorRates);
router.post('/vendors/:id/rates', adminCreateRateForVendor);
router.put('/vendors/:id/rates/:rateId', adminUpdateRateForVendor);
router.delete('/vendors/:id/rates/:rateId', adminDeleteRateForVendor);
router.put('/vendors/:id/countries/:code', adminToggleVendorCountry);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/reviews', getAllReviews);
router.put('/reviews/:id', moderateReview);
router.delete('/reviews/:id', deleteReview);
router.get('/blogs', getAllBlogs);
router.get('/statistics', getStatistics);

export default router;
