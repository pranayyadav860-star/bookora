// client/src/pages/MyBookings.js
// UPDATED - Elegant & Customer-Friendly Design

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  CalendarIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  StarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  XMarkIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  HomeModernIcon,
  ReceiptPercentIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Wait for auth to load before checking user
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      }
    }
  }, [user, authLoading, navigate]);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        return;
      }
      
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/bookings/my-bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadMyBookings();
    }
  }, [user, authLoading]);

  const downloadInvoice = async (booking) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://bookora-server-22ox.onrender.com'}/api/bookings/invoice/${booking._id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${booking.bookingId || booking._id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download invoice");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Error downloading invoice");
    } finally {
      setDownloading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm(`Are you sure you want to cancel your booking at ${booking.hotelName}?\n\nRefund will be processed within 5-7 business days.`)) {
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://bookora-server-22ox.onrender.com/api/bookings/cancel/${booking._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(`✅ Booking cancelled successfully!\n\nRefund of ₹${booking.amount} will be processed within 5-7 business days.\nCancellation confirmation sent to your email.`);
        loadMyBookings();
      } else {
        alert("❌ Failed to cancel booking: " + (data.msg || "Please try again"));
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      alert("Please write a review comment");
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://bookora-server-22ox.onrender.com/api/bookings/review/${selectedBooking._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("✅ Thank you for your review!");
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewComment("");
        loadMyBookings();
      } else {
        alert("❌ Failed to submit review: " + (data.msg || "Please try again"));
      }
    } catch (err) {
      console.error("Review error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Confirmed":
        return { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircleIcon, text: "Confirmed" };
      case "Pending":
        return { color: "bg-amber-50 text-amber-700 border-amber-200", icon: ClockIcon, text: "Pending" };
      case "Cancelled":
        return { color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircleIcon, text: "Cancelled" };
      default:
        return { color: "bg-gray-50 text-gray-700 border-gray-200", icon: ClockIcon, text: status || "Pending" };
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  // If not logged in, don't render (will redirect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Fetching your journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Elegant Header */}
        <div className="mb-10 text-center md:text-left md:flex md:justify-between md:items-end">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <SparklesIcon className="h-8 w-8 text-amber-500" />
              <h1 className="text-4xl font-light text-gray-800">My <span className="font-semibold text-amber-600">Journeys</span></h1>
            </div>
            <p className="text-gray-500 mt-1 max-w-md">Your travel memories and upcoming adventures</p>
          </div>
          {bookings.length > 0 && (
            <div className="mt-4 md:mt-0">
              <Link to="/hotels" className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-2 rounded-full shadow-sm text-amber-600 font-medium hover:bg-white hover:shadow-md transition-all">
                <HomeModernIcon className="h-4 w-4" />
                Discover New Stays
              </Link>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={loadMyBookings} className="text-rose-600 underline text-sm font-medium">Try Again</button>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <CalendarIcon className="h-12 w-12 text-amber-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">No adventures booked yet</p>
            <p className="text-gray-400 mb-6">Your next getaway is just a click away</p>
            <Link to="/hotels" className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5">
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking) => {
              const status = getStatusBadge(booking.status);
              const StatusIcon = status.icon;
              const canReview = booking.status === "Confirmed" && !booking.reviewGiven;
              const canCancel = booking.status === "Confirmed";
              
              return (
                <div key={booking._id} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200">
                  <div className="p-5 md:p-6">
                    {/* Main Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                      
                      {/* Hotel Info - Left */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                            <HomeModernIcon className="h-7 w-7 text-amber-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-800 group-hover:text-amber-700 transition-colors">{booking.hotelName}</h2>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                              <p className="text-gray-500 text-sm flex items-center gap-1">
                                <MapPinIcon className="h-3.5 w-3.5" />
                                {booking.city || "Destination Paradise"}
                              </p>
                              <p className="text-gray-500 text-sm flex items-center gap-1">
                                <ReceiptPercentIcon className="h-3.5 w-3.5" />
                                {booking.roomType || "Deluxe Room"}
                              </p>
                            </div>
                            {booking.bookingId && (
                              <p className="text-xs text-gray-400 font-mono mt-2">ID: {booking.bookingId}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Dates & Guests - Center */}
                      <div className="flex flex-wrap gap-4 bg-gray-50/80 rounded-xl p-3 lg:min-w-[240px]">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Check-in</p>
                          <p className="font-semibold text-gray-700 text-sm">
                            {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Check-out</p>
                          <p className="font-semibold text-gray-700 text-sm">
                            {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Guests</p>
                          <p className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                            <UserGroupIcon className="h-3 w-3" /> {booking.guests || 1}
                          </p>
                        </div>
                      </div>
                      
                      {/* Price & Status - Right */}
                      <div className="lg:text-right lg:min-w-[140px]">
                        <p className="text-2xl font-bold text-gray-800">
                          ₹{Number(booking.amount || 0).toLocaleString()}
                        </p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border mt-1 ${status.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{status.text}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 capitalize">{booking.paymentMethod || "Pay at Hotel"}</p>
                      </div>
                      
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                      <Link
                        to={`/hotel/${booking.hotelId}`}
                        className="flex-1 bg-gray-50 text-gray-700 py-2.5 rounded-xl text-center font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2 group"
                      >
                        <EyeIcon className="h-4 w-4 group-hover:scale-110 transition" />
                        <span>View Hotel</span>
                      </Link>
                      
                      <button
                        onClick={() => downloadInvoice(booking)}
                        disabled={downloading}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2.5 rounded-xl text-center font-medium hover:from-blue-600 hover:to-indigo-600 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        {downloading ? "Processing..." : "Get Invoice"}
                      </button>
                      
                      {canReview && (
                        <button
                          onClick={() => openReviewModal(booking)}
                          className="flex-1 bg-amber-50 text-amber-700 py-2.5 rounded-xl text-center font-medium hover:bg-amber-100 transition flex items-center justify-center gap-2 border border-amber-200"
                        >
                          <StarIcon className="h-4 w-4" />
                          Share Experience
                        </button>
                      )}

                      {booking.paymentId && (
                        <Link
                          to={`/payment/${booking.paymentId}`}
                          className="flex-1 bg-gray-50 text-gray-700 py-2.5 rounded-xl text-center font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
                        >
                          <CreditCardIcon className="h-4 w-4" />
                          Payment Details
                        </Link>
                      )}
                      
                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          disabled={submitting}
                          className="flex-1 border border-rose-300 text-rose-600 py-2.5 rounded-xl text-center font-medium hover:bg-rose-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Elegant Stats Summary */}
        {bookings.length > 0 && (
          <div className="mt-10 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-5 flex flex-wrap justify-around gap-4 border border-white/50">
            <div className="text-center px-4">
              <p className="text-3xl font-light text-gray-700">{bookings.length}</p>
              <p className="text-sm text-gray-500">Total Trips</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-light text-emerald-600">
                {bookings.filter(b => b.status === "Confirmed").length}
              </p>
              <p className="text-sm text-gray-500">Upcoming Stays</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-light text-amber-600">
                ₹{bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Invested in Memories</p>
            </div>
          </div>
        )}
        
      </div>

      {/* Review Modal - Elegant Overlay */}
      {showReviewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl p-5 border-b border-amber-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Share Your <span className="text-amber-600">Experience</span></h2>
                <p className="text-sm text-gray-500 mt-0.5">Your feedback helps fellow travelers</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-white/50 rounded-full transition">
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-5 text-center">
                <p className="font-semibold text-gray-800">{selectedBooking.hotelName}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(selectedBooking.checkIn).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — {new Date(selectedBooking.checkOut).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">How was your stay?</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="text-3xl focus:outline-none transform hover:scale-110 transition"
                    >
                      {star <= reviewRating ? (
                        <StarSolidIcon className="h-8 w-8 text-amber-400" />
                      ) : (
                        <StarIcon className="h-8 w-8 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  rows="4"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  placeholder="Tell us about your experience..."
                />
              </div>
              
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-md transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Publish Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;