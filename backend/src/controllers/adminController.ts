import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Vendor from '../models/Vendor';
import Review from '../models/Review';
import Blog from '../models/Blog';
import RemittanceRate from '../models/RemittanceRate';
import BankInterestRate from '../models/BankInterestRate';
import { AuthRequest } from '../middleware/auth';
import { VendorStatus, UserStatus, UserRole } from '../types/enums';

// Vendor management
export const getAllVendors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vendors = await Vendor.find().populate('userId', 'name email');
    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVendorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!Object.values(VendorStatus).includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateAgent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, companyName, baseCountry, supportedCountries, phone, website, description, logo } = req.body;

    if (!name || !email || !companyName) {
      res.status(400).json({ message: 'name, email and companyName are required' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const tempPassword = password || crypto.randomBytes(8).toString('hex');

    const user = new User({ name, email, password: tempPassword, role: UserRole.VENDOR, status: UserStatus.ACTIVE });
    await user.save();

    const vendor = new Vendor({
      userId: user._id,
      companyName,
      baseCountry: baseCountry || '',
      supportedCountries: supportedCountries || [],
      email,
      phone: phone || '',
      website: website || '',
      description: description || '',
      logo: logo || '',
      status: VendorStatus.APPROVED,
    });
    await vendor.save();

    res.status(201).json({ vendor, tempPassword: password ? undefined : tempPassword });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminGetVendorRates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    const rates = await RemittanceRate.find({ vendorId: vendor._id }).sort({ fromCurrency: 1, toCurrency: 1 });
    res.json({ rates });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateRateForVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const { fromCurrency, toCurrency, rate, unit, fee } = req.body;
    if (!fromCurrency || !toCurrency || rate === undefined) {
      res.status(400).json({ message: 'fromCurrency, toCurrency and rate are required' });
      return;
    }

    const existingRate = await RemittanceRate.findOneAndUpdate(
      { vendorId: vendor._id, fromCurrency: fromCurrency.toUpperCase(), toCurrency: toCurrency.toUpperCase() },
      { rate, unit: unit || 1, fee: fee || 0 },
      { new: true, upsert: true }
    );

    res.status(201).json({ rate: existingRate });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateRateForVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rate, unit, fee } = req.body;
    const existingRate = await RemittanceRate.findOneAndUpdate(
      { _id: req.params.rateId, vendorId: req.params.id },
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

export const adminDeleteRateForVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await RemittanceRate.findOneAndDelete({ _id: req.params.rateId, vendorId: req.params.id });
    if (!deleted) {
      res.status(404).json({ message: 'Rate not found' });
      return;
    }
    res.json({ message: 'Rate deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminToggleVendorCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const entry = vendor.supportedCountries.find((c) => c.countryCode === (req.params.code as string).toUpperCase());
    if (!entry) {
      res.status(404).json({ message: 'Country not found on this vendor' });
      return;
    }

    entry.isActive = req.body.isActive ?? !entry.isActive;
    await vendor.save();
    res.json({ vendor });
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
      .populate('vendorId', 'companyName')
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

// Statistics
export const getStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [vendorCount, userCount, bankCount, countryResult] = await Promise.all([
      Vendor.countDocuments({ status: VendorStatus.APPROVED }),
      User.countDocuments(),
      BankInterestRate.distinct('bankName').then((names) => names.length),
      RemittanceRate.distinct('fromCurrency'),
    ]);

    res.json({
      statistics: {
        countries: countryResult.length,
        vendors: vendorCount,
        banks: bankCount,
        users: userCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
