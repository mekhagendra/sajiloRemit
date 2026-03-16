import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Image, UploadCloud } from 'lucide-react';
import {
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  adminUploadImage,
} from '../../api';
import type { Banner } from '../../types';

const POSITIONS = [
  { value: 'hero_background', label: 'Hero Background Image' },
  { value: 'above_navbar', label: 'Above Navbar' },
  { value: 'below_hero', label: 'Below Hero' },
  { value: 'below_best_rate', label: 'Below Best Rate' },
  { value: 'below_bank_interest', label: 'Below Bank Interest' },
  { value: 'below_statistics', label: 'Below Statistics' },
];

interface BannerForm {
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  isActive: boolean;
}

const EMPTY: BannerForm = {
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: '',
  isActive: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Derive the API base (strip /api suffix) for building absolute image URLs
  const apiBase = (import.meta.env.VITE_API_URL as string || 'http://localhost:5003/api').replace(/\/api$/, '');

  const load = async () => {
    try {
      const res = await adminGetBanners();
      setBanners(res.data.banners);
    } catch {
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); if (fileRef.current) fileRef.current.value = ''; };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? '',
      position: b.position,
      isActive: b.isActive,
    });
    setShowForm(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await adminUploadImage(file);
      setForm(f => ({ ...f, imageUrl: res.data.url }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl || !form.position) {
      setError('Title, image and position are required');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateBanner(editing._id, form);
      } else {
        await adminCreateBanner(form);
      }
      setShowForm(false);
      setError('');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await adminDeleteBanner(id);
      load();
    } catch {
      setError('Failed to delete banner');
    }
  };

  const positionLabel = (val: string) => POSITIONS.find(p => p.value === val)?.label ?? val;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Image className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Banner Ads</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Banners are displayed at the chosen position on the public site. Upload an image file — it is saved to the server's upload directory.
      </p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Summer Promo" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <select required value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">— Select position —</option>
                {POSITIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image *</label>
              <div
                className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-green-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <UploadCloud className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">
                  {uploading ? 'Uploading…' : form.imageUrl ? 'Change image' : 'Click to upload image'}
                </span>
                {uploading && <span className="ml-auto text-xs text-green-600 animate-pulse">Uploading…</span>}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-gray-400 mt-1">Max 5 MB · JPEG, PNG, GIF, WebP, SVG</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL <span className="text-gray-400">(optional — where clicking the banner goes)</span></label>
              <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/promo" />
            </div>

            {form.imageUrl && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <img
                  src={form.imageUrl.startsWith('/') ? `${apiBase}${form.imageUrl}` : form.imageUrl}
                  alt="banner preview"
                  className="max-h-32 rounded-lg border border-gray-200 object-contain"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting || uploading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Saving…' : uploading ? 'Uploading…' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No banners yet. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Preview</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Position</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Link</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.map(b => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={b.imageUrl.startsWith('/') ? `${apiBase}${b.imageUrl}` : b.imageUrl}
                        alt={b.title}
                        className="h-12 w-24 object-cover rounded-lg border border-gray-200"
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{b.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {positionLabel(b.position)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.linkUrl
                        ? <a href={b.linkUrl} target="_blank" rel="noreferrer"
                            className="text-green-600 hover:underline text-xs truncate max-w-[160px] block">{b.linkUrl}</a>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(b)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(b._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
