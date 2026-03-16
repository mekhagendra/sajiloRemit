import { useEffect, useState } from 'react';
import { getRemitters } from '../api';
import type { Remitter } from '../types';
import { Building, Globe, ExternalLink } from 'lucide-react';

export default function RemittersPage() {
  const [remitters, setRemitters] = useState<Remitter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRemitters()
      .then((res) => setRemitters(res.data.remitters))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Remitters</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-48 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : remitters.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No remitters available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remitters.map((remitter) => (
            <div key={remitter._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {remitter.logo
                    ? <img src={remitter.logo} alt={remitter.companyName} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : <Building className="w-6 h-6 text-green-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{remitter.companyName}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Globe className="w-3 h-3" />
                    <span>{remitter.baseCountry}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{remitter.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {remitter.supportedCountries.map((country) => (
                  <span key={country.countryCode} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {country.countryCode}
                  </span>
                ))}
              </div>
              {remitter.website && (
                <div className="flex items-center justify-end">
                  <a
                    href={remitter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Website</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
