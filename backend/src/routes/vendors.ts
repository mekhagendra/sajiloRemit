import { Router } from 'express';
import { registerVendor, getVendors, getVendorById, updateVendor, getMyVendorProfile, updateVendorCountries, removeVendorCountry } from '../controllers/vendorController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getVendors);
router.get('/me', authenticate, authorize(UserRole.VENDOR), getMyVendorProfile);
router.get('/:id', getVendorById);
router.post('/', authenticate, registerVendor);
router.put('/', authenticate, authorize(UserRole.VENDOR), updateVendor);
router.put('/countries/upsert', authenticate, authorize(UserRole.VENDOR), updateVendorCountries);
router.delete('/countries/:code', authenticate, authorize(UserRole.VENDOR), removeVendorCountry);

export default router;
