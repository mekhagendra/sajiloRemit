import { Request, Response } from 'express';
import RemittanceRate from '../models/RemittanceRate';
import Vendor from '../models/Vendor';
import PartnerRoute from '../models/PartnerRoute';
import { AuthRequest } from '../middleware/auth';
import { VendorStatus } from '../types/enums';
import { COUNTRY_LIST } from '../constants/countries';

export const searchRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromCurrency, toCurrency, amount } = req.query;

    const filter: any = {};
    if (fromCurrency) filter.fromCurrency = (fromCurrency as string).toUpperCase();
    if (toCurrency) filter.toCurrency = (toCurrency as string).toUpperCase();

    // Only include rates from approved vendors
    const approvedVendors = await Vendor.find({ status: VendorStatus.APPROVED }).select('_id');
    const vendorIds = approvedVendors.map((v) => v._id);
    filter.vendorId = { $in: vendorIds };

    // Find the partner for this specific corridor via PartnerRoute (one per corridor)
    let partnerVendorId: string | null = null;
    if (fromCurrency && toCurrency) {
      const fromUpper = (fromCurrency as string).toUpperCase();
      const toUpper = (toCurrency as string).toUpperCase();

      // Populate sendCountry/receiveCountry currencies and match in JS — avoids relying on Country docs existing
      const activeRoutes = await PartnerRoute.find({ isActive: true })
        .populate('sendCountry', 'currency')
        .populate('receiveCountry', 'currency')
        .populate('partner', 'vendorId');

      const matchedRoute = activeRoutes.find((route) => {
        const send = (route.sendCountry as any)?.currency?.toUpperCase();
        const recv = (route.receiveCountry as any)?.currency?.toUpperCase();
        return send === fromUpper && recv === toUpper;
      });

      const partner = matchedRoute?.partner as any;
      if (partner?.vendorId) {
        partnerVendorId = partner.vendorId.toString();
      }
    }

    const rates = await RemittanceRate.find(filter)
      .sort({ rate: -1 })
      .populate({
        path: 'vendorId',
        select: 'companyName logo baseCountry',
      });

    // Route partner's rate first, then everyone else sorted by best rate
    const partnerRate: typeof rates = [];
    const others: typeof rates = [];
    for (const r of rates) {
      const vid = (r.vendorId as any)?._id?.toString() ?? (r.vendorId as any)?.toString();
      if (partnerVendorId && vid === partnerVendorId) {
        partnerRate.push(r);
      } else {
        others.push(r);
      }
    }
    const sorted = [...partnerRate, ...others];

    const result = sorted.map((r) => {
      const vid = (r.vendorId as any)?._id?.toString() ?? (r.vendorId as any)?.toString();
      return {
        _id: r._id,
        fromCurrency: r.fromCurrency,
        toCurrency: r.toCurrency,
        rate: r.rate,
        unit: r.unit,
        fee: r.fee,
        receivedAmount: amount ? r.rate * Number(amount) : undefined,
        vendor: r.vendorId,
        isFeatured: partnerVendorId !== null && vid === partnerVendorId,
        updatedAt: r.updatedAt,
      };
    });

    res.json({ rates: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBestRates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const approvedVendors = await Vendor.find({ status: VendorStatus.APPROVED }).select('_id');
    const vendorIds = approvedVendors.map((v) => v._id);

    const bestRates = await RemittanceRate.aggregate([
      { $match: { vendorId: { $in: vendorIds }, toCurrency: 'NPR' } },
      { $sort: { rate: -1 } },
      {
        $group: {
          _id: '$fromCurrency',
          rate: { $first: '$rate' },
          unit: { $first: '$unit' },
          vendorId: { $first: '$vendorId' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
      {
        $lookup: {
          from: 'countries',
          localField: '_id',
          foreignField: 'currency',
          as: 'countryInfo',
        },
      },
      {
        $addFields: {
          priority: { $ifNull: [{ $arrayElemAt: ['$countryInfo.priority', 0] }, 999] },
        },
      },
      { $sort: { priority: 1 } },
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
      {
        $project: {
          fromCurrency: '$_id',
          toCurrency: 'NPR',
          rate: 1,
          unit: 1,
          vendor: { companyName: 1, logo: 1 },
          updatedAt: 1,
        },
      },
    ]);

    res.json({ rates: bestRates });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor profile not found' });
      return;
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      res.status(403).json({ message: 'Vendor not yet approved' });
      return;
    }

    const { fromCurrency, toCurrency, rate, unit, fee } = req.body;

    // Validate both currencies belong to admin-approved supported countries
    const approvedCurrencies = new Set(
      vendor.supportedCountries
        .filter((sc) => sc.isActive)
        .map((sc) => COUNTRY_LIST.find((c) => c.code === sc.countryCode)?.currency)
        .filter(Boolean)
    );
    if (!approvedCurrencies.has(fromCurrency.toUpperCase())) {
      res.status(403).json({ message: `From country (${fromCurrency.toUpperCase()}) is not an admin-approved supported country` });
      return;
    }
    if (!approvedCurrencies.has(toCurrency.toUpperCase())) {
      res.status(403).json({ message: `To country (${toCurrency.toUpperCase()}) is not an admin-approved supported country` });
      return;
    }

    // Upsert: update existing rate or create new
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

export const getVendorRates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor profile not found' });
      return;
    }

    const rates = await RemittanceRate.find({ vendorId: vendor._id });
    res.json({ rates });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor profile not found' });
      return;
    }
    const { rate, unit, fee } = req.body;
    const updated = await RemittanceRate.findOneAndUpdate(
      { _id: req.params.id, vendorId: vendor._id },
      { rate, ...(unit !== undefined && { unit }), ...(fee !== undefined && { fee }) },
      { new: true, runValidators: true }
    );
    if (!updated) {
      res.status(404).json({ message: 'Rate not found' });
      return;
    }
    res.json({ rate: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user!._id });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor profile not found' });
      return;
    }

    const rate = await RemittanceRate.findOneAndDelete({
      _id: req.params.id,
      vendorId: vendor._id,
    });

    if (!rate) {
      res.status(404).json({ message: 'Rate not found' });
      return;
    }

    res.json({ message: 'Rate deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
