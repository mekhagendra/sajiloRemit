import { useEffect, useState } from 'react';
import { getStatistics } from '../../api';
import type { Statistics } from '../../types';
import { Globe, Building, Landmark } from 'lucide-react';

export default function StatisticsSection() {
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    getStatistics()
      .then((res) => setStats(res.data.statistics))
      .catch(console.error);
  }, []);

  const items = [
    { icon: Globe, label: 'Countries', value: stats?.countries ?? 0, color: 'bg-blue-100 text-blue-600' },
    { icon: Building, label: 'Agents', value: stats?.remitters ?? 0, color: 'bg-green-100 text-green-600' },
    { icon: Landmark, label: 'Banks', value: stats?.banks ?? 0, color: 'bg-purple-100 text-purple-600' },
    // { icon: Users, label: 'Users', value: stats?.users ?? 0, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto gap-3 sm:gap-6 scrollbar-hide">
          {items.map((item) => (
            <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 text-center flex-shrink-0 flex-1 min-w-0">
              <div className={`w-8 h-8 sm:w-12 sm:h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-3`}>
                <item.icon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-lg sm:text-3xl font-bold text-gray-900">
                {item.value.toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
