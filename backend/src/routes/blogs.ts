import { Router } from 'express';
import { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog } from '../controllers/blogController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.post('/', authenticate, authorize(UserRole.ADMIN), createBlog);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateBlog);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteBlog);

export default router;
