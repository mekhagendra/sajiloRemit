import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetStatistics, adminGetVendors, adminGetReviews } from '../../api';
import type { Statistics, Vendor, Review } from '../../types';
import { Users, Building2, MessageSquare, BarChart2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminGetStatistics(), adminGetVendors(), adminGetReviews()])
      .then(([statsRes, vendorsRes, reviewsRes]) => {
        setStats(statsRes.data.statistics);
        const pendingVendors = vendorsRes.data.vendors.filter(
          (v: Vendor) => v.status === 'pending'
        ).length;
        const unapprovedReviews = reviewsRes.data.reviews.filter(
          (r: Review) => !r.isApproved
        ).length;
        setPending(pendingVendors + unapprovedReviews);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Vendors', value: stats?.vendors ?? '—', icon: Building2, color: 'bg-blue-500', to: '/admin/vendors' },
    { label: 'Total Users', value: stats?.users ?? '—', icon: Users, color: 'bg-purple-500', to: '/admin/users' },
    { label: 'Banks Tracked', value: stats?.banks ?? '—', icon: BarChart2, color: 'bg-yellow-500', to: '/admin' },
    { label: 'Items Pending', value: pending, icon: MessageSquare, color: 'bg-red-500', to: '/admin/reviews' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(({ label, value, icon: Icon, color, to }) => (
            <Link
              key={label}
              to={to}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 hover:shadow-md transition-shadow"
            >
              <div className={`${color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/vendors" className="block bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <h2 className="font-semibold text-gray-900 mb-1">Vendor Approvals</h2>
          <p className="text-sm text-gray-500">Approve or reject vendor registrations.</p>
        </Link>
        <Link to="/admin/users" className="block bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <h2 className="font-semibold text-gray-900 mb-1">User Management</h2>
          <p className="text-sm text-gray-500">Suspend or reactivate user accounts.</p>
        </Link>
        <Link to="/admin/reviews" className="block bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <h2 className="font-semibold text-gray-900 mb-1">Review Moderation</h2>
          <p className="text-sm text-gray-500">Approve or delete user-submitted reviews.</p>
        </Link>
      </div>
    </div>
  );
}
