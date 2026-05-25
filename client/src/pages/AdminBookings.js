// client/src/pages/AdminBookings.js
// COMPLETE MODERN UI - No external CSS files needed

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookingCalendar from "../components/BookingCalendar";
import { exportToPDF, exportToCSV } from "../utils/exportUtils";
import toast, { Toaster } from "react-hot-toast";
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
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  ClockIcon,
  FunnelIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("checkIn");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
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
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedHotel, selectedStatus, selectedDate]);

  const updateBookingStatus = async (id, status) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
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
        toast.success(`Booking ${status.toLowerCase()} successfully!`);
        loadData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("Error updating status");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/bookings/delete/${bookingToDelete._id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success("Booking deleted successfully!");
        setShowDeleteModal(false);
        setBookingToDelete(null);
        setSelectedBookings(prev => prev.filter(id => id !== bookingToDelete._id));
        await loadData();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete booking");
      }
    } catch (err) {
      toast.error("Error deleting booking");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) return;
    
    setIsBulkDeleting(true);
    const toastId = toast.loading(`Deleting ${selectedBookings.length} bookings...`);
    
    try {
      const token = localStorage.getItem("token");
      const deletePromises = selectedBookings.map(id =>
        fetch(`http://localhost:5000/api/bookings/delete/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        })
      );
      
      const results = await Promise.all(deletePromises);
      const failed = results.filter(res => !res.ok);
      
      if (failed.length === 0) {
        toast.success(`${selectedBookings.length} bookings deleted successfully!`, { id: toastId });
        setSelectedBookings([]);
        await loadData();
      } else {
        toast.error(`Failed to delete ${failed.length} bookings`, { id: toastId });
        await loadData();
      }
    } catch (err) {
      toast.error("Error during bulk delete", { id: toastId });
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
    setSearch(date.toLocaleDateString());
  };

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

  const sortBookings = (bookingsList) => {
    return [...bookingsList].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'hotelName':
          aVal = a.hotelName || '';
          bVal = b.hotelName || '';
          break;
        case 'userEmail':
          aVal = a.userEmail || '';
          bVal = b.userEmail || '';
          break;
        case 'checkIn':
          aVal = new Date(a.checkIn || 0);
          bVal = new Date(b.checkIn || 0);
          break;
        case 'checkOut':
          aVal = new Date(a.checkOut || 0);
          bVal = new Date(b.checkOut || 0);
          break;
        case 'amount':
          aVal = Number(a.amount) || 0;
          bVal = Number(b.amount) || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getFilteredBookings = () => {
    let filtered = bookings;
    
    if (selectedDate) {
      filtered = getBookingsForDate(selectedDate);
    }
    
    if (search && !selectedDate) {
      filtered = filtered.filter(b => 
        b.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
        b.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        (b.userName && b.userName.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (selectedHotel) {
      filtered = filtered.filter(b => b.hotelName === selectedHotel);
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }
    
    return sortBookings(filtered);
  };

  const clearAllFilters = () => {
    setSelectedDate(null);
    setSearch("");
    setSelectedHotel("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const filteredBookings = getFilteredBookings();
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
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
      toast.error("No bookings to export");
      return;
    }
    exportToPDF(filteredBookings, selectedHotel || (selectedStatus ? `${selectedStatus} Bookings` : "All Hotels"));
    toast.success("PDF export started!");
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      toast.error("No bookings to export");
      return;
    }
    exportToCSV(filteredBookings);
    toast.success("CSV export completed!");
  };
  
  const handleExportSelectedCSV = () => {
    if (selectedBookings.length === 0) {
      toast.error("No bookings selected");
      return;
    }
    const selectedData = bookings.filter(b => selectedBookings.includes(b._id));
    exportToCSV(selectedData);
    toast.success(`Exported ${selectedBookings.length} bookings!`);
  };

  const toggleSelectBooking = (id) => {
    setSelectedBookings(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedBookings.length === paginatedBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(paginatedBookings.map(b => b._id));
    }
  };
  
  const selectAllFiltered = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b._id));
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : 
      <ArrowDownIcon className="h-3 w-3 inline ml-1" />;
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>)}
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#363636', color: '#fff' } }} />
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700 transition-all duration-300 hover:scale-105">← Back</Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">Manage Bookings</h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><SparklesIcon className="h-3 w-3" /> Real-time reservation dashboard</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={loadData} className="group flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 hover:scale-105">
                  <ArrowPathIcon className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
                  <button onClick={() => { setViewMode("list"); setSelectedDate(null); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${viewMode === "list" ? "bg-yellow-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}>
                    <ListBulletIcon className="h-4 w-4" /> <span className="hidden sm:inline">List</span>
                  </button>
                  <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${viewMode === "calendar" ? "bg-yellow-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}>
                    <CalendarDaysIcon className="h-4 w-4" /> <span className="hidden sm:inline">Calendar</span>
                  </button>
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <FunnelIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
            <div onClick={filterAllBookings} className={`group cursor-pointer backdrop-blur-sm bg-white/70 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${!selectedStatus && !selectedDate ? "ring-2 ring-yellow-500 ring-offset-2" : "border border-gray-100"}`}>
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-sm font-medium">Total Bookings</p><p className="text-3xl font-bold text-gray-900 mt-1">{totalBookings}</p></div>
                <div className="bg-yellow-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"><CalendarIcon className="h-6 w-6 text-yellow-600" /></div>
              </div>
            </div>
            <div onClick={() => filterByStatus("Confirmed")} className={`group cursor-pointer backdrop-blur-sm bg-white/70 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${selectedStatus === "Confirmed" ? "ring-2 ring-green-500 ring-offset-2" : "border border-gray-100"}`}>
              <div className="flex justify-between items-start">
                <div><p className="text-green-600 text-sm font-medium">Confirmed</p><p className="text-3xl font-bold text-green-700 mt-1">{confirmedBookings}</p></div>
                <div className="bg-green-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"><CheckCircleIcon className="h-6 w-6 text-green-600" /></div>
              </div>
            </div>
            <div onClick={() => filterByStatus("Pending")} className={`group cursor-pointer backdrop-blur-sm bg-white/70 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${selectedStatus === "Pending" ? "ring-2 ring-yellow-500 ring-offset-2" : "border border-gray-100"}`}>
              <div className="flex justify-between items-start">
                <div><p className="text-yellow-600 text-sm font-medium">Pending</p><p className="text-3xl font-bold text-yellow-700 mt-1">{pendingBookings}</p></div>
                <div className="bg-yellow-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"><ClockIcon className="h-6 w-6 text-yellow-600" /></div>
              </div>
            </div>
            <div onClick={() => filterByStatus("Cancelled")} className={`group cursor-pointer backdrop-blur-sm bg-white/70 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${selectedStatus === "Cancelled" ? "ring-2 ring-red-500 ring-offset-2" : "border border-gray-100"}`}>
              <div className="flex justify-between items-start">
                <div><p className="text-red-600 text-sm font-medium">Cancelled</p><p className="text-3xl font-bold text-red-700 mt-1">{cancelledBookings}</p></div>
                <div className="bg-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"><ExclamationTriangleIcon className="h-6 w-6 text-red-600" /></div>
              </div>
            </div>
            <div className="group backdrop-blur-sm bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <div><p className="text-blue-600 text-sm font-medium">Total Revenue</p><p className="text-3xl font-bold text-blue-700 mt-1">₹{totalRevenue.toLocaleString()}</p></div>
                <div className="bg-blue-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"><CurrencyRupeeIcon className="h-6 w-6 text-blue-700" /></div>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="backdrop-blur-md bg-white/90 rounded-2xl p-6 shadow-xl mb-8 transition-all duration-500 animate-slideDown">
              <div className="grid md:grid-cols-4 gap-5">
                <div><label className="block text-sm font-semibold mb-2 text-gray-700">🔍 Search</label><input type="text" placeholder="Hotel, guest email or name..." value={search} onChange={(e) => setSearch(e.target.value)} disabled={!!selectedDate} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all" /></div>
                <div><label className="block text-sm font-semibold mb-2 text-gray-700">🏷️ Status</label><select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500"><option value="">All Status</option><option value="Confirmed">Confirmed</option><option value="Pending">Pending</option><option value="Cancelled">Cancelled</option></select></div>
                <div><label className="block text-sm font-semibold mb-2 text-gray-700">📄 Items per page</label><select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="w-full p-3 border border-gray-200 rounded-xl"><option value={5}>5 per page</option><option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option></select></div>
                <div className="flex items-end gap-3"><button onClick={clearAllFilters} className="px-4 py-3 text-red-500 hover:text-red-600 text-sm font-medium transition-colors">Clear all</button><button onClick={handleExportCSV} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-all shadow-md">📄 CSV</button><button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-all shadow-md">🖨️ PDF</button></div>
              </div>
            </div>
          )}

          {/* Active Filters Chips */}
          {(selectedStatus || selectedDate || selectedHotel || search) && (
            <div className="mb-6 flex flex-wrap gap-2 items-center animate-fadeIn">
              <span className="text-sm text-gray-500">Active filters:</span>
              {selectedStatus && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">Status: {selectedStatus} <button onClick={() => setSelectedStatus("")} className="ml-1 text-red-400 hover:text-red-600">✕</button></span>}
              {selectedDate && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">Date: {selectedDate.toLocaleDateString()} <button onClick={clearAllFilters} className="ml-1 text-red-400 hover:text-red-600">✕</button></span>}
              {selectedHotel && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">Hotel: {selectedHotel} <button onClick={() => setSelectedHotel("")} className="ml-1 text-red-400 hover:text-red-600">✕</button></span>}
              {search && !selectedDate && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">Search: {search} <button onClick={() => setSearch("")} className="ml-1 text-red-400 hover:text-red-600">✕</button></span>}
              <button onClick={clearAllFilters} className="text-sm text-red-500 hover:text-red-600 underline ml-2">Clear all</button>
            </div>
          )}

          {/* Bulk Action Bar */}
          {selectedBookings.length > 0 && viewMode === "list" && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-md animate-slideDown">
              <div className="flex items-center gap-3"><span className="text-yellow-800 font-bold">{selectedBookings.length} booking(s) selected</span><button onClick={selectAllFiltered} className="text-sm text-yellow-700 hover:text-yellow-900 underline">{selectedBookings.length === filteredBookings.length ? "Deselect all" : "Select all filtered"}</button></div>
              <div className="flex gap-3"><button onClick={handleExportSelectedCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-all shadow-md">📎 Export Selected</button><button onClick={() => { if (window.confirm(`Delete ${selectedBookings.length} bookings?`)) handleBulkDelete(); }} disabled={isBulkDeleting} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-all shadow-md disabled:opacity-50">{isBulkDeleting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <TrashIcon className="h-4 w-4" />} Delete Selected</button></div>
            </div>
          )}

          {/* Calendar View */}
          {viewMode === "calendar" && (
            <div className="mb-8 transition-all duration-500">
              <BookingCalendar bookings={bookings} onSelectDate={handleDateClick} />
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-16"><div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><CalendarIcon className="h-10 w-10 text-gray-400" /></div><p className="text-gray-500 text-lg">No bookings found</p><button onClick={clearAllFilters} className="mt-4 text-yellow-600 hover:underline font-medium">Clear all filters</button></div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr><th className="px-4 py-4 w-10"><input type="checkbox" checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0} onChange={selectAll} className="w-4 h-4 rounded border-gray-300" /></th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition" onClick={() => handleSort('hotelName')}>Hotel {getSortIcon('hotelName')}</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition" onClick={() => handleSort('userEmail')}>Guest {getSortIcon('userEmail')}</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition" onClick={() => handleSort('checkIn')}>Check In {getSortIcon('checkIn')}</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition" onClick={() => handleSort('checkOut')}>Check Out {getSortIcon('checkOut')}</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition" onClick={() => handleSort('amount')}>Amount {getSortIcon('amount')}</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition" onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Actions</th></tr>
                      </thead>
                      <tbody>
                        {paginatedBookings.map((booking) => (
                          <tr key={booking._id} className="border-b border-gray-100 hover:bg-yellow-50/30 transition-all duration-200 group">
                            <td className="px-4 py-4"><input type="checkbox" checked={selectedBookings.includes(booking._id)} onChange={() => toggleSelectBooking(booking._id)} className="w-4 h-4 rounded border-gray-300" /></td>
                            <td className="px-4 py-4"><p className="font-semibold text-gray-900">{booking.hotelName}</p>{booking.roomType && <p className="text-xs text-gray-400">{booking.roomType}</p>}</td>
                            <td className="px-4 py-4"><p className="text-gray-800">{booking.userEmail}</p><p className="text-xs text-gray-400">{booking.guests || 1} guest(s)</p></td>
                            <td className="px-4 py-4"><span className="text-sm">{booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}</span></td>
                            <td className="px-4 py-4"><span className="text-sm">{booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}</span></td>
                            <td className="px-4 py-4"><p className="font-bold text-yellow-600">₹{Number(booking.amount).toLocaleString()}</p></td>
                            <td className="px-4 py-4"><span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${booking.status === "Confirmed" ? "bg-green-100 text-green-700" : booking.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{booking.status || "Pending"}</span></td>
                            <td className="px-4 py-4"><div className="flex gap-2 flex-wrap">
                              <button onClick={() => viewBookingDetails(booking)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50 transition" title="Details"><EyeIcon className="h-4 w-4" /></button>
                              {booking.status !== "Confirmed" && <button onClick={() => updateBookingStatus(booking._id, "Confirmed")} disabled={actionLoading[booking._id]} className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-green-600 disabled:opacity-50 shadow-sm">Confirm</button>}
                              {booking.status !== "Cancelled" && booking.status !== "Confirmed" && <button onClick={() => updateBookingStatus(booking._id, "Cancelled")} disabled={actionLoading[booking._id]} className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-red-600 disabled:opacity-50 shadow-sm">Cancel</button>}
                              <button onClick={() => { setBookingToDelete(booking); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {paginatedBookings.map((booking) => (
                      <div key={booking._id} className="p-4 hover:bg-yellow-50/30 transition">
                        <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><input type="checkbox" checked={selectedBookings.includes(booking._id)} onChange={() => toggleSelectBooking(booking._id)} className="w-4 h-4 rounded" /><span className="font-bold text-gray-900">{booking.hotelName}</span><span className={`text-xs px-2 py-0.5 rounded-full ${booking.status === "Confirmed" ? "bg-green-100 text-green-700" : booking.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{booking.status}</span></div><button onClick={() => viewBookingDetails(booking)} className="text-blue-600"><EyeIcon className="h-5 w-5" /></button></div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2"><div><span className="text-gray-500">Guest:</span> {booking.userEmail?.split('@')[0]}</div><div><span className="text-gray-500">Amount:</span> <span className="font-semibold text-yellow-600">₹{Number(booking.amount).toLocaleString()}</span></div><div><span className="text-gray-500">Check In:</span> {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}</div><div><span className="text-gray-500">Check Out:</span> {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}</div></div>
                        <div className="flex gap-2 mt-3">{booking.status !== "Confirmed" && <button onClick={() => updateBookingStatus(booking._id, "Confirmed")} className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs">Confirm</button>}{booking.status !== "Cancelled" && booking.status !== "Confirmed" && <button onClick={() => updateBookingStatus(booking._id, "Cancelled")} className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs">Cancel</button>}<button onClick={() => { setBookingToDelete(booking); setShowDeleteModal(true); }} className="text-red-600 border border-red-200 px-2 py-1 rounded-lg text-xs">Delete</button></div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3 bg-gray-50/50">
                      <div className="text-sm text-gray-500">Showing {(currentPage-1)*itemsPerPage+1} to {Math.min(currentPage*itemsPerPage, filteredBookings.length)} of {filteredBookings.length}</div>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4" /></button>
                        <div className="flex gap-1">{Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let page = totalPages<=5 ? i+1 : (currentPage<=3 ? i+1 : (currentPage>=totalPages-2 ? totalPages-4+i : currentPage-2+i)); return <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition ${currentPage===page ? "bg-yellow-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>; })}</div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"><ChevronRightIcon className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && bookingToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-100">
              <div className="flex items-center gap-3 mb-4"><div className="bg-red-100 p-2 rounded-full"><ExclamationTriangleIcon className="h-6 w-6 text-red-600" /></div><h3 className="text-xl font-bold text-gray-900">Delete Booking</h3></div>
              <p className="text-gray-600 mb-2">Are you sure you want to delete the booking for <strong>{bookingToDelete.hotelName}</strong>?</p>
              <p className="text-gray-500 text-sm mb-4">Guest: {bookingToDelete.userEmail}<br />Check-in: {bookingToDelete.checkIn ? new Date(bookingToDelete.checkIn).toLocaleDateString() : 'N/A'}<br />Amount: ₹{Number(bookingToDelete.amount).toLocaleString()}</p>
              <p className="text-red-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end"><button onClick={() => { setShowDeleteModal(false); setBookingToDelete(null); }} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition">Cancel</button><button onClick={handleDeleteBooking} disabled={isDeleting} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2">{isDeleting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <TrashIcon className="h-4 w-4" />} Delete</button></div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">Booking Details</h3><button onClick={() => { setShowDetailsModal(false); setSelectedBooking(null); }} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-gray-500">Hotel</label><p className="font-semibold">{selectedBooking.hotelName}</p></div>
                  <div><label className="text-xs text-gray-500">Room Type</label><p>{selectedBooking.roomType || 'N/A'}</p></div>
                  <div><label className="text-xs text-gray-500">Guest Email</label><p>{selectedBooking.userEmail}</p></div>
                  <div><label className="text-xs text-gray-500">Guests</label><p>{selectedBooking.guests || 1}</p></div>
                  <div><label className="text-xs text-gray-500">Check In</label><p>{selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : 'N/A'}</p></div>
                  <div><label className="text-xs text-gray-500">Check Out</label><p>{selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : 'N/A'}</p></div>
                  <div><label className="text-xs text-gray-500">Amount</label><p className="text-xl font-bold text-yellow-600">₹{Number(selectedBooking.amount).toLocaleString()}</p></div>
                  <div><label className="text-xs text-gray-500">Status</label><span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${selectedBooking.status === "Confirmed" ? "bg-green-100 text-green-700" : selectedBooking.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{selectedBooking.status || "Pending"}</span></div>
                </div>
                {selectedBooking.specialRequests && (<div><label className="text-xs text-gray-500">Special Requests</label><p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedBooking.specialRequests}</p></div>)}
                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  {selectedBooking.status !== "Confirmed" && <button onClick={() => { updateBookingStatus(selectedBooking._id, "Confirmed"); setShowDetailsModal(false); }} className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600">Confirm Booking</button>}
                  {selectedBooking.status !== "Cancelled" && selectedBooking.status !== "Confirmed" && <button onClick={() => { updateBookingStatus(selectedBooking._id, "Cancelled"); setShowDetailsModal(false); }} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600">Cancel Booking</button>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminBookings;