import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyRemitterProfile, updateMyRemitterProfile, getMyRates, addRate, updateRate, deleteRate, upsertRemitterCountry, removeRemitterCountry } from '../api';
import type { Remitter, RemittanceRate, RemitterCountry } from '../types';
import { COUNTRY_LIST, getCountryByCode } from '../constants/countries';
import { PlusCircle, Trash2, Pencil, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  approved: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: <CheckCircle className="w-5 h-5" /> },
  pending:  { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: <Clock className="w-5 h-5" /> },
  rejected: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <AlertTriangle className="w-5 h-5" /> },
  suspended:{ bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', icon: <AlertTriangle className="w-5 h-5" /> },
};

const STATUS_MESSAGES: Record<string, string> = {
  pending:  'Your remitter application is under review. You will be notified once approved.',
  rejected: 'Your remitter application was rejected. Please contact support for more information.',
  suspended:'Your remitter account has been suspended. Please contact support.',
};

const EMPTY_RATE = { fromCurrency: '', toCurrency: '', rate: '', unit: '1', fee: '0' };

export default function RemitterDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [remitter, setRemitter] = useState<Remitter | null>(null);
  const [rates, setRates] = useState<RemittanceRate[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Rate form
  const [showRateForm, setShowRateForm] = useState(false);
  const [rateForm, setRateForm] = useState(EMPTY_RATE);
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState('');

  // Rate edit
  const [editingRate, setEditingRate] = useState<RemittanceRate | null>(null);
  const [editRateForm, setEditRateForm] = useState({ rate: '', unit: '1', fee: '0' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<Remitter>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Country management
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCanSend, setNewCanSend] = useState(false);
  const [newCanReceive, setNewCanReceive] = useState(false);
  const [countrySaving, setCountrySaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    Promise.all([getMyRemitterProfile(), getMyRates()])
      .then(([vRes, rRes]) => {
        setRemitter(vRes.data.remitter);
        setRates(rRes.data.rates);
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
        else setLoadError(true);
      })
      .finally(() => setPageLoading(false));
  }, [authLoading]);

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'remitter') return <Navigate to="/login" replace />;

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Remitter Profile Found</h2>
        <p className="text-gray-500 mb-6">You don't have a remitter profile yet. Register to get started.</p>
        <a href="/join-us" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
          Register as Remitter
        </a>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
        <p className="text-gray-500 mb-6">We couldn't load your remitter profile. Please try again.</p>
        <button onClick={() => window.location.reload()} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
          Retry
        </button>
      </div>
    );
  }

  const status = remitter?.status ?? 'pending';
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const isApproved = status === 'approved';
  const addedCodes = new Set((remitter?.supportedCountries ?? []).map((c) => c.countryCode));
  const availableToAdd = COUNTRY_LIST.filter((c) => !addedCodes.has(c.code));

  // Currencies whose countries have been activated by admin
  const approvedCurrencies = new Set(
    (remitter?.supportedCountries ?? [])
      .filter((sc) => sc.isActive)
      .map((sc) => getCountryByCode(sc.countryCode)?.currency)
      .filter((c): c is string => Boolean(c))
  );
  const approvedCountryList = COUNTRY_LIST.filter((c) => approvedCurrencies.has(c.currency));

  const editFromInfo = editingRate ? COUNTRY_LIST.find((c) => c.currency === editingRate.fromCurrency) : null;
  const editToInfo   = editingRate ? COUNTRY_LIST.find((c) => c.currency === editingRate.toCurrency)   : null;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const openEditProfile = () => {
    setProfileForm({
      legalName: remitter?.legalName ?? '',
      email: remitter?.email ?? '',
      phone: remitter?.phone ?? '',
      website: remitter?.website ?? '',
      description: remitter?.description ?? '',
      baseCountry: remitter?.baseCountry ?? '',
    });
    setProfileError('');
    setEditingProfile(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const res = await updateMyRemitterProfile(profileForm);
      setRemitter(res.data.remitter);
      setEditingProfile(false);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setProfileError(e?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateSaving(true);
    setRateError('');
    try {
      const res = await addRate({
        fromCurrency: rateForm.fromCurrency.toUpperCase(),
        toCurrency: rateForm.toCurrency.toUpperCase(),
        rate: Number(rateForm.rate),
        unit: Number(rateForm.unit),
        fee: Number(rateForm.fee),
      });
      setRates((prev) => {
        const idx = prev.findIndex((r) => r._id === res.data.rate._id);
        if (idx >= 0) { const next = [...prev]; next[idx] = res.data.rate; return next; }
        return [...prev, res.data.rate];
      });
      setRateForm(EMPTY_RATE);
      setShowRateForm(false);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setRateError(e?.response?.data?.message || 'Failed to save rate.');
    } finally {
      setRateSaving(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Delete this rate?')) return;
    try {
      await deleteRate(id);
      setRates((prev) => prev.filter((r) => r._id !== id));
    } catch { alert('Failed to delete rate.'); }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    setEditSaving(true);
    setEditError('');
    try {
      const res = await updateRate(editingRate._id, {
        rate: Number(editRateForm.rate),
        unit: Number(editRateForm.unit),
        fee: Number(editRateForm.fee),
      });
      setRates((prev) => prev.map((r) => r._id === res.data.rate._id ? res.data.rate : r));
      setEditingRate(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setEditError(e?.response?.data?.message || 'Failed to update rate.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleCountryFlag = async (c: RemitterCountry, field: 'canSend' | 'canReceive') => {
    try {
      const res = await upsertRemitterCountry({ countryCode: c.countryCode, canSend: field === 'canSend' ? !c.canSend : c.canSend, canReceive: field === 'canReceive' ? !c.canReceive : c.canReceive });
      setRemitter(res.data.remitter);
    } catch { alert('Failed to update country.'); }
  };

  const handleAddCountry = async () => {
    if (!newCountryCode) return;
    setCountrySaving(true);
    try {
      const res = await upsertRemitterCountry({ countryCode: newCountryCode, canSend: newCanSend, canReceive: newCanReceive });
      setRemitter(res.data.remitter);
      setShowAddCountry(false);
      setNewCountryCode('');
      setNewCanSend(false);
      setNewCanReceive(false);
    } catch { alert('Failed to add country.'); }
    finally { setCountrySaving(false); }
  };

  const handleRemoveCountry = async (code: string) => {
    if (!confirm('Remove this country from your supported list?')) return;
    try {
      const res = await removeRemitterCountry(code);
      setRemitter(res.data.remitter);
    } catch { alert('Failed to remove country.'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{remitter?.legalName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{remitter?.email}</p>
        </div>
        <button onClick={openEditProfile} className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 text-gray-700">
          <Pencil className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      {/* Status banner */}
      <div className={`flex items-start gap-3 border rounded-lg px-4 py-3 ${statusStyle.bg}`}>
        <span className={statusStyle.text}>{statusStyle.icon}</span>
        <div>
          <p className={`font-medium ${statusStyle.text} capitalize`}>{status}</p>
          {STATUS_MESSAGES[status] && <p className={`text-sm mt-0.5 ${statusStyle.text}`}>{STATUS_MESSAGES[status]}</p>}
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Profile Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Base Country:</span> <span className="ml-2 font-medium text-gray-800">{remitter?.baseCountry || '—'}</span></div>
          <div><span className="text-gray-500">Phone:</span> <span className="ml-2 font-medium text-gray-800">{remitter?.phone || '—'}</span></div>
          <div><span className="text-gray-500">Website:</span> <span className="ml-2 font-medium text-gray-800">{remitter?.website || '—'}</span></div>
          {remitter?.description && (
            <div className="sm:col-span-2"><span className="text-gray-500">Description:</span> <span className="ml-2 text-gray-800">{remitter.description}</span></div>
          )}
        </div>
      </div>

      {/* Supported Countries */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Supported Countries</h2>
            <p className="text-xs text-gray-400 mt-0.5">Set which countries you can send from or receive to. Admin activates each country.</p>
          </div>
          <button
            onClick={() => { setShowAddCountry(true); setNewCountryCode(''); setNewCanSend(false); setNewCanReceive(false); }}
            className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
          >
            <PlusCircle className="w-4 h-4" /> Add Country
          </button>
        </div>

        {(remitter?.supportedCountries ?? []).length === 0 && !showAddCountry ? (
          <p className="text-sm text-gray-400">No countries added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left pb-2 pr-4">Country</th>
                <th className="text-left pb-2 pr-4">Currency</th>
                <th className="text-center pb-2 pr-4">Can Send</th>
                <th className="text-center pb-2 pr-4">Can Receive</th>
                <th className="text-center pb-2 pr-4">Admin Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(remitter?.supportedCountries ?? []).map((c) => {
                const info = getCountryByCode(c.countryCode);
                return (
                  <tr key={c.countryCode} className="hover:bg-gray-50">
                    <td className="py-2 pr-4">
                      <span className="mr-1.5">{info?.flag ?? '🌍'}</span>
                      <span className="font-medium text-gray-800">{info?.name ?? c.countryCode}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{info?.currency ?? '—'}</td>
                    <td className="py-2 pr-4 text-center">
                      <input type="checkbox" checked={c.canSend} onChange={() => handleToggleCountryFlag(c, 'canSend')} className="w-4 h-4 accent-green-600 cursor-pointer" />
                    </td>
                    <td className="py-2 pr-4 text-center">
                      <input type="checkbox" checked={c.canReceive} onChange={() => handleToggleCountryFlag(c, 'canReceive')} className="w-4 h-4 accent-green-600 cursor-pointer" />
                    </td>
                    <td className="py-2 pr-4 text-center">
                      {c.isActive
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5"><CheckCircle className="w-3 h-3" /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 rounded-full px-2 py-0.5"><Clock className="w-3 h-3" /> Pending</span>
                      }
                    </td>
                    <td className="py-2">
                      <button onClick={() => handleRemoveCountry(c.countryCode)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Add country inline form */}
        {showAddCountry && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Add Country</p>
              <button onClick={() => setShowAddCountry(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Country</label>
                <select
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[200px]"
                >
                  <option value="">Select a country…</option>
                  {availableToAdd.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={newCanSend} onChange={(e) => setNewCanSend(e.target.checked)} className="w-4 h-4 accent-green-600" />
                Can Send
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={newCanReceive} onChange={(e) => setNewCanReceive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                Can Receive
              </label>
              <button
                onClick={handleAddCountry}
                disabled={!newCountryCode || countrySaving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {countrySaving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rates section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Remittance Rates</h2>
          {isApproved && (
            <button
              onClick={() => { setShowRateForm(true); setEditingRate(null); setRateForm(EMPTY_RATE); setRateError(''); }}
              disabled={approvedCountryList.length === 0}
              title={approvedCountryList.length === 0 ? 'No admin-approved countries yet' : undefined}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4" /> Add Rate
            </button>
          )}
        </div>

        {!isApproved && <p className="text-sm text-gray-400">Rate management is available once your account is approved.</p>}

        {isApproved && (
          <>
            {approvedCountryList.length === 0 && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                No admin-approved countries yet. Ask your admin to activate your supported countries before adding rates.
              </p>
            )}

            {rates.length === 0 && !showRateForm && (
              <p className="text-sm text-gray-400">No rates added yet. Click "Add Rate" to get started.</p>
            )}

            {rates.length > 0 && (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="text-left pb-2 pr-4">From</th>
                    <th className="text-left pb-2 pr-4">To</th>
                    <th className="text-left pb-2 pr-4">Rate</th>
                    <th className="text-left pb-2 pr-4">Unit</th>
                    <th className="text-left pb-2 pr-4">Fee</th>
                    <th className="text-left pb-2 pr-4">Updated</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rates.map((r) => {
                    const fromInfo = COUNTRY_LIST.find(c => c.currency === r.fromCurrency);
                    const toInfo = COUNTRY_LIST.find(c => c.currency === r.toCurrency);
                    return (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-800">
                        {fromInfo ? <span>{fromInfo.flag} {fromInfo.name} <span className="text-gray-400 text-xs">({r.fromCurrency})</span></span> : r.fromCurrency}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {toInfo ? <span>{toInfo.flag} {toInfo.name} <span className="text-gray-400 text-xs">({r.toCurrency})</span></span> : r.toCurrency}
                      </td>
                      <td className="py-2 pr-4 text-gray-800">{r.rate}</td>
                      <td className="py-2 pr-4 text-gray-600">{r.unit}</td>
                      <td className="py-2 pr-4 text-gray-600">{r.fee}</td>
                      <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">{fmtDate(r.updatedAt)}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingRate(r); setEditRateForm({ rate: String(r.rate), unit: String(r.unit), fee: String(r.fee) }); setShowRateForm(false); setEditError(''); }}
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteRate(r._id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {showRateForm && (
              <form onSubmit={handleAddRate} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">New Rate</p>
                  <button type="button" onClick={() => setShowRateForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                {rateError && <p className="text-xs text-red-600 mb-2">{rateError}</p>}
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Country</label>
                    <select
                      required
                      value={rateForm.fromCurrency}
                      onChange={(e) => setRateForm((p) => ({ ...p, fromCurrency: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[180px]"
                    >
                      <option value="">Select country…</option>
                      {approvedCountryList.map((c) => (
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
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[180px]"
                    >
                      <option value="">Select country…</option>
                      {approvedCountryList.map((c) => (
                        <option key={c.code} value={c.currency}>{c.flag} {c.name} ({c.currency})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rate</label>
                    <input required type="number" step="any" placeholder="132.50" value={rateForm.rate} onChange={(e) => setRateForm((p) => ({ ...p, rate: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Unit</label>
                    <input type="number" value={rateForm.unit} onChange={(e) => setRateForm((p) => ({ ...p, unit: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fee</label>
                    <input type="number" step="any" value={rateForm.fee} onChange={(e) => setRateForm((p) => ({ ...p, fee: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <button type="submit" disabled={rateSaving} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    {rateSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {editingRate && (
              <form onSubmit={handleUpdateRate} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Edit Rate: {editFromInfo ? `${editFromInfo.flag} ${editFromInfo.name}` : editingRate.fromCurrency}
                    {' → '}
                    {editToInfo ? `${editToInfo.flag} ${editToInfo.name}` : editingRate.toCurrency}
                  </p>
                  <button type="button" onClick={() => setEditingRate(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                {editError && <p className="text-xs text-red-600 mb-2">{editError}</p>}
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rate</label>
                    <input required type="number" step="any" value={editRateForm.rate} onChange={(e) => setEditRateForm((p) => ({ ...p, rate: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Unit</label>
                    <input type="number" value={editRateForm.unit} onChange={(e) => setEditRateForm((p) => ({ ...p, unit: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fee</label>
                    <input type="number" step="any" value={editRateForm.fee} onChange={(e) => setEditRateForm((p) => ({ ...p, fee: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button type="submit" disabled={editSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    {editSaving ? 'Updating…' : 'Update Rate'}
                  </button>
                  <button type="button" onClick={() => setEditingRate(null)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
              <button onClick={() => setEditingProfile(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveProfile} className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {profileError && <p className="text-sm text-red-600">{profileError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Legal Name</label>
                  <input value={profileForm.legalName ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, legalName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={profileForm.email ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={profileForm.phone ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Base Country</label>
                  <input value={profileForm.baseCountry ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, baseCountry: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                  <input value={profileForm.website ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={profileForm.description ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingProfile(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={profileSaving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
