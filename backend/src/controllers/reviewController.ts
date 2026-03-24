import { Request, Response } from 'express';
import Review from '../models/Review';
import Remitter from '../models/Remitter';
import { AuthRequest } from '../middleware/auth';
import { RemitterStatus } from '../types/enums';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { remitterId, rating, text, transactionDate, transactionNumber } = req.body;

    if (!transactionDate || !transactionNumber) {
      res.status(400).json({ message: 'Transaction date and transaction number are required' });
      return;
    }

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

    const reviewData: Record<string, unknown> = {
      userId: req.user!._id,
      remitterId,
      rating,
      text,
      transactionDate,
      transactionNumber,
    };

    if (req.file) {
      reviewData.evidenceUrl = `/uploads/${req.file.filename}`;
    }

    const review = await Review.create(reviewData);

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
      .populate('remitterId', 'legalName')
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
      .populate('remitterId', 'legalName logo')
      .sort({ createdAt: -1 })
      .limit(6);

    const reviews = allReviews.filter((r) => r.userId && r.remitterId);
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ userId: req.user!._id })
      .populate('remitterId', 'legalName logo')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }
    if (review.userId.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const { rating, text, transactionDate, transactionNumber } = req.body;

    if (rating) review.rating = rating;
    if (text) review.text = text;
    if (transactionDate) review.transactionDate = transactionDate;
    if (transactionNumber) review.transactionNumber = transactionNumber;
    if (req.file) {
      review.evidenceUrl = `/uploads/${req.file.filename}`;
    }

    // Reset approval — admin must re-approve edited reviews
    review.isApproved = false;

    await review.save();

    const populated = await Review.findById(review._id)
      .populate('remitterId', 'legalName logo');

    res.json({ review: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
