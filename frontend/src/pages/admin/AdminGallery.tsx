import { useCallback, useEffect, useRef, useState } from 'react';
import { Images, Upload, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminListGallery, adminUploadToGallery, adminDeleteGalleryFile } from '../../api';
import type { GalleryFile } from '../../types';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api').replace(/\/api$/, '');
const resolveUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (!url.startsWith('/uploads/')) {
    const m = url.match(/\/gallery\/([^/?#]+)$/);
    if (m) return `${API_BASE}/uploads/gallery/${m[1]}`;
  }
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
};
const fmtBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

const LIMIT = 30;

export default function AdminGallery() {
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Lightbox
  const [lightbox, setLightbox] = useState<GalleryFile | null>(null);

  const loadGallery = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminListGallery({ page: p, limit: LIMIT, search: q });
      setFiles(res.data.files);
      setTotal(res.data.total);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError('');
    const results: GalleryFile[] = [];
    try {
      for (const file of Array.from(fileList)) {
        const res = await adminUploadToGallery(file);
        results.push(res.data.file);
      }
      // Prepend newly uploaded files
      setFiles(prev => [...results, ...prev]);
      setTotal(t => t + results.length);
    } catch {
      setUploadError(`Upload failed. Only image files up to 10 MB are allowed.`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (f: GalleryFile) => {
    if (!confirm(`Permanently delete "${f.originalName}"?`)) return;
    setDeleting(f._id);
    try {
      await adminDeleteGalleryFile(f._id);
      setFiles(prev => prev.filter(x => x._id !== f._id));
      setTotal(t => t - 1);
      if (lightbox?._id === f._id) setLightbox(null);
    } catch {
      setError('Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const copyUrl = async (url: string) => {
    const full = resolveUrl(url);
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      /** fallback: select text */
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Images className="w-6 h-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
            <p className="text-sm text-gray-500">{total} {total === 1 ? 'file' : 'files'} stored</p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading…' : 'Upload Images'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
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
      {uploadError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">{uploadError}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Images className="w-12 h-12 text-gray-200 mx-auto" />
          <p className="text-gray-500 text-sm">
            {search ? 'No files match your search.' : 'No files in the gallery yet.'}
          </p>
          {!search && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-green-600 hover:underline"
            >
              Upload your first image
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {files.map(f => (
            <div
              key={f._id}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-green-400 transition-all cursor-pointer"
              onClick={() => setLightbox(f)}
            >
              <img
                src={resolveUrl(f.url)}
                alt={f.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <button
                  onClick={e => { e.stopPropagation(); void handleDelete(f); }}
                  disabled={deleting === f._id}
                  className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-1.5 rounded-lg transition-opacity disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Filename + size */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-1.5 pt-4 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-[9px] truncate">{f.originalName}</p>
                <p className="text-white/70 text-[8px]">{fmtBytes(f.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={resolveUrl(lightbox.url)}
              alt={lightbox.originalName}
              className="w-full object-contain max-h-[60vh]"
            />
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{lightbox.originalName}</p>
                <p className="text-xs text-gray-500">{fmtBytes(lightbox.size)} · {lightbox.mimeType}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => void copyUrl(lightbox.url)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => { void handleDelete(lightbox); }}
                  disabled={deleting === lightbox._id}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => setLightbox(null)}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
