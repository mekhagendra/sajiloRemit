import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';

const CURRENCIES = ['USD', 'AUD', 'GBP', 'EUR', 'CAD', 'JPY'];

export const getForexRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const base = (req.query.base as string)?.toUpperCase() || 'USD';

    // Use exchangerate-api free endpoint
    const apiKey = config.exchangeRateApiKey;
    let rates: Record<string, number> = {};

    if (apiKey) {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${encodeURIComponent(apiKey)}/latest/${encodeURIComponent(base)}`,
        { timeout: 10000 }
      );
      const allRates = response.data.conversion_rates || {};
      for (const currency of CURRENCIES) {
        if (allRates[currency]) {
          rates[currency] = allRates[currency];
        }
      }
      // Always include NPR
      if (allRates['NPR']) {
        rates['NPR'] = allRates['NPR'];
      }
    } else {
      // Fallback sample data for development
      rates = {
        USD: base === 'USD' ? 1 : 1.0,
        AUD: 1.53,
        GBP: 0.79,
        EUR: 0.92,
        CAD: 1.36,
        JPY: 149.5,
        NPR: 133.5,
      };
    }

    res.json({ base, rates, updatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch forex rates' });
  }
};
