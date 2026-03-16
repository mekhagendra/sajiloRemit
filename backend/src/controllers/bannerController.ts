import { Request, Response } from 'express';
import Banner from '../models/Banner';
import { AuthRequest } from '../middleware/auth';

export const getBanners = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position } = req.query;
    const filter: any = { isActive: true };
    if (position) filter.position = position;

    const banners = await Banner.find(filter).sort({ createdAt: -1 });
    res.json({ banners });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, imageUrl, linkUrl, position, isActive } = req.body;
    const banner = await Banner.create({ title, imageUrl, linkUrl, position, isActive });
    res.status(201).json({ banner });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) {
      res.status(404).json({ message: 'Banner not found' });
      return;
    }
    res.json({ banner });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      res.status(404).json({ message: 'Banner not found' });
      return;
    }
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
