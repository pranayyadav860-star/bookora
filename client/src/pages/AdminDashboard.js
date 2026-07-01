// client/src/pages/AdminDashboard.js
// FIXED VERSION - Correct hotel name field

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

function AdminDashboard() {
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  /* =========================
     LOAD DATA WITH AUTH TOKEN
  ========================= */
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const loadData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      const headers = {
        "Authorization": `Bearer ${token}`
      };

      // Fetch all data with proper error handling
      const [hotelsRes, bookingsRes, usersRes] = await Promise.all([
        fetch("https://bookora-server-22ox.onrender.com/api/hotels", { headers }),
        fetch("https://bookora-server-22ox.onrender.com/api/bookings", { headers }),
        fetch("https://bookora-server-22ox.onrender.com/api/users", { headers })
      ]);

      // Check if responses are ok
      if (!hotelsRes.ok || !bookingsRes.ok || !usersRes.ok) {
        if (hotelsRes.status === 401 || bookingsRes.status === 401 || usersRes.status === 401) {
          // Token expired or invalid
          logout();
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const hotelData = await hotelsRes.json();
      const bookingData = await bookingsRes.json();
      const userData = await usersRes.json();

      setHotels(Array.isArray(hotelData) ? hotelData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      
      // Generate recent activity
      generateRecentActivity(bookingData, hotelData);
      
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // ============ FIXED: generateRecentActivity ============
  const generateRecentActivity = (bookings, hotels) => {
    const activities = [];
    
    // Recent bookings (last 5)
    if (Array.isArray(bookings) && bookings.length > 0) {
      const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
        .map(b => ({
          type: 'booking',
          message: `📅 New booking at ${b.hotelName || 'Unknown Hotel'}`,
          time: b.createdAt || new Date(),
          icon: '📅'
        }));
      
      activities.push(...recentBookings);
    }
    
    // ============ FIXED: Use hotelName instead of name ============
    if (Array.isArray(hotels) && hotels.length > 0) {
      const recentHotels = [...hotels]
        .sort((a, b) => {
          const dateA = a.createdAt || a.updatedAt || new Date(0);
          const dateB = b.createdAt || b.updatedAt || new Date(0);
          return new Date(dateB) - new Date(dateA);
        })
        .slice(0, 5)
        .map(h => ({
          type: 'hotel',
          message: `🏨 New hotel added: ${h.hotelName || 'Hotel'}`,
          time: h.createdAt || h.updatedAt || new Date(),
          icon: '🏨'
        }));
      
      activities.push(...recentHotels);
    }
    
    // Sort all activities by time (most recent first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    setRecentActivity(activities.slice(0, 10));
  };
  // ============ END FIX ============

  useEffect(() => {
    if (user && user.role === "admin") {
      loadData();
      // Auto-refresh every 30 seconds
      const timer = setInterval(loadData, 30000);
      return () => clearInterval(timer);
    }
  }, [user]);

  /* =========================
     HANDLE ADD HOTEL
  ========================= */
  const handleAddHotel = () => {
    navigate("/admin/add-hotel");
  };

  /* =========================
     HANDLE LOGOUT
  ========================= */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* =========================
     STATS CALCULATIONS
  ========================= */
  const totalRevenue = Array.isArray(bookings) 
    ? bookings.reduce((sum, item) => sum + Number(item.amount || 0), 0) 
    : 0;
    
  const totalCities = Array.isArray(hotels) 
    ? [...new Set(hotels.map(h => h.city).filter(Boolean))].length 
    : 0;
    
  const totalRooms = Array.isArray(hotels) 
    ? hotels.reduce((sum, hotel) => sum + (hotel.roomTypes?.length || 0), 0) 
    : 0;
    
  const occupancyRate = Array.isArray(bookings) && bookings.length > 0 
    ? Math.round((bookings.filter(b => b.status === 'Confirmed').length / bookings.length) * 100) 
    : 0;
  
  // Revenue trends
  const currentMonthRevenue = Array.isArray(bookings)
    ? bookings
        .filter(b => b.createdAt && new Date(b.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, b) => sum + Number(b.amount || 0), 0)
    : 0;
  
  const lastMonthRevenue = Array.isArray(bookings)
    ? bookings
        .filter(b => b.createdAt && new Date(b.createdAt).getMonth() === new Date().getMonth() - 1)
        .reduce((sum, b) => sum + Number(b.amount || 0), 0)
    : 0;
  
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;
  
  // Status counts
  const pendingBookings = Array.isArray(bookings) 
    ? bookings.filter(b => b.status === 'Pending').length 
    : 0;
    
  const cancelledBookings = Array.isArray(bookings) 
    ? bookings.filter(b => b.status === 'Cancelled').length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Notifications Toast */}
      {showNotifications && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎉</div>
                <div>
                  <p className="font-semibold text-gray-800">Welcome back, {user?.name || 'Admin'}!</p>
                  <p className="text-sm text-gray-600">You have {pendingBookings} pending bookings to review</p>
                </div>
              </div>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
                Bookora Admin Portal
              </h1>
              <p className="text-gray-500 mt-2">
                Manage your hotel ecosystem efficiently
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-sm">
                  👑 Logged in as {user?.email}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              
              <button 
                onClick={handleLogout} 
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Hotels Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300 border-b-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Hotels</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">{hotels.length}</h2>
                <p className="text-sm text-gray-400 mt-2">{totalCities} cities</p>
              </div>
              <div className="bg-yellow-100 rounded-xl p-3">
                <BuildingOfficeIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/admin/hotels" className="text-yellow-600 text-sm font-medium hover:text-yellow-700">
                Manage Hotels →
              </Link>
            </div>
          </div>

          {/* Bookings Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300 border-b-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">{bookings.length}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending: {pendingBookings}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Cancelled: {cancelledBookings}</span>
                </div>
              </div>
              <div className="bg-green-100 rounded-xl p-3">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/admin/bookings" className="text-green-600 text-sm font-medium hover:text-green-700">
                View All Bookings →
              </Link>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300 border-b-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">₹{totalRevenue.toLocaleString()}</h2>
                <div className={`flex items-center gap-1 mt-2 text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueGrowth >= 0 ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
                  <span>{Math.abs(revenueGrowth).toFixed(1)}% vs last month</span>
                </div>
              </div>
              <div className="bg-purple-100 rounded-xl p-3">
                <CurrencyRupeeIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Occupancy Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300 border-b-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Occupancy Rate</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">{occupancyRate}%</h2>
                <p className="text-sm text-gray-400 mt-2">{totalRooms} total rooms</p>
              </div>
              <div className="bg-orange-100 rounded-xl p-3">
                <UserGroupIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 rounded-full h-2" style={{ width: `${occupancyRate}%` }}></div>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/admin/hotels" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-5 rounded-xl text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <BuildingOfficeIcon className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-bold text-lg">Manage Hotels</h3>
            <p className="text-sm text-yellow-100">Add, edit or remove hotels</p>
          </Link>
          
          <Link to="/admin/bookings" className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-xl text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-bold text-lg">Manage Bookings</h3>
            <p className="text-sm text-green-100">View and update bookings</p>
          </Link>
          
          <Link to="/admin/users" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-5 rounded-xl text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <UserGroupIcon className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-bold text-lg">Manage Users</h3>
            <p className="text-sm text-purple-100">{users.length} registered users</p>
          </Link>
          
          <Link to="/" className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-5 rounded-xl text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <ChartBarIcon className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-bold text-lg">View Website</h3>
            <p className="text-sm text-gray-300">Go to public site</p>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Latest Bookings */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Latest Bookings</h2>
                <p className="text-gray-500 text-sm mt-1">Most recent reservations</p>
              </div>
              <Link to="/admin/bookings" className="text-yellow-600 font-medium hover:text-yellow-700">
                View All →
              </Link>
            </div>
            
            <div className="space-y-4">
              {Array.isArray(bookings) && bookings.slice(0, 5).map((b) => (
                <div key={b._id} className="border rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-800">{b.hotelName || 'Unknown Hotel'}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          b.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                          b.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {b.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{b.userEmail || 'No email'}</p>
                      {b.checkIn && b.checkOut && (
                        <p className="text-sm text-gray-500 mt-1">
                          📅 {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-600 text-xl font-bold">₹{Number(b.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!bookings || bookings.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3" />
                  <p>No bookings yet</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Activity & Quick Stats */}
          <div className="space-y-6">
            
            {/* Recent Activity Feed */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.time ? new Date(activity.time).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
            
            {/* Quick Stats Summary */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Booking Value:</span>
                  <span className="font-semibold text-gray-800">
                    ₹{(totalRevenue / (bookings.length || 1)).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hotels per City:</span>
                  <span className="font-semibold text-gray-800">
                    {(hotels.length / (totalCities || 1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate:</span>
                  <span className="font-semibold text-gray-800">
                    {bookings.length > 0 ? Math.round((bookings.filter(b => b.status !== 'Cancelled').length / bookings.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-yellow-200">
                  <span className="text-sm text-gray-600">Total Users:</span>
                  <span className="font-semibold text-gray-800">{users.length}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
      
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
      
    </div>
  );
}

export default AdminDashboard;