import { useEffect, useState } from 'react';
import type { Remitter, RemittanceRate, RemitterCountry } from '../../types';
import {
  adminGetRemitters,
  adminUpdateRemitterStatus,
  adminCreateRemitter,
  adminUpdateRemitterProfile,
  adminGetRemitterRates,
  adminCreateRateForRemitter,
  adminUpdateRateForRemitter,
  adminDeleteRateForRemitter,
  adminToggleRemitterCountry,
} from '../../api';
import { COUNTRY_LIST, getCountryByCode } from '../../constants/countries';
import { CheckCircle, XCircle, Clock, PlusCircle, ChevronDown, ChevronUp, Pencil, Trash2, X, Globe } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

const EMPTY_REMITTER = { name: '', email: '', password: '', brandName: '', legalName: '', baseCountry: '', phone: '', website: '', description: '' };
const EMPTY_EDIT = { brandName: '', legalName: '', baseCountry: '', phone: '', website: '', remittanceUrl: '', description: '', logo: '' };
const EMPTY_RATE = { fromCurrency: '', toCurrency: '', rate: '', unit: '1', fee: '0' };

export default function AdminRemitters() {
  const [remitters, setRemitters] = useState<Remitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Add remitter modal
  const [showAddRemitter, setShowAddRemitter] = useState(false);
  const [remitterForm, setRemitterForm] = useState(EMPTY_REMITTER);
  const [remitterSaving, setRemitterSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Per-remitter rate panel
  const [expandedRemitter, setExpandedRemitter] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, RemittanceRate[]>>({});
  const [ratesLoading, setRatesLoading] = useState<string | null>(null);

  // Per-remitter countries panel
  const [expandedCountriesRemitter, setExpandedCountriesRemitter] = useState<string | null>(null);
  const [countryTogglingKey, setCountryTogglingKey] = useState<string | null>(null);

  // Rate form (inline add / edit)
  const [rateForm, setRateForm] = useState(EMPTY_RATE);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [addingRateFor, setAddingRateFor] = useState<string | null>(null);
  const [rateSaving, setRateSaving] = useState(false);

  // Edit remitter profile
  const [editingRemitter, setEditingRemitter] = useState<Remitter | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    adminGetRemitters()
      .then((res) => setRemitters(res.data.remitters))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await adminUpdateRemitterStatus(id, status);
      setRemitters((prev) => prev.map((v) => (v._id === id ? res.data.remitter : v)));
    } catch {
      alert('Failed to update remitter status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateRemitter = async (e: React.FormEvent) => {
    e.preventDefault();
    setRemitterSaving(true);
    try {
      const { password, ...rest } = remitterForm;
      const payload = password ? { ...rest, password } : rest;
      const res = await adminCreateRemitter(payload);
      setRemitters((prev) => [res.data.remitter, ...prev]);
      if (res.data.tempPassword) setTempPassword(res.data.tempPassword);
      else { setShowAddRemitter(false); setRemitterForm(EMPTY_REMITTER); }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Failed to create remitter.');
    } finally {
      setRemitterSaving(false);
    }
  };

  const startEditRemitter = (remitter: Remitter) => {
    setEditingRemitter(remitter);
    setEditForm({
      brandName: remitter.brandName || '',
      legalName: remitter.legalName,
      baseCountry: remitter.baseCountry,
      phone: remitter.phone,
      website: remitter.website,
      remittanceUrl: remitter.remittanceUrl || '',
      description: remitter.description,
      logo: remitter.logo,
    });
  };

  const handleEditRemitter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemitter) return;
    setEditSaving(true);
    try {
      const res = await adminUpdateRemitterProfile(editingRemitter._id, editForm);
      setRemitters((prev) => prev.map((v) => v._id === editingRemitter._id ? res.data.remitter : v));
      setEditingRemitter(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Failed to update remitter.');
    } finally {
      setEditSaving(false);
    }
  };

  const toggleRates = async (remitterId: string) => {
    if (expandedRemitter === remitterId) {
      setExpandedRemitter(null);
      setAddingRateFor(null);
      setEditingRateId(null);
      return;
    }
    setExpandedRemitter(remitterId);
    setAddingRateFor(null);
    setEditingRateId(null);
    if (!rates[remitterId]) {
      setRatesLoading(remitterId);
      try {
        const res = await adminGetRemitterRates(remitterId);
        setRates((prev) => ({ ...prev, [remitterId]: res.data.rates }));
      } catch {
        alert('Failed to load rates.');
      } finally {
        setRatesLoading(null);
      }
    }
  };

  const startAddRate = (remitterId: string) => {
    setAddingRateFor(remitterId);
    setEditingRateId(null);
    setRateForm(EMPTY_RATE);
  };

  const startEditRate = (r: RemittanceRate) => {
    setEditingRateId(r._id);
    setAddingRateFor(null);
    setRateForm({ fromCurrency: r.fromCurrency, toCurrency: r.toCurrency, rate: String(r.rate), unit: String(r.unit ?? 1), fee: String(r.fee ?? 0) });
  };

  const countryLabel = (currency: string) => {
    const c = COUNTRY_LIST.find((x) => x.currency === currency);
    return c ? `${c.flag} ${c.name}` : currency;
  };

  const saveRate = async (remitterId: string) => {
    setRateSaving(true);
    try {
      const data = { fromCurrency: rateForm.fromCurrency.toUpperCase(), toCurrency: rateForm.toCurrency.toUpperCase(), rate: Number(rateForm.rate), unit: Number(rateForm.unit), fee: Number(rateForm.fee) };
      if (editingRateId) {
        const res = await adminUpdateRateForRemitter(remitterId, editingRateId, data);
        setRates((prev) => ({ ...prev, [remitterId]: prev[remitterId].map((r) => r._id === editingRateId ? res.data.rate : r) }));
      } else {
        const res = await adminCreateRateForRemitter(remitterId, data);
        setRates((prev) => ({ ...prev, [remitterId]: [...(prev[remitterId] || []), res.data.rate] }));
      }
      setAddingRateFor(null);
      setEditingRateId(null);
      setRateForm(EMPTY_RATE);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Failed to save rate.');
    } finally {
      setRateSaving(false);
    }
  };

  const toggleCountriesPanel = (remitterId: string) => {
    setExpandedCountriesRemitter((prev) => (prev === remitterId ? null : remitterId));
    setExpandedRemitter(null);
  };

  const handleToggleCountryActive = async (remitter: Remitter, country: RemitterCountry) => {
    const key = `${remitter._id}-${country.countryCode}`;
    setCountryTogglingKey(key);
    try {
      const res = await adminToggleRemitterCountry(remitter._id, country.countryCode, !country.isActive);
      setRemitters((prev) => prev.map((v) => v._id === remitter._id ? res.data.remitter : v));
    } catch {
      alert('Failed to toggle country status.');
    } finally {
      setCountryTogglingKey(null);
    }
  };

  const deleteRate = async (remitterId: string, rateId: string) => {
    if (!confirm('Delete this rate?')) return;
    try {
      await adminDeleteRateForRemitter(remitterId, rateId);
      setRates((prev) => ({ ...prev, [remitterId]: prev[remitterId].filter((r) => r._id !== rateId) }));
    } catch {
      alert('Failed to delete rate.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Remitter Management</h1>
        <button
          onClick={() => { setShowAddRemitter(true); setTempPassword(null); setRemitterForm(EMPTY_REMITTER); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <PlusCircle className="w-4 h-4" /> Add Remitter
        </button>
      </div>

      {/* Add Remitter Modal */}
      {showAddRemitter && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add New Remitter</h2>
              <button onClick={() => setShowAddRemitter(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {tempPassword ? (
              <div className="px-6 py-8 text-center space-y-4">
                <p className="text-gray-700">Remitter created successfully! Share this temporary password with them:</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-6 py-4">
                  <p className="text-lg font-mono font-bold text-yellow-800 select-all">{tempPassword}</p>
                </div>
                <p className="text-xs text-gray-500">This password will not be shown again.</p>
                <button
                  onClick={() => { setShowAddRemitter(false); setRemitterForm(EMPTY_REMITTER); setTempPassword(null); }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateRemitter} className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">User Name *</label>
                    <input required value={remitterForm.name} onChange={(e) => setRemitterForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input required type="email" value={remitterForm.email} onChange={(e) => setRemitterForm((p) => ({ ...p, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name *</label>
                    <input required value={remitterForm.brandName} onChange={(e) => setRemitterForm((p) => ({ ...p, brandName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Legal Name *</label>
                    <input required value={remitterForm.legalName} onChange={(e) => setRemitterForm((p) => ({ ...p, legalName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Base Country</label>
                    <input value={remitterForm.baseCountry} onChange={(e) => setRemitterForm((p) => ({ ...p, baseCountry: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input value={remitterForm.phone} onChange={(e) => setRemitterForm((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                    <input value={remitterForm.website} onChange={(e) => setRemitterForm((p) => ({ ...p, website: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password <span className="text-gray-400">(leave blank to auto-generate)</span></label>
                  <input type="password" value={remitterForm.password} onChange={(e) => setRemitterForm((p) => ({ ...p, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddRemitter(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={remitterSaving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {remitterSaving ? 'Creating…' : 'Create Remitter'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Remitter Modal */}
      {editingRemitter && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Edit Remitter Profile</h2>
              <button onClick={() => setEditingRemitter(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditRemitter} className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name</label>
                  <input value={editForm.brandName} onChange={(e) => setEditForm((p) => ({ ...p, brandName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Legal Name *</label>
                  <input required value={editForm.legalName} onChange={(e) => setEditForm((p) => ({ ...p, legalName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Base Country</label>
                  <input value={editForm.baseCountry} onChange={(e) => setEditForm((p) => ({ ...p, baseCountry: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                  <input value={editForm.website} onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Remittance URL</label>
                  <input value={editForm.remittanceUrl} onChange={(e) => setEditForm((p) => ({ ...p, remittanceUrl: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Logo URL</label>
                  <input value={editForm.logo} onChange={(e) => setEditForm((p) => ({ ...p, logo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingRemitter(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editSaving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-lg" />)}
        </div>
      ) : remitters.length === 0 ? (
        <p className="text-gray-500">No remitters found.</p>
      ) : (
        <div className="space-y-2">
          {remitters.map((remitter) => (
            <div key={remitter._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Remitter row */}
              <div className="flex items-center px-6 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{remitter.brandName || remitter.legalName}</p>
                  {remitter.brandName && remitter.legalName && remitter.brandName !== remitter.legalName && <p className="text-xs text-gray-400">{remitter.legalName}</p>}
                  <p className="text-xs text-gray-400">{typeof remitter.userId === 'object' ? remitter.userId.name : ''}</p>
                </div>
                <div className="text-sm text-gray-600 w-48 hidden sm:block truncate">{remitter.email}</div>
                <div className="text-sm text-gray-600 w-28 hidden md:block">{remitter.baseCountry}</div>
                <div className="w-24">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[remitter.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {remitter.status}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => startEditRemitter(remitter)} title="Edit Profile" className="text-gray-500 hover:text-gray-700"><Pencil className="w-5 h-5" /></button>
                  {remitter.status !== 'approved' && (
                    <button onClick={() => updateStatus(remitter._id, 'approved')} disabled={updating === remitter._id} title="Approve" className="text-green-600 hover:text-green-800 disabled:opacity-40"><CheckCircle className="w-5 h-5" /></button>
                  )}
                  {remitter.status !== 'pending' && (
                    <button onClick={() => updateStatus(remitter._id, 'pending')} disabled={updating === remitter._id} title="Set Pending" className="text-yellow-500 hover:text-yellow-700 disabled:opacity-40"><Clock className="w-5 h-5" /></button>
                  )}
                  {remitter.status !== 'rejected' && (
                    <button onClick={() => updateStatus(remitter._id, 'rejected')} disabled={updating === remitter._id} title="Reject" className="text-red-500 hover:text-red-700 disabled:opacity-40"><XCircle className="w-5 h-5" /></button>
                  )}
                  <button onClick={() => toggleRates(remitter._id)} title="Manage Rates" className="ml-2 text-indigo-500 hover:text-indigo-700 flex items-center gap-1 text-xs font-medium border border-indigo-200 rounded px-2 py-1">
                    Rates {expandedRemitter === remitter._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button onClick={() => toggleCountriesPanel(remitter._id)} title="Manage Countries" className="ml-1 text-teal-600 hover:text-teal-800 flex items-center gap-1 text-xs font-medium border border-teal-200 rounded px-2 py-1">
                    <Globe className="w-3 h-3" /> Countries {expandedCountriesRemitter === remitter._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Countries panel */}
              {expandedCountriesRemitter === remitter._id && (
                <div className="border-t border-gray-100 bg-teal-50/40 px-6 py-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Supported Countries</h3>
                  {(remitter.supportedCountries ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400">No countries configured by this remitter yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase border-b border-teal-100">
                          <th className="text-left py-1 pr-4">Country</th>
                          <th className="text-left py-1 pr-4">Currency</th>
                          <th className="text-center py-1 pr-4">Can Send</th>
                          <th className="text-center py-1 pr-4">Can Receive</th>
                          <th className="text-center py-1">Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-50">
                        {(remitter.supportedCountries ?? []).map((c) => {
                          const info = getCountryByCode(c.countryCode);
                          const key = `${remitter._id}-${c.countryCode}`;
                          return (
                            <tr key={c.countryCode} className="hover:bg-white">
                              <td className="py-1.5 pr-4">
                                <span className="mr-1">{info?.flag ?? '🌍'}</span>
                                <span className="font-medium text-gray-800">{info?.name ?? c.countryCode}</span>
                              </td>
                              <td className="py-1.5 pr-4 text-gray-500">{info?.currency ?? '—'}</td>
                              <td className="py-1.5 pr-4 text-center">{c.canSend ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                              <td className="py-1.5 pr-4 text-center">{c.canReceive ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                              <td className="py-1.5 text-center">
                                <button
                                  disabled={countryTogglingKey === key}
                                  onClick={() => handleToggleCountryActive(remitter, c)}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                                    c.isActive ? 'bg-teal-500' : 'bg-gray-300'
                                  }`}
                                  title={c.isActive ? 'Click to deactivate' : 'Click to activate'}
                                >
                                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                    c.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                                  }`} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Rates panel */}
              {expandedRemitter === remitter._id && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Remittance Rates</h3>
                    <button onClick={() => startAddRate(remitter._id)} className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
                      <PlusCircle className="w-3 h-3" /> Add Rate
                    </button>
                  </div>

                  {ratesLoading === remitter._id ? (
                    <div className="text-sm text-gray-500">Loading rates…</div>
                  ) : (
                    <>
                      {(rates[remitter._id] || []).length === 0 && addingRateFor !== remitter._id && (
                        <p className="text-sm text-gray-400">No rates yet. Click "Add Rate" to add one.</p>
                      )}

                      {(rates[remitter._id] || []).length > 0 && (
                        <table className="w-full text-sm mb-3">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase">
                              <th className="text-left py-1 pr-4">From</th>
                              <th className="text-left py-1 pr-4">To</th>
                              <th className="text-left py-1 pr-4">Rate</th>
                              <th className="text-left py-1 pr-4">Unit</th>
                              <th className="text-left py-1 pr-4">Fee</th>
                              <th className="py-1"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(rates[remitter._id] || []).map((r) => (
                              editingRateId === r._id ? (
                                <tr key={r._id} className="bg-indigo-50">
                                  <td className="py-1.5 pr-4 font-medium text-gray-700 text-sm">{countryLabel(r.fromCurrency)}</td>
                                  <td className="py-1.5 pr-4 text-gray-600 text-sm">{countryLabel(r.toCurrency)}</td>
                                  <td className="py-1 pr-2"><input type="number" step="any" value={rateForm.rate} onChange={(e) => setRateForm((p) => ({ ...p, rate: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 w-24 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" /></td>
                                  <td className="py-1 pr-2"><input type="number" value={rateForm.unit} onChange={(e) => setRateForm((p) => ({ ...p, unit: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 w-16 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" /></td>
                                  <td className="py-1 pr-2"><input type="number" step="any" value={rateForm.fee} onChange={(e) => setRateForm((p) => ({ ...p, fee: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 w-16 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" /></td>
                                  <td className="py-1 flex gap-1">
                                    <button onClick={() => saveRate(remitter._id)} disabled={rateSaving} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">Save</button>
                                    <button onClick={() => setEditingRateId(null)} className="text-xs text-gray-500 hover:text-gray-700 px-1">Cancel</button>
                                  </td>
                                </tr>
                              ) : (
                                <tr key={r._id} className="hover:bg-white">
                                  <td className="py-1.5 pr-4 font-medium text-gray-700">{countryLabel(r.fromCurrency)}</td>
                                  <td className="py-1.5 pr-4 text-gray-600">{countryLabel(r.toCurrency)}</td>
                                  <td className="py-1.5 pr-4 text-gray-800">{r.rate}</td>
                                  <td className="py-1.5 pr-4 text-gray-600">{r.unit}</td>
                                  <td className="py-1.5 pr-4 text-gray-600">{r.fee}</td>
                                  <td className="py-1.5 flex gap-2">
                                    <button onClick={() => startEditRate(r)} className="text-indigo-500 hover:text-indigo-700"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => deleteRate(remitter._id, r._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                  </td>
                                </tr>
                              )
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Inline add rate form */}
                      {addingRateFor === remitter._id && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-700">New Rate</p>
                            <button onClick={() => setAddingRateFor(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="flex flex-wrap gap-3 items-end">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">From Country</label>
                              <select
                                required
                                value={rateForm.fromCurrency}
                                onChange={(e) => setRateForm((p) => ({ ...p, fromCurrency: e.target.value }))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[180px]"
                              >
                                <option value="">Select country…</option>
                                {COUNTRY_LIST.map((c) => (
                                  <option key={c.code} value={c.currency}>{c.flag} {c.name} ({c.currency})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">To Country</label>
                              <select
                                required
                                value={rateForm.toCurrency}
                                onChange={(e) => setRateForm((p) => ({ ...p, toCurrency: e.target.value }))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[180px]"
                              >
                                <option value="">Select country…</option>
                                {COUNTRY_LIST.map((c) => (
                                  <option key={c.code} value={c.currency}>{c.flag} {c.name} ({c.currency})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Rate</label>
                              <input type="number" step="any" placeholder="132.50" value={rateForm.rate} onChange={(e) => setRateForm((p) => ({ ...p, rate: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Unit</label>
                              <input type="number" value={rateForm.unit} onChange={(e) => setRateForm((p) => ({ ...p, unit: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Fee</label>
                              <input type="number" step="any" value={rateForm.fee} onChange={(e) => setRateForm((p) => ({ ...p, fee: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button onClick={() => saveRate(remitter._id)} disabled={rateSaving || !rateForm.fromCurrency || !rateForm.toCurrency || !rateForm.rate} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                              {rateSaving ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

