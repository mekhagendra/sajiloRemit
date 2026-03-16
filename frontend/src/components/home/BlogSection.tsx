import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBlogs } from '../../api';
import type { Blog } from '../../types';
import { BookOpen } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5003/api').replace(/\/api$/, '');
const resolveUrl = (url: string) => (url?.startsWith('/') ? `${API_BASE}${url}` : url);

export default function BlogSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogs({ limit: 4 })
      .then((res) => setBlogs(res.data.blogs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center space-x-2 mb-6">
        <BookOpen className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">Latest Blog Posts</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3 ml-auto" />
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <p className="text-gray-500">No blog posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {blogs.map((blog) => (
            <Link
              key={blog._id}
              to={`/blogs/${blog._id}`}
              className="group block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Row 1 — Image */}
              <div className="w-full h-40 bg-gray-100 overflow-hidden">
                {blog.thumbnail ? (
                  <img
                    src={resolveUrl(blog.thumbnail)}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                    <BookOpen className="w-8 h-8 text-green-300" />
                  </div>
                )}
              </div>
              {/* Row 2 — Title */}
              <div className="px-4 pt-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                  {blog.title}
                </h3>
              </div>
              {/* Row 3 — Author (right-aligned) */}
              <div className="px-4 pt-1 pb-3 text-right">
                <span className="text-xs text-gray-400">{blog.author.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center mt-5">
        <Link
          to="/blogs"
          className="inline-block px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          View All Posts
        </Link>
      </div>
    </div>
  );
}
