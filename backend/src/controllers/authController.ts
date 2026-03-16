import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/token';
import { UserRole } from '../types/enums';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const user = await User.create({ name, email, password, role: UserRole.USER });
    const token = generateToken(String(user._id));

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ message: 'Account suspended', reason: user.suspendReason });
      return;
    }

    const token = generateToken(String(user._id));
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user!._id, { name }, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleFavoriteVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const user = req.user!;

    const index = user.favoriteVendors.indexOf(vendorId as any);
    if (index > -1) {
      user.favoriteVendors.splice(index, 1);
    } else {
      user.favoriteVendors.push(vendorId as any);
    }

    await user.save();
    res.json({ favoriteVendors: user.favoriteVendors });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
