// client/src/pages/OwnerBookings.js
// PREMIUM VERSION with Cancel Booking & Email Notification

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarIcon, MagnifyingGlassIcon, EyeIcon, ArrowLeftIcon,
  CurrencyRupeeIcon, UserIcon, BuildingOfficeIcon, TruckIcon,
  DocumentTextIcon, PrinterIcon, ArrowDownTrayIcon,
  XCircleIcon, CheckCircleIcon, ClockIcon, EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/hotels/owner/my-bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking function
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setCancelling(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Send cancellation request to backend
const response = await fetch(`http://localhost:5000/api/bookings/cancel-by-owner/${selectedBooking._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reason: cancelReason || "Cancelled by hotel owner",
          cancelledBy: "owner"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setBookings(prev => prev.map(b => 
          b._id === selectedBooking._id 
            ? { ...b, status: "Cancelled", cancellationReason: cancelReason }
            : b
        ));
        
        setSuccessMessage(`Booking #${selectedBooking._id?.slice(-8)} has been cancelled. An email notification has been sent to the customer.`);
        setShowSuccess(true);
        setShowCancelModal(false);
        setCancelReason("");
        
        // Auto hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        const error = await response.json();
        alert(`Failed to cancel booking: ${error.msg || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
      setSelectedBooking(null);
    }
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const filtered = bookings.filter(b => {
    const matchesSearch = b.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b._id?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || b.status?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = filtered.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const confirmedCount = filtered.filter(b => b.status === "Confirmed").length;
  const pendingCount = filtered.filter(b => b.status === "Pending").length;
  const cancelledCount = filtered.filter(b => b.status === "Cancelled").length;

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <Link to="/owner/dashboard" className="bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Link>
            <div>
              <h1 className="text-3xl font-bold">My Bookings</h1>
              <p className="text-sm opacity-90">View and manage all reservations for your hotels</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Success Message Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span className="text-sm">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by hotel name, customer email, or booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No bookings found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Booking ID</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Hotel</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Dates</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((booking, idx) => (
                      <motion.tr
                        key={booking._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="p-4 text-sm font-mono text-gray-600">#{booking._id?.slice(-8)}</td>
                        <td className="p-4 font-medium text-gray-900">{booking.hotelName}</td>
                        <td className="p-4 text-sm text-gray-600">{booking.userEmail}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(booking.checkIn).toLocaleDateString()} → {new Date(booking.checkOut).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-semibold text-green-600">₹{booking.amount}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/hotel/${booking.hotelId}`} 
                              className="text-blue-600 hover:text-blue-800 transition p-1"
                              title="View Hotel"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            {booking.status !== "Cancelled" && (
                              <button
                                onClick={() => openCancelModal(booking)}
                                className="text-red-600 hover:text-red-800 transition p-1"
                                title="Cancel Booking"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Booking Details:</p>
              <p className="text-xs text-gray-600 mt-1">Hotel: {selectedBooking.hotelName}</p>
              <p className="text-xs text-gray-600">Customer: {selectedBooking.userEmail}</p>
              <p className="text-xs text-gray-600">Amount: ₹{selectedBooking.amount}</p>
              <p className="text-xs text-gray-600">
                Dates: {new Date(selectedBooking.checkIn).toLocaleDateString()} - {new Date(selectedBooking.checkOut).toLocaleDateString()}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Reason (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Hotel maintenance, Overbooking, Customer request, etc."
                rows="3"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                This reason will be sent to the customer via email
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 flex items-start gap-2">
                <EnvelopeIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>The customer will receive an email notification about this cancellation.</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4" />
                    Cancel Booking
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default OwnerBookings;