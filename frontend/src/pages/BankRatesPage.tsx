import { useEffect, useState } from 'react';
import { getBankRates, getBanks } from '../api';
import type { Bank, BankInterestRate } from '../types';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function BankRatesPage() {
  const [rates, setRates] = useState<BankInterestRate[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    getBanks().then((res) => setBanks(res.data.banks)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getBankRates({ page, limit: 20, ...(selectedBank ? { bank: selectedBank } : {}) })
      .then((res) => {
        setRates(res.data.rates);
        setTotalPages(res.data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, selectedBank]);

  const filteredBanks = bankSearch
    ? banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : banks;

  const selectedBankName = banks.find((b) => b._id === selectedBank)?.name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nepal Bank Interest Rates</h1>

      {/* Bank Filter */}
      <div className="mb-6 relative max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Bank</label>
        <div className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer flex items-center justify-between hover:border-gray-400 transition-colors"
          >
            <span className={selectedBankName ? 'text-gray-900' : 'text-gray-400'}>
              {selectedBankName || 'All Banks'}
            </span>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
          </div>
          {dropdownOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Search banks…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-48">
                <button
                  onClick={() => { setSelectedBank(''); setPage(1); setDropdownOpen(false); setBankSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!selectedBank ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
                >
                  All Banks
                </button>
                {filteredBanks.map((bank) => (
                  <button
                    key={bank._id}
                    onClick={() => { setSelectedBank(bank._id); setPage(1); setDropdownOpen(false); setBankSearch(''); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedBank === bank._id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
                  >
                    {bank.name}
                  </button>
                ))}
                {filteredBanks.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">No banks found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-gray-100 rounded" />
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bank</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Payment Term</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((rate) => (
                    <tr key={rate._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="text-base font-bold text-gray-900">{typeof rate.bank === 'object' ? rate.bank.name : rate.bank}</div>
                        <div className="text-base text-gray-600">{rate.plan}</div>
                      </td>
                      <td className="px-6 py-3 text-base text-gray-600">{rate.duration}</td>
                      <td className="px-6 py-3 text-base text-right font-semibold text-green-600">{rate.rate}%</td>
                      <td className="px-6 py-3 text-base text-gray-600">{rate.paymentTerm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> <span>Previous</span>
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                <span>Next</span> <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
