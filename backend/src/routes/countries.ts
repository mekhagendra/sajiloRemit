import { Router } from 'express';
import {
  getCountries,
  adminGetCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from '../controllers/countryController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getCountries);
router.get('/all', authenticate, authorize(UserRole.ADMIN), adminGetCountries);
router.post('/', authenticate, authorize(UserRole.ADMIN), createCountry);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateCountry);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteCountry);

export default router;
