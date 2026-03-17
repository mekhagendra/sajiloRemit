import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import GalleryFile from '../models/GalleryFile';
import { config } from '../config';

/**
 * GET /api/gallery
 * List gallery files (admin only). Supports pagination and optional search.
 */
export const listGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 40));
    const skip = (page - 1) * limit;
    const search = (req.query.search as string || '').trim();

    const filter = search
      ? { originalName: { $regex: search, $options: 'i' } }
      : {};

    const [files, total] = await Promise.all([
      GalleryFile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      GalleryFile.countDocuments(filter),
    ]);

    // Always derive the URL from the stored filename so that old records with a
    // stale filesystem path (e.g. //var/www/sajiloRemit-uploads/gallery/…) are
    // returned with the canonical /uploads/gallery/<filename> URL.
    const normalized = files.map(f => {
      const obj = f.toObject();
      obj.url = `/uploads/gallery/${f.filename}`;
      return obj;
    });

    res.json({ files: normalized, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/gallery/upload
 * Upload a file to the gallery (admin only).
 * Uses the multer middleware attached in the route.
 */
export const uploadToGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }

    // URL is always under the /uploads static mount point — independent of the disk path in config.uploadDir
    const url = `/uploads/gallery/${req.file.filename}`;

    const doc = await GalleryFile.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url,
      uploadedBy: req.user!._id,
    });

    res.status(201).json({ file: doc });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/gallery/:id
 * Delete a gallery file record and its physical file (admin only).
 */
export const deleteGalleryFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await GalleryFile.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Remove physical file
    const filePath = path.resolve(config.uploadDir, 'gallery', doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'File deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
