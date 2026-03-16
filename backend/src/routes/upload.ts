import { Router, Request, Response } from 'express';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserRole } from '../types/enums';
import { config } from '../config';

const router = Router();

// POST /api/upload — admin only, single image field named "image"
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  upload.single('image'),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const relativePath = path.join(config.uploadDir, req.file.filename).replace(/\\/g, '/');
    res.status(201).json({ url: `/${relativePath}` });
  }
);

export default router;
