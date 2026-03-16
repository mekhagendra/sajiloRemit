import { useEffect, useState } from 'react';
import { getBankRates } from '../api';
import type { BankInterestRate } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BankRatesPage() {
  const [rates, setRates] = useState<BankInterestRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getBankRates({ page, limit: 20 })
      .then((res) => {
        setRates(res.data.rates);
        setTotalPages(res.data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nepal Bank Interest Rates</h1>

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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bank Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Payment Term</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((rate) => (
                    <tr key={rate._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{typeof rate.bank === 'object' ? rate.bank.name : rate.bank}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{rate.plan}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{rate.duration}</td>
                      <td className="px-6 py-3 text-sm text-right font-semibold text-green-600">{rate.rate}%</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{rate.paymentTerm}</td>
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
