// client/src/components/ReviewSection.js
// Verified reviews + Owner reply inline

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const ratingLabels = { 5: "Excellent", 4: "Very Good", 3: "Good", 2: "Fair", 1: "Poor" };

const RatingBar = ({ label, count, total }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="w-6 text-gray-500 text-right">{label}★</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: total ? `${(count/total)*100}%` : "0%" }} />
    </div>
    <span className="w-6 text-gray-400 text-xs">{count}</span>
  </div>
);

export default function ReviewSection({ hotelId, hotelOwnerId }) {
  const { user } = useAuth();
  const [reviews, setReviews]             = useState([]);
  const [canReview, setCanReview]         = useState(false);
  const [bookingId, setBookingId]         = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [rating, setRating]               = useState(0);
  const [comment, setComment]             = useState("");
  const [hoverRating, setHoverRating]     = useState(0);
  const [success, setSuccess]             = useState(false);

  // Owner reply state
  const [replyText, setReplyText]         = useState({});
  const [replyLoading, setReplyLoading]   = useState({});
  const [replySuccess, setReplySuccess]   = useState({});

  const isOwner = !!(user && hotelOwnerId && user.id === hotelOwnerId?.toString());

  useEffect(() => {
    if (!hotelId) return;
    fetchReviews();
    if (user) checkCanReview();
  }, [hotelId, user]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/${hotelId}`);
      setReviews(Array.isArray(data) ? data : []);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  };

  const checkCanReview = async () => {
    try {
      const { data } = await api.get(`/reviews/can-review/${hotelId}`);
      setCanReview(data.canReview);
      setBookingId(data.bookingId);
      setAlreadyReviewed(data.alreadyReviewed);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating");
    if (comment.trim().length < 10) return alert("Review must be at least 10 characters");
    setSubmitting(true);
    try {
      await api.post("/reviews/add", { hotelId, bookingId, rating, comment });
      setSuccess(true);
      setShowForm(false);
      setCanReview(false);
      setAlreadyReviewed(true);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const { data } = await api.post(`/reviews/${reviewId}/helpful`);
      setReviews(reviews.map(r => r._id === reviewId ? { ...r, helpful: data.helpful } : r));
    } catch {}
  };

  const handleReply = async (reviewId) => {
    const text = replyText[reviewId]?.trim();
    if (!text || text.length < 5) return alert("Reply must be at least 5 characters");
    setReplyLoading(prev => ({ ...prev, [reviewId]: true }));
    try {
      await api.post(`/reviews/${reviewId}/reply`, { text });
      setReplySuccess(prev => ({ ...prev, [reviewId]: true }));
      setReplyText(prev => ({ ...prev, [reviewId]: "" }));
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit reply");
    } finally {
      setReplyLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const ratingCounts = [5,4,3,2,1].map(n => ({ label: n, count: reviews.filter(r => r.rating === n).length }));

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Reviews</h2>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-6">
          <div className="text-center">
            <div className="text-5xl font-black text-gray-900">{avgRating}</div>
            <div className="flex justify-center mt-1">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-lg ${s <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="flex-1 space-y-2 justify-center flex flex-col">
            {ratingCounts.map(({ label, count }) => (
              <RatingBar key={label} label={label} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Owner info banner */}
      {isOwner && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🏨</span>
          <div>
            <p className="font-semibold text-blue-800 text-sm">You are the hotel owner</p>
            <p className="text-blue-500 text-xs">Reply to guest reviews below — your responses are visible to all visitors</p>
          </div>
        </div>
      )}

      {/* Write review CTA */}
      {!user ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-blue-700"><a href="/login" className="font-semibold underline">Log in</a> to write a review after your stay.</p>
        </div>
      ) : success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <div className="text-2xl mb-1">🎉</div>
          <p className="text-green-700 font-semibold">Review submitted! +50 loyalty points added.</p>
        </div>
      ) : canReview && !showForm ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-sm">You stayed here!</p>
            <p className="text-gray-500 text-xs">Share your experience and earn 50 loyalty points.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-xl hover:bg-yellow-600 transition-colors"
          >
            Write Review
          </button>
        </div>
      ) : alreadyReviewed ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-500">✅ You have already reviewed this hotel.</p>
        </div>
      ) : !canReview && !alreadyReviewed && !isOwner ? (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-400">Reviews are only available after a completed stay.</p>
        </div>
      ) : null}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Your Review</h3>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star} type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`text-3xl transition-transform hover:scale-110 ${star <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-200"}`}
                >★</button>
              ))}
              {(hoverRating || rating) > 0 && (
                <span className="ml-2 text-sm text-gray-500 self-center">{ratingLabels[hoverRating || rating]}</span>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Your experience</label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Tell others about your stay..."
              rows={4} maxLength={1000}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{comment.length}/1000</div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting || rating === 0}
              className="flex-1 py-2.5 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-colors">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">⭐</div>
          <p className="text-sm">No reviews yet. Be the first to review after your stay!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              {/* Review header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{review.userName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{review.userName}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full">✓ Verified Stay</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-sm ${s <= review.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{ratingLabels[review.rating]}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Review comment */}
              <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.comment}</p>

              {/* Existing owner reply */}
              {review.ownerReply?.text && (
                <div className="bg-blue-50 border-l-2 border-blue-300 rounded-r-xl px-3 py-2 mt-2">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🏨 Hotel Response</p>
                  <p className="text-xs text-blue-600">{review.ownerReply.text}</p>
                  {review.ownerReply.repliedAt && (
                    <p className="text-xs text-blue-300 mt-1">
                      {new Date(review.ownerReply.repliedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              )}

              {/* Owner reply form — only shown to hotel owner, only if not already replied */}
              {isOwner && !review.ownerReply?.text && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {replySuccess[review._id] ? (
                    <p className="text-xs text-green-600 font-medium">✅ Reply submitted!</p>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">🏨 Reply as hotel owner</p>
                      <textarea
                        value={replyText[review._id] || ""}
                        onChange={e => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                        placeholder="Thank the guest or address their feedback..."
                        rows={2} maxLength={500}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-300">{(replyText[review._id] || "").length}/500</span>
                        <button
                          onClick={() => handleReply(review._id)}
                          disabled={replyLoading[review._id] || !replyText[review._id]?.trim()}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {replyLoading[review._id] ? "Submitting..." : "Reply"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Helpful button */}
              <button
                onClick={() => handleHelpful(review._id)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
              >
                👍 Helpful ({review.helpful || 0})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}