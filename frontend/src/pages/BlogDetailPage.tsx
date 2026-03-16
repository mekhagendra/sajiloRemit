import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogById } from '../api';
import type { Blog } from '../types';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5003/api').replace(/\/api$/, '');
const resolveUrl = (url: string) => (url?.startsWith('/') ? `${API_BASE}${url}` : url);

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getBlogById(id)
        .then((res) => setBlog(res.data.blog))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-5">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-4 bg-gray-100 rounded ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">Blog post not found.</p>
        <Link to="/blogs" className="text-green-600 mt-4 inline-block hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero / Thumbnail banner */}
      {blog.thumbnail && (
        <div className="w-full h-72 sm:h-96 overflow-hidden">
          <img
            src={resolveUrl(blog.thumbnail)}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link
          to="/blogs"
          className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog</span>
        </Link>

        <article>
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-5">
            {blog.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <UserRound className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700">{blog.author.name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-green-500" />
              <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </span>
          </div>

          {/* Short description (lead) */}
          {blog.shortDescription && (
            <p className="text-lg text-gray-600 leading-relaxed mb-8 font-light border-l-4 border-green-500 pl-4 italic">
              {blog.shortDescription}
            </p>
          )}

          {/* Rich HTML content from CKEditor */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-green-600 prose-a:underline hover:prose-a:text-green-700
              prose-strong:text-gray-900
              prose-blockquote:border-l-4 prose-blockquote:border-green-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
              prose-ul:list-disc prose-ul:pl-6 prose-ul:text-gray-700
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-gray-700
              prose-li:mb-1
              prose-img:rounded-xl prose-img:my-6
              prose-table:w-full prose-table:border-collapse
              prose-th:bg-gray-50 prose-th:text-left prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-gray-200
              prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-200"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* Footer divider */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
          <Link
            to="/blogs"
            className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blog</span>
          </Link>
          <span className="text-xs text-gray-400">
            Published by {blog.author.name}
          </span>
        </div>
      </div>
    </div>
  );
}
