import { Request, Response } from 'express';
import Remitter from '../models/Remitter';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { RemitterStatus, UserRole } from '../types/enums';

export const registerRemitter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { brandName, legalName, baseCountry, email, phone, website, description, logo } = req.body;

    const existingRemitter = await Remitter.findOne({ userId: req.user!._id });
    if (existingRemitter) {
      res.status(400).json({ message: 'Remitter profile already exists' });
      return;
    }

    const remitter = await Remitter.create({
      userId: req.user!._id,
      brandName,
      legalName,
      baseCountry,
      supportedCountries: [],
      email,
      phone,
      website,
      description,
      logo,
    });

    // Update user role to remitter
    const updatedUser = await User.findByIdAndUpdate(req.user!._id, { role: UserRole.REMITTER }, { new: true });

    res.status(201).json({ remitter, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRemitters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { country, status } = req.query;
    const filter: any = {};

    if (country) filter.baseCountry = country;
    if (status) {
      filter.status = status;
    } else {
      filter.status = RemitterStatus.APPROVED;
    }

    const remitters = await Remitter.find(filter).populate('userId', 'name email');
    res.json({ remitters });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRemitterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findById(req.params.id).populate('userId', 'name email');
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }
    res.json({ remitter });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRemitter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findOne({ userId: req.user!._id });
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    const allowedFields = ['brandName', 'legalName', 'phone', 'website', 'description', 'logo'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    // supportedCountries updated via dedicated endpoint; omit here to avoid overwriting isActive flags

    const updated = await Remitter.findByIdAndUpdate(remitter._id, updates, { new: true });
    res.json({ remitter: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyRemitterProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findOne({ userId: req.user!._id });
    if (!remitter) {
      res.status(404).json({ message: 'No remitter profile found' });
      return;
    }
    res.json({ remitter });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRemitterCountries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findOne({ userId: req.user!._id });
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    // Merge new entry or update existing — preserve isActive set by admin
    const { countryCode, canSend, canReceive } = req.body;
    if (!countryCode) {
      res.status(400).json({ message: 'countryCode is required' });
      return;
    }

    const existing = remitter.supportedCountries.find((c) => c.countryCode === countryCode.toUpperCase());
    if (existing) {
      existing.canSend    = canSend    ?? existing.canSend;
      existing.canReceive = canReceive ?? existing.canReceive;
    } else {
      remitter.supportedCountries.push({ countryCode: countryCode.toUpperCase(), canSend: !!canSend, canReceive: !!canReceive, isActive: false });
    }

    await remitter.save();
    res.json({ remitter });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeRemitterCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remitter = await Remitter.findOne({ userId: req.user!._id });
    if (!remitter) {
      res.status(404).json({ message: 'Remitter not found' });
      return;
    }

    remitter.supportedCountries = remitter.supportedCountries.filter(
      (c) => c.countryCode !== (req.params.code as string).toUpperCase()
    );
    await remitter.save();
    res.json({ remitter });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
