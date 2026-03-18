import { Request, Response } from 'express';
import Bank from '../models/Bank';
import { AuthRequest } from '../middleware/auth';

export const getBanks = async (req: Request, res: Response): Promise<void> => {
  try {
    const banks = await Bank.find().sort({ name: 1 });
    res.json({ banks });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBank = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, website, country } = req.body;
    const bank = await Bank.create({ name, website, country });
    res.status(201).json({ bank });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'A bank with this name already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBank = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, website, country } = req.body;
    const bank = await Bank.findByIdAndUpdate(
      req.params.id,
      { name, website, country },
      { new: true, runValidators: true }
    );
    if (!bank) {
      res.status(404).json({ message: 'Bank not found' });
      return;
    }
    res.json({ bank });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'A bank with this name already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBank = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bank = await Bank.findByIdAndDelete(req.params.id);
    if (!bank) {
      res.status(404).json({ message: 'Bank not found' });
      return;
    }
    res.json({ message: 'Bank deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
