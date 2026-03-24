import { Request, Response } from 'express';
import RemittanceRate from '../models/RemittanceRate';
import Remitter from '../models/Remitter';
import Country from '../models/Country';
import DailyRateSnapshot from '../models/DailyRateSnapshot';
import { AuthRequest } from '../middleware/auth';
import { RemitterStatus } from '../types/enums';

/**
 * GET /api/exchange-chart
 * Returns the current exchange-rate matrix:
 *   - countries: all active countries (excluding NPR destination)
 *   - remitters: approved remitters
 *   - rates: { [remitterId]: { [currency]: { rate, unit, fee, rateId } } }
 */
export const getExchangeChart = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [countries, remitters] = await Promise.all([
      Country.find({ isActive: true, currency: { $ne: 'NPR' } }).sort({ priority: 1, name: 1 }),
      Remitter.find({ status: RemitterStatus.APPROVED }).select('_id legalName logo').sort({ legalName: 1 }),
    ]);

    const remitterIds = remitters.map((v) => v._id);
    const allRates = await RemittanceRate.find({
      remitterId: { $in: remitterIds },
      toCurrency: 'NPR',
    });

    // Build matrix: { remitterId -> { currency -> rateInfo } }
    const matrix: Record<string, Record<string, { rate: number; unit: number; fee: number; rateId: string }>> = {};
    for (const r of allRates) {
      const rid = r.remitterId.toString();
      if (!matrix[rid]) matrix[rid] = {};
      matrix[rid][r.fromCurrency] = {
        rate: r.rate,
        unit: r.unit,
        fee: r.fee,
        rateId: r._id.toString(),
      };
    }

    res.json({ countries, remitters, matrix });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/exchange-chart/rate
 * Admin updates a single cell in the chart.
 * Body: { remitterId, fromCurrency, toCurrency, rate, unit?, fee? }
 * Upserts the RemittanceRate and returns the updated entry.
 */
export const updateChartRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { remitterId, fromCurrency, toCurrency, rate, unit, fee } = req.body;

    if (!remitterId || !fromCurrency || !toCurrency || rate === undefined) {
      res.status(400).json({ message: 'remitterId, fromCurrency, toCurrency and rate are required' });
      return;
    }

    const remitter = await Remitter.findById(remitterId);
    if (!remitter || remitter.status !== RemitterStatus.APPROVED) {
      res.status(404).json({ message: 'Approved remitter not found' });
      return;
    }

    const updated = await RemittanceRate.findOneAndUpdate(
      { remitterId: remitter._id, fromCurrency: fromCurrency.toUpperCase(), toCurrency: toCurrency.toUpperCase() },
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

    const approvedRemitters = await Remitter.find({ status: RemitterStatus.APPROVED }).select('_id');
    const remitterIds = approvedRemitters.map((v) => v._id);

    const allRates = await RemittanceRate.find({ remitterId: { $in: remitterIds } });

    const rateEntries = allRates.map((r) => ({
      remitterId: r.remitterId,
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

    // Gather unique remitter IDs and currencies from snapshot
    const remitterIdSet = new Set<string>();
    const currencySet = new Set<string>();
    for (const r of snapshot.rates) {
      remitterIdSet.add(r.remitterId.toString());
      if (r.toCurrency === 'NPR') currencySet.add(r.fromCurrency);
    }

    const [remitters, countries] = await Promise.all([
      Remitter.find({ _id: { $in: Array.from(remitterIdSet) } }).select('_id legalName logo').sort({ legalName: 1 }),
      Country.find({ currency: { $in: Array.from(currencySet) }, isActive: true }).sort({ priority: 1, name: 1 }),
    ]);

    // Build matrix
    const matrix: Record<string, Record<string, { rate: number; unit: number; fee: number }>> = {};
    for (const r of snapshot.rates) {
      if (r.toCurrency !== 'NPR') continue;
      const rid = r.remitterId.toString();
      if (!matrix[rid]) matrix[rid] = {};
      matrix[rid][r.fromCurrency] = { rate: r.rate, unit: r.unit, fee: r.fee };
    }

    res.json({ date: snapshot.date, countries, remitters, matrix });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
