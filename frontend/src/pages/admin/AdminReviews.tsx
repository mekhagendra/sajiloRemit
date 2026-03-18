import { useEffect, useState } from 'react';
import { adminGetReviews, adminModerateReview, adminDeleteReview } from '../../api';
import type { Review } from '../../types';
import { CheckCircle, XCircle, Trash2, Star, Calendar, Hash, Image, AlertCircle } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchReviews = () => {
    setLoading(true);
    setError('');
    adminGetReviews()
      .then((res) => setReviews(res.data.reviews))
      .catch(() => setError('Failed to load reviews. Please check your permissions and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, []);

  const moderate = async (id: string, isApproved: boolean) => {
    setUpdating(id);
    try {
      await adminModerateReview(id, isApproved);
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved } : r)));
    } catch {
      alert('Failed to update review.');
    } finally {
      setUpdating(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    setUpdating(id);
    try {
      await adminDeleteReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert('Failed to delete review.');
    } finally {
      setUpdating(null);
    }
  };

  const reviewerName = (review: Review) => {
    if (review.userId && typeof review.userId === 'object') return review.userId.name;
    if (review.userId) return String(review.userId);
    return 'Deleted User';
  };

  const remitterName = (review: Review) => {
    if (review.remitterId && typeof review.remitterId === 'object') return review.remitterId.companyName;
    if (review.remitterId) return String(review.remitterId);
    return 'Deleted Remitter';
  };

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => filter === 'pending' ? !r.isApproved : r.isApproved);
  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
          {reviews.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {reviews.length} total · {pendingCount} pending approval
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={fetchReviews} className="mt-3 text-sm text-red-600 hover:text-red-800 underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">{filter === 'all' ? 'No reviews found.' : `No ${filter} reviews.`}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div
              key={review._id}
              className={`bg-white rounded-xl border p-5 shadow-sm ${
                review.isApproved ? 'border-gray-100' : 'border-yellow-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {reviewerName(review)}
                    </span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-sm text-gray-600">
                      {remitterName(review)}
                    </span>
                    <div className="flex items-center space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{review.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>

                  {/* Verification Details */}
                  {(review.transactionDate || review.transactionNumber || review.evidenceUrl) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Verification Details</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        {review.transactionDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.transactionDate).toLocaleDateString()}
                          </span>
                        )}
                        {review.transactionNumber && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {review.transactionNumber}
                          </span>
                        )}
                        {review.evidenceUrl && (
                          <a
                            href={review.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-600 hover:underline"
                          >
                            <Image className="w-3 h-3" />
                            View Evidence
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {!review.isApproved && (
                    <button
                      onClick={() => moderate(review._id, true)}
                      disabled={updating === review._id}
                      title="Approve"
                      className="text-green-600 hover:text-green-800 disabled:opacity-40"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  {review.isApproved && (
                    <button
                      onClick={() => moderate(review._id, false)}
                      disabled={updating === review._id}
                      title="Unapprove"
                      className="text-yellow-500 hover:text-yellow-700 disabled:opacity-40"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(review._id)}
                    disabled={updating === review._id}
                    title="Delete"
                    className="text-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
