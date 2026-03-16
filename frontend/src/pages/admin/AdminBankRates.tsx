import { useEffect, useState } from 'react';
import { adminGetBankRates, adminCreateBankRate, adminUpdateBankRate, adminDeleteBankRate, adminGetBanks } from '../../api';
import type { BankInterestRate, Bank } from '../../types';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

const EMPTY_FORM = { bankId: '', plan: '', duration: '', rate: '', paymentTerm: '', featured: false };

function getBankName(bank: Bank | string): string {
  return typeof bank === 'object' ? bank.name : bank;
}

export default function AdminBankRates() {
  const [rates, setRates] = useState<BankInterestRate[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchRates = () => {
    setLoading(true);
    adminGetBankRates({ limit: 100 })
      .then((res) => setRates(res.data.rates))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRates();
    adminGetBanks()
      .then((res) => setBanks(res.data.banks))
      .catch(console.error);
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (r: BankInterestRate) => {
    setEditingId(r._id);
    setForm({
      bankId: typeof r.bank === 'object' ? r.bank._id : r.bank,
      plan: r.plan,
      duration: r.duration,
      rate: String(r.rate),
      paymentTerm: r.paymentTerm,
      featured: r.featured ?? false,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const rateNum = parseFloat(form.rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setError('Rate must be a positive number.');
      return;
    }
    if (!form.bankId) {
      setError('Please select a bank.');
      return;
    }
    const payload = { bank: form.bankId, plan: form.plan, duration: form.duration, rate: rateNum, paymentTerm: form.paymentTerm, featured: form.featured };
    setSaving(true);
    try {
      if (editingId) {
        const res = await adminUpdateBankRate(editingId, payload);
        setRates((prev) => prev.map((r) => (r._id === editingId ? res.data.rate : r)));
      } else {
        const res = await adminCreateBankRate(payload);
        setRates((prev) => [...prev, res.data.rate]);
      }
      setShowForm(false);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bank rate entry?')) return;
    setDeletingId(id);
    try {
      await adminDeleteBankRate(id);
      setRates((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bank Interest Rates</h1>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Rate</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Rate' : 'Add New Rate'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank *</label>
              {banks.length === 0 ? (
                <p className="text-xs text-amber-600 py-2">No banks found. Please add banks first from the Banks section.</p>
              ) : (
                <select
                  required
                  value={form.bankId}
                  onChange={(e) => setForm((f) => ({ ...f, bankId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="">— Select a bank —</option>
                  {banks.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
              <input
                required
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                placeholder="e.g. Fixed Deposit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
              <input
                required
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="e.g. 1 Year"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Interest Rate (%)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.rate}
                onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                placeholder="e.g. 8.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Term</label>
              <input
                required
                value={form.paymentTerm}
                onChange={(e) => setForm((f) => ({ ...f, paymentTerm: e.target.value }))}
                placeholder="e.g. Monthly / Quarterly"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="w-4 h-4 rounded accent-green-600"
                />
                <span className="text-sm text-gray-700 font-medium">Featured on homepage</span>
              </label>
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
      ) : rates.length === 0 ? (
        <p className="text-gray-500">No bank rates yet. Click "Add Rate" to create one.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <th className="text-left px-6 py-3">Bank Name</th>
                <th className="text-left px-6 py-3">Plan</th>
                <th className="text-left px-6 py-3">Duration</th>
                <th className="text-right px-6 py-3">Rate</th>
                <th className="text-left px-6 py-3">Payment Term</th>
                <th className="text-center px-6 py-3">Featured</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map((rate) => (
                <tr key={rate._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{getBankName(rate.bank)}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{rate.plan}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{rate.duration}</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-green-600">{rate.rate}%</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{rate.paymentTerm}</td>
                  <td className="px-6 py-3 text-center">
                    {rate.featured
                      ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Featured</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openEdit(rate)}
                        title="Edit"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rate._id)}
                        disabled={deletingId === rate._id}
                        title="Delete"
                        className="text-red-500 hover:text-red-700 disabled:opacity-40"
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
