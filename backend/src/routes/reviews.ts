import { Router } from 'express';
import { createReview, getRemitterReviews, getLatestReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/latest', getLatestReviews);
router.get('/remitter/:remitterId', getRemitterReviews);
router.post('/', authenticate, createReview);

export default router;
