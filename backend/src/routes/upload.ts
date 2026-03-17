import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserRole } from '../types/enums';

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
    // URL is always under the /uploads static mount point — independent of the disk path in config.uploadDir
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  }
);

export default router;
