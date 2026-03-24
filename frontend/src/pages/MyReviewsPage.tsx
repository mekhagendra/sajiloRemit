import { useEffect, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserReviews } from '../api';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/common/ReviewModal';
import type { Review } from '../types';
import { Star, Clock, CheckCircle, Pencil, MessageSquare } from 'lucide-react';

interface State {
  reviews: Review[];
  loading: boolean;
  error: string;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; reviews: Review[] }
  | { type: 'FETCH_ERROR'; error: string };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { reviews: [], loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { reviews: action.reviews, loading: false, error: '' };
    case 'FETCH_ERROR':
      return { reviews: [], loading: false, error: action.error };
  }
}

export default function MyReviewsPage() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { reviews: [], loading: true, error: '' });
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [refreshKey, refresh] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    dispatch({ type: 'FETCH_START' });
    getUserReviews()
      .then((res) => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', reviews: res.data.reviews }); })
      .catch(() => { if (!cancelled) dispatch({ type: 'FETCH_ERROR', error: 'Failed to load your reviews.' }); });
    return () => { cancelled = true; };
  }, [user, refreshKey]);

  const { reviews, loading, error } = state;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Reviews</h1>
        <p className="text-gray-500 mb-6">Please log in to view your reviews.</p>
        <Link to="/login" className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage reviews you've submitted for remitters.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={refresh} className="mt-3 text-sm text-red-600 hover:text-red-800 underline">
            Try again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">You haven't reviewed any remitters yet.</p>
          <Link to="/remitters" className="text-green-600 hover:text-green-800 text-sm font-medium">
            Browse Remitters →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const remitter = review.remitterId && typeof review.remitterId === 'object' ? review.remitterId : null;

            return (
              <div
                key={review._id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Remitter info */}
                    <div className="flex items-center gap-3 mb-2">
                      {remitter?.logo && (
                        <img
                          src={remitter.logo}
                          alt={remitter.legalName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      )}
                      <span className="font-semibold text-gray-900">
                        {remitter?.legalName || 'Deleted Remitter'}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          review.isApproved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {review.isApproved ? (
                          <><CheckCircle className="w-3 h-3" /> Approved</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Pending Approval</>
                        )}
                      </span>
                    </div>

                    {/* Review text */}
                    <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>

                    <p className="text-xs text-gray-400 mt-2">
                      Submitted {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditingReview(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors flex-shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingReview && editingReview.remitterId && typeof editingReview.remitterId === 'object' && (
        <ReviewModal
          remitterId={editingReview.remitterId._id}
          legalName={editingReview.remitterId.legalName}
          existingReview={editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setEditingReview(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
