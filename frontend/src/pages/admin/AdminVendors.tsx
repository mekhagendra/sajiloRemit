import { useEffect, useState } from 'react';
import type { Vendor, RemittanceRate, VendorCountry } from '../../types';
import {
  adminGetVendors,
  adminUpdateVendorStatus,
  adminCreateAgent,
  adminGetVendorRates,
  adminCreateRateForVendor,
  adminUpdateRateForVendor,
  adminDeleteRateForVendor,
  adminToggleVendorCountry,
} from '../../api';
import { COUNTRY_LIST, getCountryByCode } from '../../constants/countries';
import { CheckCircle, XCircle, Clock, PlusCircle, ChevronDown, ChevronUp, Pencil, Trash2, X, Globe } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

const EMPTY_AGENT = { name: '', email: '', password: '', companyName: '', baseCountry: '', phone: '', website: '', description: '' };
const EMPTY_RATE = { fromCurrency: '', toCurrency: '', rate: '', unit: '1', fee: '0' };

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Add agent modal
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [agentForm, setAgentForm] = useState(EMPTY_AGENT);
  const [agentSaving, setAgentSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Per-vendor rate panel
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, RemittanceRate[]>>({});
  const [ratesLoading, setRatesLoading] = useState<string | null>(null);

  // Per-vendor countries panel
  const [expandedCountriesVendor, setExpandedCountriesVendor] = useState<string | null>(null);
  const [countryTogglingKey, setCountryTogglingKey] = useState<string | null>(null);

  // Rate form (inline add / edit)
  const [rateForm, setRateForm] = useState(EMPTY_RATE);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [addingRateFor, setAddingRateFor] = useState<string | null>(null);
  const [rateSaving, setRateSaving] = useState(false);

  useEffect(() => {
    adminGetVendors()
      .then((res) => setVendors(res.data.vendors))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await adminUpdateVendorStatus(id, status);
      setVendors((prev) => prev.map((v) => (v._id === id ? res.data.vendor : v)));
    } catch {
      alert('Failed to update vendor status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentSaving(true);
    try {
      const { password, ...rest } = agentForm;
      const payload = password ? { ...rest, password } : rest;
      const res = await adminCreateAgent(payload);
      setVendors((prev) => [res.data.vendor, ...prev]);
      if (res.data.tempPassword) setTempPassword(res.data.tempPassword);
      else { setShowAddAgent(false); setAgentForm(EMPTY_AGENT); }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Failed to create agent.');
    } finally {
      setAgentSaving(false);
    }
  };

  const toggleRates = async (vendorId: string) => {
    if (expandedVendor === vendorId) {
      setExpandedVendor(null);
      setAddingRateFor(null);
      setEditingRateId(null);
      return;
    }
    setExpandedVendor(vendorId);
    setAddingRateFor(null);
    setEditingRateId(null);
    if (!rates[vendorId]) {
      setRatesLoading(vendorId);
      try {
        const res = await adminGetVendorRates(vendorId);
        setRates((prev) => ({ ...prev, [vendorId]: res.data.rates }));
      } catch {
        alert('Failed to load rates.');
      } finally {
        setRatesLoading(null);
      }
    }
  };

  const startAddRate = (vendorId: string) => {
    setAddingRateFor(vendorId);
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

  const saveRate = async (vendorId: string) => {
    setRateSaving(true);
    try {
      const data = { fromCurrency: rateForm.fromCurrency.toUpperCase(), toCurrency: rateForm.toCurrency.toUpperCase(), rate: Number(rateForm.rate), unit: Number(rateForm.unit), fee: Number(rateForm.fee) };
      if (editingRateId) {
        const res = await adminUpdateRateForVendor(vendorId, editingRateId, data);
        setRates((prev) => ({ ...prev, [vendorId]: prev[vendorId].map((r) => r._id === editingRateId ? res.data.rate : r) }));
      } else {
        const res = await adminCreateRateForVendor(vendorId, data);
        setRates((prev) => ({ ...prev, [vendorId]: [...(prev[vendorId] || []), res.data.rate] }));
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

  const toggleCountriesPanel = (vendorId: string) => {
    setExpandedCountriesVendor((prev) => (prev === vendorId ? null : vendorId));
    setExpandedVendor(null);
  };

  const handleToggleCountryActive = async (vendor: Vendor, country: VendorCountry) => {
    const key = `${vendor._id}-${country.countryCode}`;
    setCountryTogglingKey(key);
    try {
      const res = await adminToggleVendorCountry(vendor._id, country.countryCode, !country.isActive);
      setVendors((prev) => prev.map((v) => v._id === vendor._id ? res.data.vendor : v));
    } catch {
      alert('Failed to toggle country status.');
    } finally {
      setCountryTogglingKey(null);
    }
  };

  const deleteRate = async (vendorId: string, rateId: string) => {
    if (!confirm('Delete this rate?')) return;
    try {
      await adminDeleteRateForVendor(vendorId, rateId);
      setRates((prev) => ({ ...prev, [vendorId]: prev[vendorId].filter((r) => r._id !== rateId) }));
    } catch {
      alert('Failed to delete rate.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent / Vendor Management</h1>
        <button
          onClick={() => { setShowAddAgent(true); setTempPassword(null); setAgentForm(EMPTY_AGENT); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <PlusCircle className="w-4 h-4" /> Add Agent
        </button>
      </div>

      {/* Add Agent Modal */}
      {showAddAgent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add New Agent</h2>
              <button onClick={() => setShowAddAgent(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {tempPassword ? (
              <div className="px-6 py-8 text-center space-y-4">
                <p className="text-gray-700">Agent created successfully! Share this temporary password with them:</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-6 py-4">
                  <p className="text-lg font-mono font-bold text-yellow-800 select-all">{tempPassword}</p>
                </div>
                <p className="text-xs text-gray-500">This password will not be shown again.</p>
                <button
                  onClick={() => { setShowAddAgent(false); setAgentForm(EMPTY_AGENT); setTempPassword(null); }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateAgent} className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                    <input required value={agentForm.name} onChange={(e) => setAgentForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input required type="email" value={agentForm.email} onChange={(e) => setAgentForm((p) => ({ ...p, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
                    <input required value={agentForm.companyName} onChange={(e) => setAgentForm((p) => ({ ...p, companyName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Base Country</label>
                    <input value={agentForm.baseCountry} onChange={(e) => setAgentForm((p) => ({ ...p, baseCountry: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input value={agentForm.phone} onChange={(e) => setAgentForm((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                    <input value={agentForm.website} onChange={(e) => setAgentForm((p) => ({ ...p, website: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password <span className="text-gray-400">(leave blank to auto-generate)</span></label>
                  <input type="password" value={agentForm.password} onChange={(e) => setAgentForm((p) => ({ ...p, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddAgent(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={agentSaving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {agentSaving ? 'Creating…' : 'Create Agent'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-lg" />)}
        </div>
      ) : vendors.length === 0 ? (
        <p className="text-gray-500">No vendors found.</p>
      ) : (
        <div className="space-y-2">
          {vendors.map((vendor) => (
            <div key={vendor._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Vendor row */}
              <div className="flex items-center px-6 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{vendor.companyName}</p>
                  <p className="text-xs text-gray-400">{typeof vendor.userId === 'object' ? vendor.userId.name : ''}</p>
                </div>
                <div className="text-sm text-gray-600 w-48 hidden sm:block truncate">{vendor.email}</div>
                <div className="text-sm text-gray-600 w-28 hidden md:block">{vendor.baseCountry}</div>
                <div className="w-24">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[vendor.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {vendor.status}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {vendor.status !== 'approved' && (
                    <button onClick={() => updateStatus(vendor._id, 'approved')} disabled={updating === vendor._id} title="Approve" className="text-green-600 hover:text-green-800 disabled:opacity-40"><CheckCircle className="w-5 h-5" /></button>
                  )}
                  {vendor.status !== 'pending' && (
                    <button onClick={() => updateStatus(vendor._id, 'pending')} disabled={updating === vendor._id} title="Set Pending" className="text-yellow-500 hover:text-yellow-700 disabled:opacity-40"><Clock className="w-5 h-5" /></button>
                  )}
                  {vendor.status !== 'rejected' && (
                    <button onClick={() => updateStatus(vendor._id, 'rejected')} disabled={updating === vendor._id} title="Reject" className="text-red-500 hover:text-red-700 disabled:opacity-40"><XCircle className="w-5 h-5" /></button>
                  )}
                  <button onClick={() => toggleRates(vendor._id)} title="Manage Rates" className="ml-2 text-indigo-500 hover:text-indigo-700 flex items-center gap-1 text-xs font-medium border border-indigo-200 rounded px-2 py-1">
                    Rates {expandedVendor === vendor._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button onClick={() => toggleCountriesPanel(vendor._id)} title="Manage Countries" className="ml-1 text-teal-600 hover:text-teal-800 flex items-center gap-1 text-xs font-medium border border-teal-200 rounded px-2 py-1">
                    <Globe className="w-3 h-3" /> Countries {expandedCountriesVendor === vendor._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Countries panel */}
              {expandedCountriesVendor === vendor._id && (
                <div className="border-t border-gray-100 bg-teal-50/40 px-6 py-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Supported Countries</h3>
                  {(vendor.supportedCountries ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400">No countries configured by this vendor yet.</p>
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
                        {(vendor.supportedCountries ?? []).map((c) => {
                          const info = getCountryByCode(c.countryCode);
                          const key = `${vendor._id}-${c.countryCode}`;
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
                                  onClick={() => handleToggleCountryActive(vendor, c)}
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
              {expandedVendor === vendor._id && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Remittance Rates</h3>
                    <button onClick={() => startAddRate(vendor._id)} className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
                      <PlusCircle className="w-3 h-3" /> Add Rate
                    </button>
                  </div>

                  {ratesLoading === vendor._id ? (
                    <div className="text-sm text-gray-500">Loading rates…</div>
                  ) : (
                    <>
                      {(rates[vendor._id] || []).length === 0 && addingRateFor !== vendor._id && (
                        <p className="text-sm text-gray-400">No rates yet. Click "Add Rate" to add one.</p>
                      )}

                      {(rates[vendor._id] || []).length > 0 && (
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
                            {(rates[vendor._id] || []).map((r) => (
                              editingRateId === r._id ? (
                                <tr key={r._id} className="bg-indigo-50">
                                  <td className="py-1.5 pr-4 font-medium text-gray-700 text-sm">{countryLabel(r.fromCurrency)}</td>
                                  <td className="py-1.5 pr-4 text-gray-600 text-sm">{countryLabel(r.toCurrency)}</td>
                                  <td className="py-1 pr-2"><input type="number" step="any" value={rateForm.rate} onChange={(e) => setRateForm((p) => ({ ...p, rate: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 w-24 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" /></td>
                                  <td className="py-1 pr-2"><input type="number" value={rateForm.unit} onChange={(e) => setRateForm((p) => ({ ...p, unit: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 w-16 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" /></td>
                                  <td className="py-1 pr-2"><input type="number" step="any" value={rateForm.fee} onChange={(e) => setRateForm((p) => ({ ...p, fee: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 w-16 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" /></td>
                                  <td className="py-1 flex gap-1">
                                    <button onClick={() => saveRate(vendor._id)} disabled={rateSaving} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">Save</button>
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
                                    <button onClick={() => deleteRate(vendor._id, r._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                  </td>
                                </tr>
                              )
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Inline add rate form */}
                      {addingRateFor === vendor._id && (
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
                            <button onClick={() => saveRate(vendor._id)} disabled={rateSaving || !rateForm.fromCurrency || !rateForm.toCurrency || !rateForm.rate} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
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

