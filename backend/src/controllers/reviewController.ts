import { Request, Response } from 'express';
import Review from '../models/Review';
import Vendor from '../models/Vendor';
import { AuthRequest } from '../middleware/auth';
import { VendorStatus } from '../types/enums';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vendorId, rating, text } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.status !== VendorStatus.APPROVED) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const existingReview = await Review.findOne({ userId: req.user!._id, vendorId });
    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this vendor' });
      return;
    }

    const review = await Review.create({
      userId: req.user!._id,
      vendorId,
      rating,
      text,
    });

    res.status(201).json({ review });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVendorReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const reviews = await Review.find({ vendorId, isApproved: true })
      .populate('userId', 'name')
      .populate('vendorId', 'companyName')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLatestReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .populate('userId', 'name')
      .populate('vendorId', 'companyName logo')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
