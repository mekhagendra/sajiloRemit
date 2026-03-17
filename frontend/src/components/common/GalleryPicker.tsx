import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Upload, Search, Trash2, Check, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminListGallery, adminUploadToGallery, adminDeleteGalleryFile } from '../../api';
import type { GalleryFile } from '../../types';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api').replace(/\/api$/, '');
// Old DB records may store a filesystem path (e.g. //var/www/…/gallery/file.jpg).
// Detect that case and canonicalise to the /uploads/gallery/<filename> URL.
const resolveUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (!url.startsWith('/uploads/')) {
    const m = url.match(/\/gallery\/([^/?#]+)$/);
    if (m) return `${API_BASE}/uploads/gallery/${m[1]}`;
  }
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
};
const fmtBytes = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

type Tab = 'gallery' | 'upload';

const LIMIT = 24;

export default function GalleryPicker({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('gallery');

  // Gallery state
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<GalleryFile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadGallery = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminListGallery({ page: p, limit: LIMIT, search: q });
      setFiles(res.data.files);
      setTotalPages(res.data.totalPages);
    } catch {
      setError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGallery(page, search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadGallery, page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => void loadGallery(1, value), 400);
  };

  const handleDelete = async (f: GalleryFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${f.originalName}"?`)) return;
    setDeleting(f._id);
    try {
      await adminDeleteGalleryFile(f._id);
      setFiles(prev => prev.filter(x => x._id !== f._id));
      if (selected?._id === f._id) setSelected(null);
    } catch {
      setError('Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const res = await adminUploadToGallery(uploadFile);
      const newFile = res.data.file;
      // Switch to gallery tab and select the newly uploaded file
      setFiles(prev => [newFile, ...prev]);
      setSelected(newFile);
      setTab('gallery');
      setUploadFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setUploadError('Upload failed. Check file type and size (max 10 MB).');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (!selected) return;
    onSelect(resolveUrl(selected.url));
  };

  // Keyboard: Escape closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Media Gallery</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 shrink-0">
          {(['gallery', 'upload'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'gallery' ? 'Browse Gallery' : 'Upload New'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'gallery' ? (
            <div className="p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by filename…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {Array.from({ length: LIMIT }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <Images className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-sm">
                    {search ? 'No files match your search.' : 'Gallery is empty. Upload an image to get started.'}
                  </p>
                  <button
                    onClick={() => setTab('upload')}
                    className="mt-2 text-sm text-green-600 hover:underline"
                  >
                    Upload an image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {files.map(f => (
                    <div
                      key={f._id}
                      onClick={() => setSelected(prev => prev?._id === f._id ? null : f)}
                      className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selected?._id === f._id
                          ? 'border-green-500 ring-2 ring-green-400 ring-offset-1'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={resolveUrl(f.url)}
                        alt={f.originalName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Selected checkmark */}
                      {selected?._id === f._id && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={e => handleDelete(f, e)}
                        disabled={deleting === f._id}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {/* Filename tooltip */}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {f.originalName}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Selected file info */}
              {selected && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <img src={resolveUrl(selected.url)} alt={selected.originalName} className="h-12 w-16 object-cover rounded border border-green-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{selected.originalName}</p>
                    <p className="text-xs text-gray-500">{fmtBytes(selected.size)} · {selected.mimeType}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 max-w-lg mx-auto space-y-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="mx-auto max-h-48 object-contain rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-300 group-hover:text-green-400 mx-auto mb-3 transition-colors" />
                    <p className="text-sm text-gray-500">Click to select an image</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP, SVG · max 10 MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadFile && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                  <span className="font-medium">{uploadFile.name}</span>
                  <span className="ml-2 text-gray-400">{fmtBytes(uploadFile.size)}</span>
                  <button
                    onClick={() => { setUploadFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="ml-3 text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Upload to Gallery'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                After uploading, you'll be taken back to the gallery to select it.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selected}
            className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {selected ? `Use "${selected.originalName.length > 20 ? selected.originalName.slice(0, 18) + '…' : selected.originalName}"` : 'Select Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
