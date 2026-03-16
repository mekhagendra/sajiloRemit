import { Request, Response } from 'express';
import Partner from '../models/Partner';
import { AuthRequest } from '../middleware/auth';

const POPULATE = [
  { path: 'sendCountry', select: 'name code flag' },
  { path: 'receiveCountry', select: 'name code flag' },
];

export const getPartners = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sendCountry, receiveCountry } = req.query;
    const filter: Record<string, unknown> = { isActive: true };
    if (sendCountry) filter.sendCountry = sendCountry;
    if (receiveCountry) filter.receiveCountry = receiveCountry;
    const partners = await Partner.find(filter).populate(POPULATE).sort({ name: 1 });
    res.json({ partners });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminGetPartners = async (_req: Request, res: Response): Promise<void> => {
  try {
    const partners = await Partner.find().populate(POPULATE).sort({ name: 1 });
    res.json({ partners });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPartner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, sendCountry, receiveCountry, logoUrl, website, description, isActive, featured, vendorId } = req.body;
    const created = await Partner.create({ name, sendCountry, receiveCountry, logoUrl, website, description, isActive, featured: featured ?? false, vendorId: vendorId || null });
    const partner = await created.populate(POPULATE);
    res.status(201).json({ partner });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'This partner already exists for the selected corridor' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePartner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, sendCountry, receiveCountry, logoUrl, website, description, isActive, featured, vendorId } = req.body;
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      { name, sendCountry, receiveCountry, logoUrl, website, description, isActive, featured: featured ?? false, vendorId: vendorId || null },
      { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!partner) {
      res.status(404).json({ message: 'Partner not found' });
      return;
    }
    res.json({ partner });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'This partner already exists for the selected corridor' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePartner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id);
    if (!partner) {
      res.status(404).json({ message: 'Partner not found' });
      return;
    }
    res.json({ message: 'Partner deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
