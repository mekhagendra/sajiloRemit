import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/enums';
import { config } from '../config';
import { listGallery, uploadToGallery, deleteGalleryFile } from '../controllers/galleryController';

// Separate upload directory: uploads/gallery/
const galleryDir = path.resolve(config.uploadDir, 'gallery');
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, galleryDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp, svg)'));
  }
};

const galleryUpload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// All gallery routes require admin authentication
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', listGallery);
router.post('/upload', galleryUpload.single('file'), uploadToGallery);
router.delete('/:id', deleteGalleryFile);

export default router;
