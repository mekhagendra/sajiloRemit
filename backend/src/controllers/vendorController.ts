import { Request, Response } from 'express';
import Vendor from '../models/Vendor';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { VendorStatus, UserRole } from '../types/enums';

export const registerVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyName, baseCountry, email, phone, website, description, logo } = req.body;

    const existingVendor = await Vendor.findOne({ userId: req.user!._id });
    if (existingVendor) {
      res.status(400).json({ message: 'Vendor profile already exists' });
      return;
    }

    const vendor = await Vendor.create({
      userId: req.user!._id,
      companyName,
      baseCountry,
      supportedCountries: [],
      email,
      phone,
      website,
      description,
      logo,
    });

    // Update user role to vendor
    await User.findByIdAndUpdate(req.user!._id, { role: UserRole.VENDOR });

    res.status(201).json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVendors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { country, status } = req.query;
    const filter: any = {};

    if (country) filter.baseCountry = country;
    if (status) {
      filter.status = status;
    } else {
      filter.status = VendorStatus.APPROVED;
    }

    const vendors = await Vendor.find(filter).populate('userId', 'name email');
    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('userId', 'name email');
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const allowedFields = ['companyName', 'phone', 'website', 'description', 'logo'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    // supportedCountries updated via dedicated endpoint; omit here to avoid overwriting isActive flags

    const updated = await Vendor.findByIdAndUpdate(vendor._id, updates, { new: true });
    res.json({ vendor: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'No vendor profile found' });
      return;
    }
    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVendorCountries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    // Merge new entry or update existing — preserve isActive set by admin
    const { countryCode, canSend, canReceive } = req.body;
    if (!countryCode) {
      res.status(400).json({ message: 'countryCode is required' });
      return;
    }

    const existing = vendor.supportedCountries.find((c) => c.countryCode === countryCode.toUpperCase());
    if (existing) {
      existing.canSend    = canSend    ?? existing.canSend;
      existing.canReceive = canReceive ?? existing.canReceive;
    } else {
      vendor.supportedCountries.push({ countryCode: countryCode.toUpperCase(), canSend: !!canSend, canReceive: !!canReceive, isActive: false });
    }

    await vendor.save();
    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeVendorCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    vendor.supportedCountries = vendor.supportedCountries.filter(
      (c) => c.countryCode !== (req.params.code as string).toUpperCase()
    );
    await vendor.save();
    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
