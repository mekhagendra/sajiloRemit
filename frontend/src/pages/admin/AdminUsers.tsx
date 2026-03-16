import { useEffect, useState } from 'react';
import { adminGetUsers, adminUpdateUserStatus } from '../../api';
import type { User } from '../../types';
import { ShieldCheck, ShieldOff } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    adminGetUsers()
      .then((res) => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUpdating(id);
    try {
      const res = await adminUpdateUserStatus(id, newStatus);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
    } catch {
      alert('Failed to update user status.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-14 bg-gray-200 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Role</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Joined</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900 text-sm">{user.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'vendor'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => toggle(user._id, user.status)}
                        disabled={updating === user._id}
                        title={user.status === 'active' ? 'Suspend' : 'Activate'}
                        className={`disabled:opacity-40 ${
                          user.status === 'active'
                            ? 'text-red-500 hover:text-red-700'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <ShieldOff className="w-5 h-5" />
                        ) : (
                          <ShieldCheck className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
