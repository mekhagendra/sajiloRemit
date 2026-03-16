import { Router } from 'express';
import { register, login, getMe, updateProfile, toggleFavoriteVendor } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/favorites/:vendorId', authenticate, toggleFavoriteVendor);

export default router;
