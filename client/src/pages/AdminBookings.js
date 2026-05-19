// client/src/pages/AdminBookings.js
// UPDATED - Clickable stats cards to filter by status

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookingCalendar from "../components/BookingCalendar";
import { exportToPDF, exportToCSV } from "../utils/exportUtils";
import {
  CalendarIcon,
  CurrencyRupeeIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  TrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [selectedBookings, setSelectedBookings] = useState([]);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const bookingsRes = await fetch("http://localhost:5000/api/bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (bookingsRes.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      
      const bookingsData = await bookingsRes.json();
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      
      const hotelsRes = await fetch("http://localhost:5000/api/hotels", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const hotelsData = await hotelsRes.json();
      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateBookingStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/bookings/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        setSuccess(`Booking ${status.toLowerCase()} successfully!`);
        loadData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update status");
      }
    } catch (err) {
      setError("Error updating status");
    }
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date) => {
    if (!date) return [];
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return bookings.filter(booking => {
      if (!booking.checkIn) return false;
      const checkInDate = new Date(booking.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.toDateString() === targetDate.toDateString();
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setViewMode("list");
    setShowFilters(true);
    setSelectedHotel("");
    setSelectedStatus("");
    const formattedDate = date.toLocaleDateString();
    setSearch(formattedDate);
  };

  // Filter handlers for stats cards
  const filterByStatus = (status) => {
    setSelectedStatus(status);
    setSelectedDate(null);
    setSelectedHotel("");
    setSearch("");
    setViewMode("list");
    setShowFilters(true);
  };

  const filterAllBookings = () => {
    setSelectedStatus("");
    setSelectedDate(null);
    setSelectedHotel("");
    setSearch("");
    setViewMode("list");
  };

  const getFilteredBookings = () => {
    let filtered = bookings;
    
    if (selectedDate) {
      filtered = getBookingsForDate(selectedDate);
    }
    
    if (search && !selectedDate) {
      filtered = filtered.filter(b => 
        b.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
        b.userEmail?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (selectedHotel) {
      filtered = filtered.filter(b => b.hotelName === selectedHotel);
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }
    
    return filtered;
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setSearch("");
    setSelectedHotel("");
    setSelectedStatus("");
  };

  const filteredBookings = getFilteredBookings();
  
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === "Confirmed").length;
  const pendingBookings = bookings.filter(b => b.status === "Pending").length;
  const cancelledBookings = bookings.filter(b => b.status === "Cancelled").length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  
  const hotelBookingCounts = {};
  bookings.forEach(booking => {
    const hotelName = booking.hotelName;
    hotelBookingCounts[hotelName] = (hotelBookingCounts[hotelName] || 0) + 1;
  });

  const handleExportPDF = () => {
    if (filteredBookings.length === 0) {
      setError("No bookings to export");
      setTimeout(() => setError(null), 3000);
      return;
    }
    exportToPDF(filteredBookings, selectedHotel || (selectedStatus ? `${selectedStatus} Bookings` : "All Hotels"));
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      setError("No bookings to export");
      setTimeout(() => setError(null), 3000);
      return;
    }
    exportToCSV(filteredBookings);
    setSuccess("Export completed!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const toggleSelectBooking = (id) => {
    setSelectedBookings(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b._id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
                <p className="text-sm text-gray-500 mt-1">View and manage all reservations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button onClick={() => { setViewMode("list"); setSelectedDate(null); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === "list" ? "bg-yellow-500 text-white" : "text-gray-600"}`}>📋 List</button>
                <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === "calendar" ? "bg-yellow-500 text-white" : "text-gray-600"}`}>📅 Calendar</button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                Filters
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        )}

        {/* Clickable Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* Total Bookings Card */}
          <div 
            onClick={() => filterAllBookings()}
            className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              !selectedStatus && !selectedDate ? "ring-2 ring-yellow-500" : ""
            }`}
          >
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            <p className="text-xs text-gray-400 mt-1">Click to view all</p>
          </div>
          
          {/* Confirmed Bookings Card */}
          <div 
            onClick={() => filterByStatus("Confirmed")}
            className={`bg-green-50 rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              selectedStatus === "Confirmed" ? "ring-2 ring-green-600 scale-105" : ""
            }`}
          >
            <p className="text-green-600 text-sm">Confirmed</p>
            <p className="text-2xl font-bold text-green-700">{confirmedBookings}</p>
            <p className="text-xs text-green-500 mt-1">Click to filter</p>
          </div>
          
          {/* Pending Bookings Card */}
          <div 
            onClick={() => filterByStatus("Pending")}
            className={`bg-yellow-50 rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              selectedStatus === "Pending" ? "ring-2 ring-yellow-600 scale-105" : ""
            }`}
          >
            <p className="text-yellow-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{pendingBookings}</p>
            <p className="text-xs text-yellow-500 mt-1">Click to filter</p>
          </div>
          
          {/* Cancelled Bookings Card */}
          <div 
            onClick={() => filterByStatus("Cancelled")}
            className={`bg-red-50 rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              selectedStatus === "Cancelled" ? "ring-2 ring-red-600 scale-105" : ""
            }`}
          >
            <p className="text-red-600 text-sm">Cancelled</p>
            <p className="text-2xl font-bold text-red-700">{cancelledBookings}</p>
            <p className="text-xs text-red-500 mt-1">Click to filter</p>
          </div>
          
          {/* Total Revenue Card */}
          <div className="bg-blue-50 rounded-2xl p-4 shadow-sm">
            <p className="text-blue-600 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-700">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-blue-500 mt-1">All time revenue</p>
          </div>
        </div>

        {/* Active Filter Indicator */}
        {(selectedStatus || selectedDate || selectedHotel || search) && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus("")} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs">
                Date: {selectedDate.toLocaleDateString()}
                <button onClick={clearDateFilter} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {selectedHotel && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs">
                Hotel: {selectedHotel}
                <button onClick={() => setSelectedHotel("")} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            {search && !selectedDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs">
                Search: {search}
                <button onClick={() => setSearch("")} className="ml-1 hover:text-red-500">✕</button>
              </span>
            )}
            <button
              onClick={clearDateFilter}
              className="text-sm text-red-500 hover:text-red-600 ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Date Filter Banner */}
        {selectedDate && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">
                Showing bookings for: <strong>{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </span>
              <span className="text-blue-600 ml-2">({filteredBookings.length} bookings)</span>
            </div>
            <button
              onClick={clearDateFilter}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
            >
              Clear Date Filter
            </button>
          </div>
        )}

        {/* Hotel-wise Summary (only show when no status filter) */}
        {!selectedStatus && !selectedDate && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5 text-yellow-500" />
              Bookings by Hotel
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(hotelBookingCounts).map(([hotelName, count]) => (
                <button
                  key={hotelName}
                  onClick={() => setSelectedHotel(selectedHotel === hotelName ? "" : hotelName)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedHotel === hotelName
                      ? "bg-yellow-500 text-white shadow-md scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                  }`}
                >
                  <p className="text-sm font-semibold truncate">{hotelName}</p>
                  <p className={`text-xl font-bold ${selectedHotel === hotelName ? "text-white" : "text-yellow-600"}`}>{count}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Hotel or guest email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500"
                  disabled={selectedDate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">All Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => { setSelectedHotel(""); setSelectedStatus(""); setSearch(""); setSelectedDate(null); }}
                  className="px-4 py-3 text-red-500 hover:text-red-600 text-sm"
                >
                  Clear all
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" /> CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600"
                >
                  <PrinterIcon className="h-4 w-4" /> PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="mb-6">
            <BookingCalendar
              bookings={bookings}
              onSelectDate={handleDateClick}
            />
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {selectedStatus 
                    ? `No ${selectedStatus} bookings found`
                    : selectedDate 
                      ? `No bookings found for ${selectedDate.toLocaleDateString()}`
                      : "No bookings found"}
                </p>
                {(selectedStatus || selectedDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="mt-3 text-yellow-600 hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">
                          <input type="checkbox" checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0} onChange={selectAll} className="w-4 h-4" />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Hotel</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Guest</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Check In</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Check Out</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedBookings.includes(booking._id)} onChange={() => toggleSelectBooking(booking._id)} className="w-4 h-4" />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{booking.hotelName}</p>
                            {booking.roomType && <p className="text-xs text-gray-500">{booking.roomType}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-900">{booking.userEmail}</p>
                            <p className="text-xs text-gray-500">{booking.guests} guests</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-yellow-600">₹{Number(booking.amount).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              booking.status === "Confirmed" ? "bg-green-100 text-green-700" :
                              booking.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {booking.status || "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {booking.status !== "Confirmed" && (
                                <button onClick={() => updateBookingStatus(booking._id, "Confirmed")} className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-green-600">Confirm</button>
                              )}
                              {booking.status !== "Cancelled" && (
                                <button onClick={() => updateBookingStatus(booking._id, "Cancelled")} className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-red-600">Cancel</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                  <span>Showing {filteredBookings.length} of {bookings.length} bookings</span>
                  {selectedStatus && (
                    <span className="text-green-600">Filtered by: {selectedStatus}</span>
                  )}
                  {selectedDate && (
                    <button onClick={clearDateFilter} className="text-yellow-600 hover:underline">
                      Clear date filter
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBookings;