import { Request, Response } from 'express';
import Country from '../models/Country';
import { AuthRequest } from '../middleware/auth';

export const getCountries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query; // 'send' | 'receive' | undefined (all)
    const filter: Record<string, unknown> = { isActive: true };
    if (type === 'send') filter.isSendCountry = true;
    else if (type === 'receive') filter.isReceiveCountry = true;
    const countries = await Country.find(filter).sort({ name: 1 });
    res.json({ countries });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminGetCountries = async (_req: Request, res: Response): Promise<void> => {
  try {
    const countries = await Country.find().sort({ priority: 1, name: 1 });
    res.json({ countries });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, flag, currency, currencyName, isSendCountry, isReceiveCountry, isActive, priority } = req.body;
    const country = await Country.create({ name, code, flag, currency, currencyName, isSendCountry, isReceiveCountry, isActive, priority });
    res.status(201).json({ country });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'A country with this code already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, flag, currency, currencyName, isSendCountry, isReceiveCountry, isActive, priority } = req.body;
    const country = await Country.findByIdAndUpdate(
      req.params.id,
      { name, code, flag, currency, currencyName, isSendCountry, isReceiveCountry, isActive, priority },
      { new: true, runValidators: true }
    );
    if (!country) {
      res.status(404).json({ message: 'Country not found' });
      return;
    }
    res.json({ country });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'A country with this code already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const country = await Country.findByIdAndDelete(req.params.id);
    if (!country) {
      res.status(404).json({ message: 'Country not found' });
      return;
    }
    res.json({ message: 'Country deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
