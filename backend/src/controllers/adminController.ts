import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Remitter from '../models/Remitter';
import Review from '../models/Review';
import Blog from '../models/Blog';
import RemittanceRate from '../models/RemittanceRate';
import Bank from '../models/Bank';
import { AuthRequest } from '../middleware/auth';
import { RemitterStatus, UserStatus, UserRole } from '../types/enums';

// Remitter management
export const getAllRemitters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const remitters = await Remitter.find().populate('userId', 'name email');
    res.json({ remitters });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRemitterStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!Object.values(RemitterStatus).includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const remitter = await Remitter.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    res.json({ remitter });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateRemitter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, brandName, legalName, baseCountry, supportedCountries, phone, website, description, logo } = req.body;

    if (!name || !email || !legalName) {
      res.status(400).json({ message: 'name, email and legalName are required' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const tempPassword = password || crypto.randomBytes(8).toString('hex');

    const user = new User({ name, email, password: tempPassword, role: UserRole.REMITTER, status: UserStatus.ACTIVE });
    await user.save();

    try {
      const remitter = new Remitter({
        userId: user._id,
        brandName: brandName || '',
        legalName,
        baseCountry: baseCountry || '',
        supportedCountries: supportedCountries || [],
        email,
        phone: phone || '',
        website: website || '',
        description: description || '',
        logo: logo || '',
        status: RemitterStatus.APPROVED,
      });
      await remitter.save();

      res.status(201).json({ remitter, tempPassword: password ? undefined : tempPassword });
    } catch (remitterError) {
      // Roll back the user if remitter creation fails
      await User.findByIdAndDelete(user._id);
      throw remitterError;
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminGetRemitterRates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findById(req.params.id);
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }
    const rates = await RemittanceRate.find({ remitterId: remitter._id }).sort({ fromCurrency: 1, toCurrency: 1 });
    res.json({ rates });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateRateForRemitter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findById(req.params.id);
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    const { fromCurrency, toCurrency, rate, unit, fee } = req.body;
    if (!fromCurrency || !toCurrency || rate === undefined) {
      res.status(400).json({ message: 'fromCurrency, toCurrency and rate are required' });
      return;
    }

    const existingRate = await RemittanceRate.findOneAndUpdate(
      { remitterId: remitter._id, fromCurrency: fromCurrency.toUpperCase(), toCurrency: toCurrency.toUpperCase() },
      { rate, unit: unit || 1, fee: fee || 0 },
      { new: true, upsert: true }
    );

    res.status(201).json({ rate: existingRate });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateRateForRemitter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rate, unit, fee } = req.body;
    const existingRate = await RemittanceRate.findOneAndUpdate(
      { _id: req.params.rateId, remitterId: req.params.id },
      { rate, unit, fee },
      { new: true }
    );
    if (!existingRate) {
      res.status(404).json({ message: 'Rate not found' });
      return;
    }
    res.json({ rate: existingRate });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminDeleteRateForRemitter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await RemittanceRate.findOneAndDelete({ _id: req.params.rateId, remitterId: req.params.id });
    if (!deleted) {
      res.status(404).json({ message: 'Rate not found' });
      return;
    }
    res.json({ message: 'Rate deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateRemitterProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findById(req.params.id);
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    const allowedFields = ['brandName', 'legalName', 'baseCountry', 'phone', 'website', 'remittanceUrl', 'description', 'logo'] as const;
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Remitter.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('userId', 'name email');
    res.json({ remitter: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminToggleRemitterCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findById(req.params.id);
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    const entry = remitter.supportedCountries.find((c) => c.countryCode === (req.params.code as string).toUpperCase());
    if (!entry) {
      res.status(404).json({ message: 'Country not found on this remitter' });
      return;
    }

    entry.isActive = req.body.isActive ?? !entry.isActive;
    await remitter.save();
    res.json({ remitter });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// User management
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, suspendReason } = req.body;
    if (!Object.values(UserStatus).includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const updates: any = { status };
    if (status === UserStatus.SUSPENDED && suspendReason) {
      updates.suspendReason = suspendReason;
    } else {
      updates.suspendReason = undefined;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Review moderation
export const getAllReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find()
      .populate('userId', 'name email')
      .populate('remitterId', 'brandName legalName')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const moderateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }
    res.json({ review });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Blog management
export const getAllBlogs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json({ blogs });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// Editor management
export const getAllEditors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const editors = await User.find({ role: UserRole.EDITOR }).select('-password');
    res.json({ editors });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createEditor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'name, email and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
    const editor = new User({ name, email, password, role: UserRole.EDITOR, status: UserStatus.ACTIVE });
    await editor.save();
    res.status(201).json({ editor });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateEditor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, password, status } = req.body;
    const editor = await User.findOne({ _id: req.params.id, role: UserRole.EDITOR });
    if (!editor) {
      res.status(404).json({ message: 'Editor not found' });
      return;
    }
    if (name) editor.name = name;
    if (status && Object.values(UserStatus).includes(status)) editor.status = status;
    if (password) {
      if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters' });
        return;
      }
      editor.password = password;
    }
    await editor.save();
    const { password: _pw, ...safe } = editor.toJSON() as any;
    void _pw;
    res.json({ editor: safe });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEditor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const editor = await User.findOneAndDelete({ _id: req.params.id, role: UserRole.EDITOR });
    if (!editor) {
      res.status(404).json({ message: 'Editor not found' });
      return;
    }
    res.json({ message: 'Editor deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// Statistics
export const getStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [remitterCount, userCount, bankCount, countryResult] = await Promise.all([
      Remitter.countDocuments({ status: RemitterStatus.APPROVED }),
      User.countDocuments(),
      Bank.countDocuments(),
      RemittanceRate.distinct('fromCurrency'),
    ]);

    res.json({
      statistics: {
        countries: countryResult.length,
        remitters: remitterCount,
        banks: bankCount,
        users: userCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
