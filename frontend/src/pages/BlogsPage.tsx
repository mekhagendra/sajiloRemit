import { useEffect, useState } from 'react';
import { getBlogs } from '../api';
import type { Blog } from '../types';
import { BookOpen } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api').replace(/\/api$/, '');
const resolveUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return url;
  const m = url.match(/\/gallery\/([^/?#]+)$/);
  if (m) return `/uploads/gallery/${m[1]}`;
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogs({ limit: 20 })
      .then((res) => setBlogs(res.data.blogs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Blog</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-2xl mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3 ml-auto" />
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No blog posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <a
              key={blog._id}
              href={blog.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image */}
              <div className="w-full aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
                {blog.thumbnail ? (
                  <img
                    src={resolveUrl(blog.thumbnail)}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                    <BookOpen className="w-10 h-10 text-green-300" />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="px-5 pt-4">
                <h2 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                  {blog.title}
                </h2>
              </div>

              {/* Author right-aligned + date */}
              <div className="px-5 pt-1 pb-4 mt-auto flex items-end justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-gray-500 font-medium text-right">{blog.author.name}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
