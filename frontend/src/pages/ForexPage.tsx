import { useEffect, useState } from 'react';
import { getForexRates } from '../api';
import type { ForexRates } from '../types';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const baseCurrencies = ['USD', 'AUD', 'GBP', 'EUR', 'CAD', 'JPY'];

export default function ForexPage() {
  const [forexData, setForexData] = useState<ForexRates | null>(null);
  const [base, setBase] = useState('USD');
  const [loading, setLoading] = useState(true);

  const fetchRates = (baseCurrency: string) => {
    setLoading(true);
    getForexRates(baseCurrency)
      .then((res) => setForexData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates(base);
  }, [base]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Forex Exchange Rates</h1>
        <button
          onClick={() => fetchRates(base)}
          className="flex items-center space-x-2 text-green-600 hover:text-green-700"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Base Currency</label>
        <div className="flex flex-wrap gap-2">
          {baseCurrencies.map((c) => (
            <button
              key={c}
              onClick={() => setBase(c)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                base === c ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : forexData ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Base: 1 {forexData.base} • Updated: {new Date(forexData.updatedAt).toLocaleString()}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(forexData.rates)
              .filter(([currency]) => currency !== forexData.base)
              .map(([currency, rate]) => (
                <div
                  key={currency}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">{currency}</span>
                    <span className="text-xs text-gray-400">{forexData.base}/{currency}</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(rate)}</p>
                </div>
              ))}
          </div>
        </>
      ) : (
        <p className="text-gray-500">Failed to load forex rates.</p>
      )}
    </div>
  );
}
