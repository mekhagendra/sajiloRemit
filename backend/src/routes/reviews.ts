import { Router } from 'express';
import { createReview, getRemitterReviews, getLatestReviews, getUserReviews, updateReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/latest', getLatestReviews);
router.get('/my', authenticate, getUserReviews);
router.get('/remitter/:remitterId', getRemitterReviews);
router.post('/', authenticate, upload.single('evidence'), createReview);
router.put('/:id', authenticate, upload.single('evidence'), updateReview);

export default router;
