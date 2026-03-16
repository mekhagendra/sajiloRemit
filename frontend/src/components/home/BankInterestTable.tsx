import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedBankRates } from '../../api';
import type { BankInterestRate } from '../../types';
import { Landmark } from 'lucide-react';

export default function BankInterestTable() {
  const [rates, setRates] = useState<BankInterestRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedBankRates()
      .then((res) => setRates(res.data.rates.slice(0, 7)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Save and Earn Interest</h2>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bank Name</th>
                    <th className="text-left px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                    <th className="text-left px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                    <th className="text-right px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                    <th className="text-left px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Payment Term</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((rate) => (
                    <tr key={rate._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{typeof rate.bank === 'object' ? rate.bank.name : rate.bank}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">{rate.plan}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">{rate.duration}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-right font-semibold text-green-600">{rate.rate}%</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">{rate.paymentTerm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/bank-rates"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View More
          </Link>
        </div>
    </div>
  );
}
