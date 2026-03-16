import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, PenSquare, ShieldCheck, ShieldOff, Eye, EyeOff } from 'lucide-react';
import {
  adminGetEditors,
  adminCreateEditor,
  adminUpdateEditor,
  adminDeleteEditor,
  adminUpdateUserStatus,
} from '../../api';
import type { User } from '../../types';

interface EditorForm {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'suspended';
}

const EMPTY: EditorForm = { name: '', email: '', password: '', status: 'active' };

export default function AdminEditors() {
  const [editors, setEditors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<EditorForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => {
    try {
      const res = await adminGetEditors();
      setEditors(res.data.editors);
    } catch {
      setError('Failed to load editors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowPassword(false);
    setError('');
    setShowForm(true);
  };

  const openEdit = (e: User) => {
    setEditing(e);
    setForm({ name: e.name, email: e.email, password: '', status: e.status as 'active' | 'suspended' });
    setShowPassword(false);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    if (!editing && !form.password) {
      setError('Password is required for new editors');
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const payload: { name?: string; password?: string; status?: string } = { name: form.name, status: form.status };
        if (form.password) payload.password = form.password;
        const res = await adminUpdateEditor(editing._id, payload);
        setEditors(prev => prev.map(e => e._id === editing._id ? res.data.editor : e));
      } else {
        const res = await adminCreateEditor({ name: form.name, email: form.email, password: form.password });
        setEditors(prev => [res.data.editor, ...prev]);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Failed to save editor');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (editor: User) => {
    const newStatus = editor.status === 'active' ? 'suspended' : 'active';
    try {
      await adminUpdateUserStatus(editor._id, newStatus);
      setEditors(prev => prev.map(e => e._id === editor._id ? { ...e, status: newStatus } : e));
    } catch {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this editor account? This cannot be undone.')) return;
    try {
      await adminDeleteEditor(id);
      setEditors(prev => prev.filter(e => e._id !== id));
    } catch {
      setError('Failed to delete editor');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <PenSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editors</h1>
            <p className="text-sm text-gray-500">Manage editor accounts — can edit exchange chart and bank rates</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Editor
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editing ? `Edit — ${editing.name}` : 'New Editor'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                disabled={!!editing}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="jane@example.com"
              />
              {editing && <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editing ? 'New Password' : 'Password *'}
                {editing && <span className="text-gray-400 font-normal"> (leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters.</p>
            </div>

            {editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'suspended' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}

            </div>{/* end grid */}

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving…' : editing ? 'Update Editor' : 'Create Editor'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : editors.length === 0 ? (
          <div className="p-10 text-center">
            <PenSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No editor accounts yet.</p>
            <button onClick={openAdd} className="mt-3 text-purple-600 text-sm hover:underline font-medium">
              Add the first editor
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Created</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {editors.map(editor => (
                <tr key={editor._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                        {editor.name[0].toUpperCase()}
                      </div>
                      {editor.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{editor.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      editor.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {editor.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(editor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(editor)}
                        title="Edit"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleStatus(editor)}
                        title={editor.status === 'active' ? 'Suspend' : 'Activate'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          editor.status === 'active'
                            ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {editor.status === 'active'
                          ? <ShieldOff className="w-4 h-4" />
                          : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(editor._id)}
                        title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
