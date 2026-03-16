import { Request, Response } from 'express';
import PartnerRoute from '../models/PartnerRoute';
import Partner from '../models/Partner';
import Vendor from '../models/Vendor';
import { AuthRequest } from '../middleware/auth';

const POPULATE = [
  { path: 'sendCountry', select: 'name code flag' },
  { path: 'receiveCountry', select: 'name code flag' },
  { path: 'partner', select: 'name logoUrl website description featured vendorId' },
];

export const getPartnerRoutes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const routes = await PartnerRoute.find({ isActive: true })
      .populate(POPULATE)
      .sort({ createdAt: -1 });
    res.json({ routes });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminGetPartnerRoutes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const routes = await PartnerRoute.find()
      .populate(POPULATE)
      .sort({ createdAt: -1 });
    res.json({ routes });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPartnerRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sendCountry, receiveCountry, isActive, description, featured, vendorId } = req.body;

    // Derive partner name from the linked vendor, fallback to corridor placeholder
    let derivedName = 'Partner';
    if (vendorId) {
      const vendor = await Vendor.findById(vendorId).select('companyName website logo');
      if (vendor) derivedName = vendor.companyName;
    }

    // Create partner record first
    const partner = await Partner.create({
      name: derivedName,
      sendCountry,
      receiveCountry,
      logoUrl: '',
      website: '',
      description: description || '',
      featured: featured ?? false,
      vendorId: vendorId || null,
      isActive: true,
    });

    const created = await PartnerRoute.create({ sendCountry, receiveCountry, partner: partner._id, isActive: isActive ?? true });
    const route = await PartnerRoute.findById(created._id).populate(POPULATE);
    res.status(201).json({ route });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'A route for this send/receive corridor already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePartnerRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sendCountry, receiveCountry, isActive, description, featured, vendorId } = req.body;

    const existing = await PartnerRoute.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Partner route not found' });
      return;
    }

    // Derive partner name from the linked vendor
    let derivedName = 'Partner';
    if (vendorId) {
      const vendor = await Vendor.findById(vendorId).select('companyName');
      if (vendor) derivedName = vendor.companyName;
    }

    const partnerData = {
      name: derivedName,
      sendCountry,
      receiveCountry,
      logoUrl: '',
      website: '',
      description: description || '',
      featured: featured ?? false,
      vendorId: vendorId || null,
    };

    // Update existing partner or create one if missing
    let partnerId = existing.partner;
    if (partnerId) {
      await Partner.findByIdAndUpdate(partnerId, partnerData);
    } else {
      const newPartner = await Partner.create({ ...partnerData, isActive: true });
      partnerId = newPartner._id;
    }

    const route = await PartnerRoute.findByIdAndUpdate(
      req.params.id,
      { sendCountry, receiveCountry, partner: partnerId, isActive },
      { new: true, runValidators: true }
    ).populate(POPULATE);

    if (!route) {
      res.status(404).json({ message: 'Partner route not found' });
      return;
    }
    res.json({ route });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'A route for this send/receive corridor already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePartnerRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const route = await PartnerRoute.findByIdAndDelete(req.params.id);
    if (!route) {
      res.status(404).json({ message: 'Partner route not found' });
      return;
    }
    // Clean up the associated partner record
    if (route.partner) {
      await Partner.findByIdAndDelete(route.partner);
    }
    res.json({ message: 'Partner route deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
