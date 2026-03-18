import { Request, Response } from 'express';
import Review from '../models/Review';
import Remitter from '../models/Remitter';
import { AuthRequest } from '../middleware/auth';
import { RemitterStatus } from '../types/enums';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { remitterId, rating, text } = req.body;

    const remitter = await Remitter.findById(remitterId);
    if (!remitter || remitter.status !== RemitterStatus.APPROVED) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    const existingReview = await Review.findOne({ userId: req.user!._id, remitterId });
    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this remitter' });
      return;
    }

    const review = await Review.create({
      userId: req.user!._id,
      remitterId,
      rating,
      text,
    });

    res.status(201).json({ review });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRemitterReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { remitterId } = req.params;
    const reviews = await Review.find({ remitterId, isApproved: true })
      .populate('userId', 'name')
      .populate('remitterId', 'companyName')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLatestReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const allReviews = await Review.find({ isApproved: true })
      .populate('userId', 'name')
      .populate('remitterId', 'companyName logo')
      .sort({ createdAt: -1 })
      .limit(6);

    const reviews = allReviews.filter((r) => r.userId && r.remitterId);
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
