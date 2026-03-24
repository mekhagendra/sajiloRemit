import { Request, Response } from 'express';
import BankInterestRate from '../models/BankInterestRate';
import { AuthRequest } from '../middleware/auth';

const BANK_POPULATE = { path: 'bank', select: 'name website country' };

export const getBankRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (req.query.bank) filter.bank = req.query.bank;

    const rates = await BankInterestRate.find(filter)
      .populate(BANK_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await BankInterestRate.countDocuments(filter);

    res.json({ rates, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFeaturedBankRates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rates = await BankInterestRate.find({ featured: true })
      .populate(BANK_POPULATE)
      .sort({ createdAt: -1 });
    res.json({ rates });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBankRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bank, plan, duration, rate, paymentTerm, featured } = req.body;
    const created = await BankInterestRate.create({ bank, plan, duration, rate, paymentTerm, featured });
    const bankRate = await created.populate(BANK_POPULATE);
    res.status(201).json({ rate: bankRate });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBankRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bank, plan, duration, rate, paymentTerm, featured } = req.body;
    const bankRate = await BankInterestRate.findByIdAndUpdate(
      req.params.id,
      { bank, plan, duration, rate, paymentTerm, featured },
      { new: true }
    ).populate(BANK_POPULATE);
    if (!bankRate) {
      res.status(404).json({ message: 'Bank rate not found' });
      return;
    }
    res.json({ rate: bankRate });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBankRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bankRate = await BankInterestRate.findByIdAndDelete(req.params.id);
    if (!bankRate) {
      res.status(404).json({ message: 'Bank rate not found' });
      return;
    }
    res.json({ message: 'Bank rate deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
