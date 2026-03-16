import { useEffect, useState } from 'react';
import { adminGetReviews, adminModerateReview, adminDeleteReview } from '../../api';
import type { Review } from '../../types';
import { CheckCircle, XCircle, Trash2, Star } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    adminGetReviews()
      .then((res) => setReviews(res.data.reviews))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const moderate = async (id: string, isApproved: boolean) => {
    setUpdating(id);
    try {
      const res = await adminModerateReview(id, isApproved);
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved: res.data.review.isApproved } : r)));
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Moderation</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">No reviews found.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className={`bg-white rounded-xl border p-5 shadow-sm ${
                review.isApproved ? 'border-gray-100' : 'border-yellow-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {typeof review.userId === 'object' ? review.userId.name : review.userId}
                    </span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-sm text-gray-600">
                      {typeof review.vendorId === 'object' ? review.vendorId.companyName : review.vendorId}
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
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
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
