import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeftRight, Star } from 'lucide-react';
import {
  adminGetCountries,
  adminGetVendors,
  adminGetPartnerRoutes,
  adminCreatePartnerRoute,
  adminUpdatePartnerRoute,
  adminDeletePartnerRoute,
} from '../../api';
import type { Country, Vendor, PartnerRoute, Partner } from '../../types';

interface RouteForm {
  sendCountry: string;
  receiveCountry: string;
  isActive: boolean;
  // partner fields
  description: string;
  featured: boolean;
  vendorId: string;
}

const EMPTY: RouteForm = {
  sendCountry: '',
  receiveCountry: '',
  isActive: true,
  description: '',
  featured: false,
  vendorId: '',
};

function getCountry(val: Country | string, list: Country[]): Country | undefined {
  if (typeof val === 'object') return val;
  return list.find(c => c._id === val);
}

function getPartnerObj(val: Partner | string | undefined): Partner | undefined {
  if (!val || typeof val === 'string') return undefined;
  return val;
}

export default function AdminPartnerRoutes() {
  const [routes, setRoutes] = useState<PartnerRoute[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PartnerRoute | null>(null);
  const [form, setForm] = useState<RouteForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [routesRes, countriesRes, vendorsRes] = await Promise.all([
        adminGetPartnerRoutes(),
        adminGetCountries(),
        adminGetVendors(),
      ]);
      setRoutes(routesRes.data.routes);
      setCountries(countriesRes.data.countries);
      setVendors(vendorsRes.data.vendors.filter(v => v.status === 'approved'));
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeCountries = countries.filter(c => c.isActive);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (r: PartnerRoute) => {
    setEditing(r);
    const p = getPartnerObj(r.partner);
    setForm({
      sendCountry: typeof r.sendCountry === 'object' ? r.sendCountry._id : r.sendCountry,
      receiveCountry: typeof r.receiveCountry === 'object' ? r.receiveCountry._id : r.receiveCountry,
      isActive: r.isActive,
      description: p?.description ?? '',
      featured: p?.featured ?? false,
      vendorId: p?.vendorId ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sendCountry || !form.receiveCountry) {
      setError('Send country and receive country are required');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdatePartnerRoute(editing._id, form);
      } else {
        await adminCreatePartnerRoute(form);
      }
      setShowForm(false);
      setError('');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Failed to save partner route');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner route and its partner record?')) return;
    try {
      await adminDeletePartnerRoute(id);
      load();
    } catch {
      setError('Failed to delete partner route');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Partners</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Assign one partner per <span className="font-medium text-gray-700">Send Country → Receive Country</span> corridor. The linked vendor's rates are pinned first in search results.
      </p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit Partner' : 'Add Partner'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Corridor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send From *</label>
              {activeCountries.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">No active countries. Go to Countries and activate some.</p>
              ) : (
                <select required value={form.sendCountry} onChange={e => setForm(f => ({ ...f, sendCountry: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="">— Select send country —</option>
                  {activeCountries.map(c => (
                    <option key={c._id} value={c._id}>{c.flag ? `${c.flag} ` : ''}{c.name} ({c.code})</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send To *</label>
              {activeCountries.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">No active countries. Go to Countries and activate some.</p>
              ) : (
                <select required value={form.receiveCountry} onChange={e => setForm(f => ({ ...f, receiveCountry: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="">— Select receive country —</option>
                  {activeCountries.map(c => (
                    <option key={c._id} value={c._id}>{c.flag ? `${c.flag} ` : ''}{c.name} ({c.code})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Partner details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner <span className="text-gray-400">(pins their rates first)</span></label>
              <select value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">— No linked vendor —</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.companyName}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Brief description…" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                  className="w-4 h-4 rounded accent-yellow-500" />
                <span className="text-sm text-gray-700 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" /> Featured</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
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
        ) : routes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No partners yet. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Corridor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Partner</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Linked Vendor</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Featured</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routes.map(r => {
                  const send = getCountry(r.sendCountry, countries);
                  const receive = getCountry(r.receiveCountry, countries);
                  const partner = getPartnerObj(r.partner);
                  const linkedVendor = vendors.find(v => v._id === partner?.vendorId);
                  return (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            {send?.flag && <span className="text-base">{send.flag}</span>}
                            <span className="font-medium text-gray-800">{send?.name ?? '—'}</span>
                            <span className="text-xs text-gray-400 font-mono">{send?.code}</span>
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="flex items-center gap-1">
                            {receive?.flag && <span className="text-base">{receive.flag}</span>}
                            <span className="font-medium text-gray-800">{receive?.name ?? '—'}</span>
                            <span className="text-xs text-gray-400 font-mono">{receive?.code}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {partner?.logoUrl && (
                            <img src={partner.logoUrl} alt={partner.name} className="h-6 w-10 object-contain rounded" />
                          )}
                          <div>
                            <div className="font-medium text-gray-800">{partner?.name ?? '—'}</div>
                            {partner?.website && (
                              <a href={partner.website} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline">{partner.website}</a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-sm">
                        {linkedVendor ? linkedVendor.companyName : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {partner?.featured
                          ? <Star className="w-4 h-4 text-yellow-500 mx-auto" />
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(r)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(r._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
