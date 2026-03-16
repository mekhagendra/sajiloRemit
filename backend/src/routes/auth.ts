import { Router } from 'express';
import { register, login, getMe, updateProfile, toggleFavoriteRemitter, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.post('/favorites/:remitterId', authenticate, toggleFavoriteRemitter);

export default router;
