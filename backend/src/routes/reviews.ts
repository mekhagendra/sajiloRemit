import { Router } from 'express';
import { createReview, getVendorReviews, getLatestReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/latest', getLatestReviews);
router.get('/vendor/:vendorId', getVendorReviews);
router.post('/', authenticate, createReview);

export default router;
