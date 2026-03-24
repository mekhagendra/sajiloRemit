import { useState } from 'react';
import { Star, X, Upload } from 'lucide-react';
import { createReview, updateReview } from '../../api';
import type { Review } from '../../types';

interface Props {
  remitterId: string;
  brandName: string;
  existingReview?: Review;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ remitterId, brandName, existingReview, onClose, onSuccess }: Props) {
  const isEdit = !!existingReview;
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState(existingReview?.text || '');
  const [transactionDate, setTransactionDate] = useState(
    existingReview?.transactionDate ? existingReview.transactionDate.split('T')[0] : ''
  );
  const [transactionNumber, setTransactionNumber] = useState(existingReview?.transactionNumber || '');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rating) {
      setError('Please select a rating');
      return;
    }

    const formData = new FormData();
    formData.append('remitterId', remitterId);
    formData.append('rating', String(rating));
    formData.append('text', text);
    formData.append('transactionDate', transactionDate);
    formData.append('transactionNumber', transactionNumber);
    if (evidence) {
      formData.append('evidence', evidence);
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateReview(existingReview._id, formData);
      } else {
        await createReview(formData);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Review' : 'Review'} {brandName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              maxLength={1000}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Share your experience with this remitter..."
            />
            <p className="text-xs text-gray-400 mt-1">{text.length}/1000</p>
          </div>

          {/* Verification Section */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Transaction Verification</p>
            <p className="text-xs text-gray-500 mb-4">
              This information is only visible to admins for review verification and will not be shown publicly.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date *</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Number *</label>
                <input
                  type="text"
                  value={transactionNumber}
                  onChange={(e) => setTransactionNumber(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. TXN-123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence (optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload a screenshot of your transaction receipt or confirmation.
                </p>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {evidence ? evidence.name : 'Choose file'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEvidence(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !rating || !text || !transactionDate || !transactionNumber}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : isEdit ? 'Update Review' : 'Submit Review'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            {isEdit
              ? 'Your updated review will need admin re-approval before it becomes visible.'
              : 'Your review will be visible after admin approval.'}
          </p>
        </form>
      </div>
    </div>
  );
}
