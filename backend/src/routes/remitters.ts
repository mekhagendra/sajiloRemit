import { Router } from 'express';
import { registerRemitter, getRemitters, getRemitterById, updateRemitter, getMyRemitterProfile, updateRemitterCountries, removeRemitterCountry } from '../controllers/remitterController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getRemitters);
router.get('/me', authenticate, authorize(UserRole.REMITTER), getMyRemitterProfile);
router.get('/:id', getRemitterById);
router.post('/', authenticate, registerRemitter);
router.put('/', authenticate, authorize(UserRole.REMITTER), updateRemitter);
router.put('/countries/upsert', authenticate, authorize(UserRole.REMITTER), updateRemitterCountries);
router.delete('/countries/:code', authenticate, authorize(UserRole.REMITTER), removeRemitterCountry);

export default router;
