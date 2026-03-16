import { Router } from 'express';
import {
  getAllRemitters,
  updateRemitterStatus,
  adminCreateRemitter,
  adminGetRemitterRates,
  adminCreateRateForRemitter,
  adminUpdateRateForRemitter,
  adminDeleteRateForRemitter,
  adminToggleRemitterCountry,
  getAllUsers,
  updateUserStatus,
  getAllReviews,
  moderateReview,
  deleteReview,
  getStatistics,
  getAllBlogs,
  getAllEditors,
  createEditor,
  updateEditor,
  deleteEditor,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/remitters', getAllRemitters);
router.post('/remitters', adminCreateRemitter);
router.put('/remitters/:id/status', updateRemitterStatus);
router.get('/remitters/:id/rates', adminGetRemitterRates);
router.post('/remitters/:id/rates', adminCreateRateForRemitter);
router.put('/remitters/:id/rates/:rateId', adminUpdateRateForRemitter);
router.delete('/remitters/:id/rates/:rateId', adminDeleteRateForRemitter);
router.put('/remitters/:id/countries/:code', adminToggleRemitterCountry);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/reviews', getAllReviews);
router.put('/reviews/:id', moderateReview);
router.delete('/reviews/:id', deleteReview);
router.get('/blogs', getAllBlogs);
router.get('/statistics', getStatistics);

// Editor management
router.get('/editors', getAllEditors);
router.post('/editors', createEditor);
router.put('/editors/:id', updateEditor);
router.delete('/editors/:id', deleteEditor);

export default router;
