import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBlogs } from '../../api';
import type { Blog } from '../../types';
import { BookOpen } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api').replace(/\/api$/, '');
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
        <h2 className="text-xl font-bold text-gray-900">Updates</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl overflow-hidden">
              <div className="aspect-video bg-gray-200" />
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
              className="group relative block rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Image */}
              <div className="w-full aspect-video bg-gray-900 overflow-hidden">
                {blog.thumbnail ? (
                  <img
                    src={resolveUrl(blog.thumbnail)}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-75"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950">
                    <BookOpen className="w-10 h-10 text-green-400 opacity-60" />
                  </div>
                )}
              </div>

              {/* Gradient overlay + text pinned to bottom */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
                <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 drop-shadow group-hover:text-green-300 transition-colors duration-200">
                  {blog.title}
                </h3>
                <p className="mt-1 text-xs text-white/60 font-medium">{blog.author.name}</p>
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
