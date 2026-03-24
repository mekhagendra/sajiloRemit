import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchRates } from '../api';
import type { RemittanceRate } from '../types';
import { Search, Star, ExternalLink } from 'lucide-react';
import { COUNTRY_LIST } from '../constants/countries';

const sendCountries = COUNTRY_LIST.filter((c) => c.currency !== 'NPR');
const nepal = COUNTRY_LIST.find((c) => c.currency === 'NPR')!;

type CalcMode = 'send' | 'receive';

export default function BestRatesPage() {
  const [searchParams] = useSearchParams();
  const [fromCurrency, setFromCurrency] = useState(searchParams.get('from') || '');
  const [toCurrency] = useState('NPR');
  const [sendAmount, setSendAmount] = useState('1');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [calcMode, setCalcMode] = useState<CalcMode>('send');
  const [rates, setRates] = useState<RemittanceRate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRates = useCallback(() => {
    if (!fromCurrency) return;
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

  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);
    setCalcMode('send');
    setReceiveAmount('');
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);
    setCalcMode('receive');
    setSendAmount('');
  };

  const getReceivable = (rate: RemittanceRate): number => {
    if (calcMode === 'send') {
      const amt = parseFloat(sendAmount) || 0;
      return Math.max(0, amt * (rate.rate / rate.unit));
    }
    return parseFloat(receiveAmount) || 0;
  };

  const getSendingAmount = (rate: RemittanceRate): number => {
    if (calcMode === 'receive') {
      const recv = parseFloat(receiveAmount) || 0;
      return recv * rate.unit / rate.rate;
    }
    return parseFloat(sendAmount) || 0;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Compare Remittance Rates</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Send From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="" disabled>Select a country</option>
              {sendCountries.map((c) => (
                <option key={c.currency} value={c.currency}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              value={sendAmount}
              onChange={(e) => handleSendAmountChange(e.target.value)}
              placeholder="Enter send amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Receive In</label>
            <select disabled className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed">
              <option value="NPR">{nepal.flag} {nepal.name}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              value={receiveAmount}
              onChange={(e) => handleReceiveAmountChange(e.target.value)}
              placeholder="Enter receivable amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : !fromCurrency ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Select a country above to compare rates.</p>
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remitter</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{fromCurrency || 'Send'}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{toCurrency}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fee</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receivable</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((rate, idx) => (
                  <tr
                    key={rate._id}
                    onClick={() => rate.remitter.remittanceUrl && window.open(rate.remitter.remittanceUrl, '_blank', 'noopener,noreferrer')}
                    className={`hover:bg-gray-50 transition-colors ${rate.remitter.remittanceUrl ? 'cursor-pointer' : ''} ${
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
                          {rate.remitter.logo
                            ? <img src={rate.remitter.logo} alt={rate.remitter.legalName ?? ''} className="w-full h-full object-contain rounded-full p-0.5" onError={e => { e.currentTarget.style.display='none'; }} />
                            : <span className="text-green-700 font-bold text-xs">{(rate.remitter.legalName ?? '?').charAt(0)}</span>
                          }
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{rate.remitter.legalName ?? '—'}</span>
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
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-700">{getSendingAmount(rate).toFixed(2)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-base font-bold text-green-600">{rate.rate.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-500">{rate.fee.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-base font-semibold text-green-700">{getReceivable(rate).toFixed(2)}</span>
                    </td>
                    <td className="px-2 py-4 text-center">
                      {rate.remitter.remittanceUrl && (
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
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
                onClick={() => rate.remitter.remittanceUrl && window.open(rate.remitter.remittanceUrl, '_blank', 'noopener,noreferrer')}
                className={`bg-white rounded-xl border shadow-sm p-4 ${rate.remitter.remittanceUrl ? 'cursor-pointer' : ''} ${
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
                      {rate.remitter.logo
                        ? <img src={rate.remitter.logo} alt={rate.remitter.legalName ?? ''} className="w-full h-full object-contain rounded-full p-0.5" onError={e => { e.currentTarget.style.display='none'; }} />
                        : <span className="text-green-700 font-bold text-xs">{(rate.remitter.legalName ?? '?').charAt(0)}</span>
                      }
                    </div>
                    <span className="font-semibold text-gray-900">{rate.remitter.legalName ?? '—'}</span>
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
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Send ({fromCurrency})</p>
                    <p className="font-medium text-gray-700">{getSendingAmount(rate).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Rate ({toCurrency})</p>
                    <p className="font-bold text-green-600">{rate.rate.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Fee</p>
                    <p className="text-gray-700">{rate.fee.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Receivable ({toCurrency})</p>
                    <p className="font-semibold text-green-700">{getReceivable(rate).toFixed(2)}</p>
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

