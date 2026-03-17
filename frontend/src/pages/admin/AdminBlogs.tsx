import { useEffect, useRef, useState } from 'react';
import { adminGetBlogs, adminCreateBlog, adminUpdateBlog, adminDeleteBlog } from '../../api';
import type { Blog } from '../../types';
import { Plus, Pencil, Trash2, X, Check, Eye, EyeOff, Images, ExternalLink } from 'lucide-react';
import GalleryPicker from '../../components/common/GalleryPicker';

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

const EMPTY_FORM = {
  title: '',
  thumbnail: '',
  shortDescription: '',
  sourceUrl: '',
  isPublished: false,
};

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchBlogs = () => {
    setLoading(true);
    adminGetBlogs({ limit: 100 })
      .then((res) => setBlogs(res.data.blogs))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openEdit = (b: Blog) => {
    setEditingId(b._id);
    setForm({
      title: b.title,
      thumbnail: b.thumbnail ?? '',
      shortDescription: b.shortDescription,
      sourceUrl: b.sourceUrl,
      isPublished: b.isPublished,
    });
    setError('');
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleThumbnailSelect = (url: string) => {
    setForm(f => ({ ...f, thumbnail: url }));
    setShowGallery(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        sourceUrl: form.sourceUrl.trim(),
        isPublished: form.isPublished,
        ...(form.thumbnail.trim() && { thumbnail: form.thumbnail.trim() }),
      };
      if (editingId) {
        const res = await adminUpdateBlog(editingId, payload);
        setBlogs((prev) => prev.map((b) => (b._id === editingId ? res.data.blog : b)));
      } else {
        const res = await adminCreateBlog(payload as Parameters<typeof adminCreateBlog>[0]);
        setBlogs((prev) => [res.data.blog, ...prev]);
      }
      setShowForm(false);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    setDeletingId(id);
    try {
      await adminDeleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch {
      alert('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
    {showGallery && (
      <GalleryPicker
        onSelect={handleThumbnailSelect}
        onClose={() => setShowGallery(false)}
      />
    )}
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div ref={formRef} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 text-lg">
              {editingId ? 'Edit Blog Post' : 'New Blog Post'}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Post title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Source URL *</label>
                <input
                  required
                  type="url"
                  value={form.sourceUrl}
                  onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                  placeholder="https://example.com/article"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Short Description <span className="text-gray-400">(max 300 chars)</span>
                </label>
                <textarea
                  maxLength={300}
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  placeholder="Brief summary shown in listings"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Thumbnail Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Images className="w-4 h-4" />
                    {form.thumbnail ? 'Change Image' : 'Select from Gallery'}
                  </button>
                  {form.thumbnail && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, thumbnail: '' }))}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {form.thumbnail && (
                  <img
                    src={form.thumbnail}
                    alt="preview"
                    className="mt-2 h-32 w-auto object-cover rounded-lg border border-gray-200"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving…' : editingId ? 'Update' : 'Publish'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-14 bg-gray-200 rounded" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <p className="text-gray-500">No blog posts yet. Click "New Post" to create one.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <th className="text-left px-6 py-3">Title</th>
                <th className="text-left px-6 py-3">Source</th>
                <th className="text-left px-6 py-3">Author</th>
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {blogs.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center space-x-3">
                      {blog.thumbnail && (
                        <img
                          src={resolveUrl(blog.thumbnail)}
                          alt=""
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">{blog.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <a
                      href={blog.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 max-w-[180px] truncate"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{blog.sourceUrl}</span>
                    </a>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{blog.author.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    {blog.isPublished ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Eye className="w-3 h-3" /> <span>Published</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        <EyeOff className="w-3 h-3" /> <span>Draft</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openEdit(blog)}
                        title="Edit"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        disabled={deletingId === blog._id}
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
    </>
  );
}

