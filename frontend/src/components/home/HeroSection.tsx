import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { COUNTRY_LIST } from '../../constants/countries';
import { fetchAllBanners } from '../common/bannerCache';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api').replace(/\/api$/, '');
const resolveUrl = (url: string): string => {
  if (!url) return url;
  const httpMatch = url.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/);
  if (httpMatch) return httpMatch[1];
  if (url.startsWith('/uploads/')) return url;
  const m = url.match(/\/gallery\/([^/?#]+)$/);
  if (m) return `/uploads/gallery/${m[1]}`;
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
};

// Exclude Nepal (destination) from the "Send From" list
const sendCountries = COUNTRY_LIST.filter((c) => c.currency !== 'NPR');
const nepal = COUNTRY_LIST.find((c) => c.currency === 'NPR')!

export default function HeroSection() {
  const navigate = useNavigate();
  const [fromCurrency, setFromCurrency] = useState('');
  const [heroBg, setHeroBg] = useState<string | null>(null);

  useEffect(() => {
    fetchAllBanners()
      .then((all) => {
        const bg = all.find((b) => b.position === 'hero_background' && b.isActive);
        if (bg) setHeroBg(resolveUrl(bg.imageUrl));
      })
      .catch(() => {/* fall back to gradient */});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCurrency) return;
    navigate(`/best-rates?from=${fromCurrency}&to=NPR`);
  };

  return (
    <section
      className="relative text-white"
      style={heroBg ? {
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {/* Overlay: gradient always, slightly darker when bg image is set */}
      <div className={`absolute inset-0 ${heroBg ? 'bg-black/55' : 'bg-gradient-to-br from-green-600 via-green-700 to-emerald-800'}`} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
            Find the Best Remittance Rates to Nepal
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
            Compare exchange rates from trusted remittance providers and save money on every transfer.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Send From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              >
                <option value="" disabled>Select a country</option>
                {sendCountries.map((c) => (
                  <option key={c.currency} value={c.currency}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receive In</label>
              <select
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              >
                <option value="NPR">{nepal.flag} {nepal.name}</option>
              </select>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Search className="w-5 h-5" />
              <span>Compare Rates</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
