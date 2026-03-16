import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLatestReviews } from '../../api';
import type { Review } from '../../types';
import { Star, MessageSquare } from 'lucide-react';

const VISIBLE = 3;
const CARD_H = 144; // px — matches h-36
const GAP = 16;     // px — matches gap-4

export default function ReviewsSidebar() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    getLatestReviews()
      .then((res) => setReviews(res.data.reviews))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Start auto-slide only when there are more reviews than visible slots
  useEffect(() => {
    if (reviews.length <= VISIBLE) return;
    timerRef.current = setInterval(() => setSliding(true), 3000);
    return () => clearInterval(timerRef.current);
  }, [reviews]);

  // After CSS transition ends: snap back instantly, advance offset
  const handleTransitionEnd = () => {
    setSliding(false);
    setOffset((prev) => (prev + 1) % reviews.length);
  };

  // Render VISIBLE + 1 cards so the next one is ready to slide in
  const count = Math.min(VISIBLE + 1, reviews.length);
  const items: Review[] = [];
  for (let i = 0; i < count; i++) {
    items.push(reviews[(offset + i) % reviews.length]);
  }

  // Container height is exactly the 3 visible cards — never changes
  const visibleCount = Math.min(reviews.length, VISIBLE);
  const containerH = visibleCount * CARD_H + Math.max(0, visibleCount - 1) * GAP;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link to="/reviews" className="flex items-center space-x-2 group">
          <MessageSquare className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">User Reviews</h2>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl" style={{ height: CARD_H }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet.</p>
      ) : (
        /* Fixed-height clip window — outer height never changes */
        <div style={{ height: containerH, overflow: 'hidden' }}>
          {/* Sliding strip — translates up by one card+gap on each tick */}
          <div
            style={{
              transform: sliding ? `translateY(-${CARD_H + GAP}px)` : 'translateY(0)',
              transition: sliding ? 'transform 500ms ease-in-out' : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            <div className="flex flex-col gap-4">
              {items.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col flex-shrink-0"
                  style={{ height: CARD_H }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-semibold text-sm">
                          {review.userId.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">{review.userId.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 flex-1 overflow-hidden">{review.text}</p>
                  <p className="mt-auto pt-1 text-xs text-gray-400 truncate">for {review.vendorId.companyName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
