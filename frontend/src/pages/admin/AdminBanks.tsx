import { useEffect, useState } from 'react';
import { adminGetBanks, adminCreateBank, adminUpdateBank, adminDeleteBank } from '../../api';
import type { Bank } from '../../types';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

const EMPTY_FORM = { name: '', logoUrl: '', country: '' };

export default function AdminBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchBanks = () => {
    setLoading(true);
    adminGetBanks()
      .then((res) => setBanks(res.data.banks))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (b: Bank) => {
    setEditingId(b._id);
    setForm({ name: b.name, logoUrl: b.logoUrl ?? '', country: b.country ?? '' });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name.trim(),
      ...(form.logoUrl.trim() && { logoUrl: form.logoUrl.trim() }),
      ...(form.country.trim() && { country: form.country.trim() }),
    };
    setSaving(true);
    try {
      if (editingId) {
        const res = await adminUpdateBank(editingId, payload);
        setBanks((prev) => prev.map((b) => (b._id === editingId ? res.data.bank : b)));
      } else {
        const res = await adminCreateBank(payload);
        setBanks((prev) => [...prev, res.data.bank].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setShowForm(false);
    } catch (err) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bank? Any interest rates linked to it will lose their bank reference.')) return;
    setDeletingId(id);
    try {
      await adminDeleteBank(id);
      setBanks((prev) => prev.filter((b) => b._id !== id));
    } catch {
      alert('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banks</h1>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bank</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Bank' : 'Add New Bank'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Nepal Investment Bank"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
              <input
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="e.g. Nepal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving…' : editingId ? 'Update' : 'Add'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-gray-200 rounded" />
          ))}
        </div>
      ) : banks.length === 0 ? (
        <p className="text-gray-500">No banks yet. Click "Add Bank" to create one.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <th className="text-left px-6 py-3">Bank Name</th>
                <th className="text-left px-6 py-3">Country</th>
                <th className="text-left px-6 py-3">Logo URL</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banks.map((bank) => (
                <tr key={bank._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{bank.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{bank.country ?? '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {bank.logoUrl ? (
                      <a href={bank.logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {bank.logoUrl}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openEdit(bank)}
                        title="Edit"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bank._id)}
                        disabled={deletingId === bank._id}
                        title="Delete"
                        className="text-red-400 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
