import { useCallback, useEffect, useState } from 'react';
import { getRemitters, getUserReviews } from '../api';
import type { Remitter, Review } from '../types';
import { Building, Globe, ExternalLink, MessageSquarePlus, Pencil, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReviewModal from '../components/common/ReviewModal';

export default function RemittersPage() {
  const [remitters, setRemitters] = useState<Remitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRemitter, setReviewRemitter] = useState<{ remitter: Remitter; existingReview?: Review } | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadUserReviews = useCallback(() => {
    if (user) {
      getUserReviews()
        .then((res) => setUserReviews(res.data.reviews))
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    getRemitters()
      .then((res) => setRemitters(res.data.remitters))
      .catch(console.error)
      .finally(() => setLoading(false));
    loadUserReviews();
  }, [loadUserReviews]);

  const getUserReviewForRemitter = (remitterId: string) =>
    userReviews.find((r) =>
      typeof r.remitterId === 'object' ? r.remitterId._id === remitterId : r.remitterId === remitterId
    );

  const handleWriteReview = (remitter: Remitter) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const existing = getUserReviewForRemitter(remitter._id);
    setReviewRemitter({ remitter, existingReview: existing });
  };

  const handleReviewSuccess = () => {
    setReviewRemitter(null);
    setSuccessMsg('Review submitted! It will be visible after admin approval.');
    setTimeout(() => setSuccessMsg(''), 5000);
    loadUserReviews();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Remitters</h1>

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-48 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : remitters.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No remitters available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remitters.map((remitter) => (
            <div key={remitter._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {remitter.logo
                    ? <img src={remitter.logo} alt={remitter.legalName} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : <Building className="w-6 h-6 text-green-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{remitter.legalName}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Globe className="w-3 h-3" />
                    <span>{remitter.baseCountry}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{remitter.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {remitter.supportedCountries.map((country) => (
                  <span key={country.countryCode} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {country.countryCode}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                {(() => {
                  const existing = getUserReviewForRemitter(remitter._id);
                  if (existing) {
                    return (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleWriteReview(remitter)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit Review</span>
                        </button>
                        <span className="flex items-center gap-1 text-xs">
                          {existing.isApproved ? (
                            <><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-green-600">Published</span></>
                          ) : (
                            <><Clock className="w-3 h-3 text-yellow-500" /><span className="text-yellow-600">Pending</span></>
                          )}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={() => handleWriteReview(remitter)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      <span>Write Review</span>
                    </button>
                  );
                })()}
                {remitter.website && (
                  <a
                    href={remitter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewRemitter && (
        <ReviewModal
          remitterId={reviewRemitter.remitter._id}
          legalName={reviewRemitter.remitter.legalName}
          existingReview={reviewRemitter.existingReview}
          onClose={() => setReviewRemitter(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
