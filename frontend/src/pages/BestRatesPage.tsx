import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchRates } from '../api';
import type { RemittanceRate } from '../types';
import { Search, ArrowRight, Star } from 'lucide-react';
import { COUNTRY_LIST } from '../constants/countries';

const sendCountries = COUNTRY_LIST.filter((c) => c.currency !== 'NPR');
const nepal = COUNTRY_LIST.find((c) => c.currency === 'NPR')!;

export default function BestRatesPage() {
  const [searchParams] = useSearchParams();
  const [fromCurrency, setFromCurrency] = useState(searchParams.get('from') || 'AUD');
  const [toCurrency] = useState('NPR');
  const [rates, setRates] = useState<RemittanceRate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRates = useCallback(() => {
    setLoading(true);
    searchRates({ fromCurrency, toCurrency })
      .then((res) => setRates(res.data.rates))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates();
  }, [fetchRates]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRates();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Compare Remittance Rates</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Send From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              {sendCountries.map((c) => (
                <option key={c.currency} value={c.currency}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Receive In</label>
            <select disabled className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed">
              <option value="NPR">{nepal.flag} {nepal.name}</option>
            </select>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : rates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No rates found. Try a different currency.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Corridor</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((rate, idx) => (
                  <tr
                    key={rate._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      rate.isFeatured
                        ? 'bg-yellow-50 border-l-4 border-yellow-400'
                        : idx === 0
                        ? 'bg-green-50 border-l-4 border-green-400'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {rate.vendor.logo
                            ? <img src={rate.vendor.logo} alt={rate.vendor.companyName} className="w-full h-full object-contain rounded-full p-0.5" onError={e => { e.currentTarget.style.display='none'; }} />
                            : <span className="text-green-700 font-bold text-xs">{rate.vendor.companyName.charAt(0)}</span>
                          }
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{rate.vendor.companyName}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {rate.isFeatured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                <Star className="w-3 h-3" /> Featured
                              </span>
                            )}
                            {!rate.isFeatured && idx === 0 && (
                              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">Best</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                        <span>{rate.fromCurrency}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span>{rate.toCurrency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-base font-bold text-green-600">{rate.rate.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">{rate.fee.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {rates.map((rate, idx) => (
              <div
                key={rate._id}
                className={`bg-white rounded-xl border shadow-sm p-4 ${
                  rate.isFeatured
                    ? 'border-yellow-400 border-l-4'
                    : idx === 0
                    ? 'border-green-400 border-l-4'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {rate.vendor.logo
                        ? <img src={rate.vendor.logo} alt={rate.vendor.companyName} className="w-full h-full object-contain rounded-full p-0.5" onError={e => { e.currentTarget.style.display='none'; }} />
                        : <span className="text-green-700 font-bold text-xs">{rate.vendor.companyName.charAt(0)}</span>
                      }
                    </div>
                    <span className="font-semibold text-gray-900">{rate.vendor.companyName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rate.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    )}
                    {!rate.isFeatured && idx === 0 && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">Best</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <span>{rate.fromCurrency}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{rate.toCurrency}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Rate</p>
                      <p className="font-bold text-green-600">{rate.rate.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Fee</p>
                      <p className="text-gray-700">{rate.fee.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

