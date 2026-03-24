import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBestRates } from '../../api';
import type { BestRate } from '../../types';
import { TrendingUp } from 'lucide-react';
import { COUNTRY_LIST } from '../../constants/countries';

// currency code → country name lookup
const currencyToName: Record<string, string> = {};
const currencyToFlag: Record<string, string> = {};
COUNTRY_LIST.forEach((c) => { currencyToName[c.currency] = c.name; currencyToFlag[c.currency] = c.flag; });

export default function BestRateSidebar() {
  const [rates, setRates] = useState<BestRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBestRates()
      .then((res) => setRates(res.data.rates.slice(0, 10)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold text-gray-900">Best Rates to Nepal</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-gray-100 rounded" />
          ))}
        </div>
      ) : rates.length === 0 ? (
        <p className="text-gray-500 text-sm">No rates available</p>
      ) : (
        <div className="space-y-1">
          {/* Header: From | Rate | Agent(hidden below 480px) */}
          <div className="grid grid-cols-3 [@media(min-width:480px)]:grid-cols-5 text-xs font-semibold text-gray-500 uppercase pb-2 border-b">
            <span className="col-span-2">From</span>
            <span>Rate</span>
            <span className="hidden [@media(min-width:480px)]:block col-span-2 pl-2">Remitter</span>
          </div>
          {rates.map((rate) => (
            <div key={rate.fromCurrency} className="grid grid-cols-3 [@media(min-width:480px)]:grid-cols-5 text-xs sm:text-sm py-2 border-b border-gray-50 items-center">
              <span className="col-span-2 font-medium text-gray-800 truncate pr-1 flex items-center gap-1">
                {currencyToFlag[rate.fromCurrency] && <span>{currencyToFlag[rate.fromCurrency]}</span>}
                {currencyToName[rate.fromCurrency] ?? rate.fromCurrency}
              </span>
              <span className="font-semibold text-green-600">{rate.rate.toFixed(2)}</span>
              <span className="hidden [@media(min-width:480px)]:block col-span-2 text-gray-600 truncate pl-2">{rate.remitter?.brandName || rate.remitter?.legalName || '—'}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/best-rates"
        className="mt-4 block text-center text-sm text-green-600 hover:text-green-700 font-medium"
      >
        View All Rates →
      </Link>
    </div>
  );
}
