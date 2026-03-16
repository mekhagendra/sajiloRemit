import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Globe, Download } from 'lucide-react';
import {
  adminGetCountries,
  adminCreateCountry,
  adminUpdateCountry,
  adminDeleteCountry,
} from '../../api';
import type { Country } from '../../types';
import { COUNTRY_LIST } from '../../constants/countries';

interface FormState {
  selectedCode: string;
  name: string;
  code: string;
  flag: string;
  currency: string;
  currencyName: string;
  isSendCountry: boolean;
  isReceiveCountry: boolean;
  isActive: boolean;
  priority: number;
}

const EMPTY: FormState = {
  selectedCode: '',
  name: '',
  code: '',
  flag: '',
  currency: '',
  currencyName: '',
  isSendCountry: false,
  isReceiveCountry: false,
  isActive: true,
  priority: 999,
};

export default function AdminCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    try {
      const res = await adminGetCountries();
      setCountries(res.data.countries);
    } catch {
      setError('Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addedCodes = new Set(countries.map(c => c.code));
  const availableToAdd = COUNTRY_LIST.filter(c => !addedCodes.has(c.code));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: Country) => {
    setEditing(c);
    setForm({
      selectedCode: c.code,
      name: c.name,
      code: c.code,
      flag: c.flag || '',
      currency: c.currency || '',
      currencyName: c.currencyName || '',
      isSendCountry: c.isSendCountry,
      isReceiveCountry: c.isReceiveCountry,
      isActive: c.isActive,
      priority: c.priority ?? 999,
    });
    setShowForm(true);
  };

  const handleCountrySelect = (code: string) => {
    const info = COUNTRY_LIST.find(c => c.code === code);
    if (info) {
      setForm(f => ({ ...f, selectedCode: code, name: info.name, code: info.code, flag: info.flag, currency: info.currency, currencyName: info.currencyName }));
    } else {
      setForm(f => ({ ...f, selectedCode: '', name: '', code: '', flag: '', currency: '', currencyName: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !form.selectedCode) { setError('Please select a country'); return; }
    setSubmitting(true);
    try {
      const payload = { name: form.name, code: form.code, flag: form.flag, currency: form.currency, currencyName: form.currencyName, isSendCountry: form.isSendCountry, isReceiveCountry: form.isReceiveCountry, isActive: form.isActive, priority: form.priority };
      if (editing) {
        await adminUpdateCountry(editing._id, payload);
      } else {
        await adminCreateCountry(payload);
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Failed to save country');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportAll = async () => {
    if (availableToAdd.length === 0) { setError('All countries are already imported'); return; }
    if (!confirm(`Import all ${availableToAdd.length} remaining countries? They will be added as inactive by default.`)) return;
    setImporting(true);
    setError('');
    try {
      for (const info of availableToAdd) {
        await adminCreateCountry({ name: info.name, code: info.code, flag: info.flag, currency: info.currency, currencyName: info.currencyName, isSendCountry: false, isReceiveCountry: false, isActive: false });
      }
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Failed to import all countries');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this country?')) return;
    try {
      await adminDeleteCountry(id);
      load();
    } catch {
      setError('Failed to delete country');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Countries</h1>
        </div>
        <div className="flex items-center gap-2">
          {availableToAdd.length > 0 && (
            <button
              onClick={handleImportAll}
              disabled={importing}
              className="flex items-center gap-2 border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {importing ? 'Importing…' : `Import All (${availableToAdd.length})`}
            </button>
          )}
          <button onClick={openAdd} disabled={availableToAdd.length === 0} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40">
            <Plus className="w-4 h-4" /> Add Country
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit Country' : 'Add Country'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editing ? (
              /* Edit mode — identity is read-only, only checkboxes are editable */
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-3xl">{form.flag}</span>
                <div>
                  <p className="font-semibold text-gray-800">{form.name}</p>
                  <p className="text-sm text-gray-500">{form.code} · {form.currency} — {form.currencyName}</p>
                </div>
              </div>
            ) : (
              /* Add mode — single dropdown */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Country *</label>
                <select
                  required
                  value={form.selectedCode}
                  onChange={e => handleCountrySelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">— Choose a country —</option>
                  {availableToAdd.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
                {form.selectedCode && (
                  <p className="mt-1 text-xs text-gray-500">
                    Currency: <strong>{form.currency}</strong> — {form.currencyName} &nbsp;·&nbsp; Flag: {form.flag}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Priority
                <span className="ml-1 text-xs text-gray-400 font-normal">(lower = shown first in Best Rates)</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Saving…' : editing ? 'Update' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : countries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No countries yet. Add one or use "Import All" to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Flag</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Currency</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Priority</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {countries.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xl">{c.flag || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{c.code}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.currency ? (
                        <span><span className="font-medium">{c.currency}</span><span className="text-gray-400 text-xs ml-1">· {c.currencyName}</span></span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {c.priority ?? 999}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
}
