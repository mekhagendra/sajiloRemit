import { Request, Response } from 'express';
import RemittanceRate from '../models/RemittanceRate';
import Vendor from '../models/Vendor';
import Country from '../models/Country';
import DailyRateSnapshot from '../models/DailyRateSnapshot';
import { AuthRequest } from '../middleware/auth';
import { VendorStatus } from '../types/enums';

/**
 * GET /api/exchange-chart
 * Returns the current exchange-rate matrix:
 *   - countries: all active countries (excluding NPR destination)
 *   - vendors: approved vendors
 *   - rates: { [vendorId]: { [currency]: { rate, unit, fee, rateId } } }
 */
export const getExchangeChart = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [countries, vendors] = await Promise.all([
      Country.find({ isActive: true, currency: { $ne: 'NPR' } }).sort({ priority: 1, name: 1 }),
      Vendor.find({ status: VendorStatus.APPROVED }).select('_id companyName logo').sort({ companyName: 1 }),
    ]);

    const vendorIds = vendors.map((v) => v._id);
    const allRates = await RemittanceRate.find({
      vendorId: { $in: vendorIds },
      toCurrency: 'NPR',
    });

    // Build matrix: { vendorId -> { currency -> rateInfo } }
    const matrix: Record<string, Record<string, { rate: number; unit: number; fee: number; rateId: string }>> = {};
    for (const r of allRates) {
      const vid = r.vendorId.toString();
      if (!matrix[vid]) matrix[vid] = {};
      matrix[vid][r.fromCurrency] = {
        rate: r.rate,
        unit: r.unit,
        fee: r.fee,
        rateId: r._id.toString(),
      };
    }

    res.json({ countries, vendors, matrix });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/exchange-chart/rate
 * Admin updates a single cell in the chart.
 * Body: { vendorId, fromCurrency, toCurrency, rate, unit?, fee? }
 * Upserts the RemittanceRate and returns the updated entry.
 */
export const updateChartRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vendorId, fromCurrency, toCurrency, rate, unit, fee } = req.body;

    if (!vendorId || !fromCurrency || !toCurrency || rate === undefined) {
      res.status(400).json({ message: 'vendorId, fromCurrency, toCurrency and rate are required' });
      return;
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.status !== VendorStatus.APPROVED) {
      res.status(404).json({ message: 'Approved vendor not found' });
      return;
    }

    const updated = await RemittanceRate.findOneAndUpdate(
      { vendorId: vendor._id, fromCurrency: fromCurrency.toUpperCase(), toCurrency: toCurrency.toUpperCase() },
      { rate, unit: unit || 1, fee: fee || 0 },
      { new: true, upsert: true }
    );

    res.json({
      rate: updated,
      cell: {
        rate: updated.rate,
        unit: updated.unit,
        fee: updated.fee,
        rateId: updated._id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/exchange-chart/snapshot
 * Takes a snapshot of all current rates and stores it as today's daily record.
 * If today's snapshot already exists it is replaced.
 */
export const takeDailySnapshot = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const approvedVendors = await Vendor.find({ status: VendorStatus.APPROVED }).select('_id');
    const vendorIds = approvedVendors.map((v) => v._id);

    const allRates = await RemittanceRate.find({ vendorId: { $in: vendorIds } });

    const rateEntries = allRates.map((r) => ({
      vendorId: r.vendorId,
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: r.rate,
      unit: r.unit,
      fee: r.fee,
    }));

    await DailyRateSnapshot.findOneAndUpdate(
      { date: today },
      { date: today, rates: rateEntries },
      { upsert: true, new: true }
    );

    res.json({ message: 'Snapshot saved', date: today, rateCount: rateEntries.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/exchange-chart/snapshots
 * List available snapshot dates. Query: ?page=1&limit=30
 */
export const listSnapshots = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
    const skip = (page - 1) * limit;

    const [snapshots, total] = await Promise.all([
      DailyRateSnapshot.find().select('date createdAt').sort({ date: -1 }).skip(skip).limit(limit),
      DailyRateSnapshot.countDocuments(),
    ]);

    res.json({ snapshots, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/exchange-chart/snapshot/:date
 * Retrieve a specific day's snapshot, structured as a matrix like getExchangeChart.
 */
export const getSnapshotByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
      res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const snapshot = await DailyRateSnapshot.findOne({ date });
    if (!snapshot) {
      res.status(404).json({ message: 'Snapshot not found for this date' });
      return;
    }

    // Gather unique vendor IDs and currencies from snapshot
    const vendorIdSet = new Set<string>();
    const currencySet = new Set<string>();
    for (const r of snapshot.rates) {
      vendorIdSet.add(r.vendorId.toString());
      if (r.toCurrency === 'NPR') currencySet.add(r.fromCurrency);
    }

    const [vendors, countries] = await Promise.all([
      Vendor.find({ _id: { $in: Array.from(vendorIdSet) } }).select('_id companyName logo').sort({ companyName: 1 }),
      Country.find({ currency: { $in: Array.from(currencySet) }, isActive: true }).sort({ priority: 1, name: 1 }),
    ]);

    // Build matrix
    const matrix: Record<string, Record<string, { rate: number; unit: number; fee: number }>> = {};
    for (const r of snapshot.rates) {
      if (r.toCurrency !== 'NPR') continue;
      const vid = r.vendorId.toString();
      if (!matrix[vid]) matrix[vid] = {};
      matrix[vid][r.fromCurrency] = { rate: r.rate, unit: r.unit, fee: r.fee };
    }

    res.json({ date: snapshot.date, countries, vendors, matrix });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
