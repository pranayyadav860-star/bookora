// client/src/pages/OwnerTools.js
// PREMIUM VERSION - Enhanced UI/UX with animations

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OwnerNegotiationPanel from '../components/OwnerNegotiationPanel';
import { motion, AnimatePresence } from "framer-motion";

import {
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  PlusCircleIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  SparklesIcon,
  TrophyIcon,
  ClockIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

function OwnerTools() {
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showNegotiationPanel, setShowNegotiationPanel] = useState(false);
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalRooms: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const loadHotels = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/hotels/owner/my-hotels", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHotels(Array.isArray(data) ? data : []);
      
      if (data.length > 0 && !selectedHotel) {
        setSelectedHotel(data[0]);
      }
      if (data.length === 0) {
        setError("No hotels found. Click 'Manage Hotels' to create your first hotel.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error loading hotels:", err);
      setError("Failed to load hotels.");
      setHotels([]);
    }
  };

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/hotels/owner/my-bookings", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        setBookings([]);
        return;
      }
      
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
      
      // Generate recent activities
      const activities = [];
      data.slice(0, 5).forEach(booking => {
        activities.push({
          id: booking._id,
          type: 'booking',
          message: `New booking from ${booking.userEmail || 'Guest'} at ${booking.hotelName}`,
          time: booking.createdAt,
          icon: '📅',
          color: 'blue'
        });
      });
      setRecentActivities(activities);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
    loadBookings();
  }, []);

  useEffect(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const totalRooms = hotels.reduce((sum, h) => sum + (h.roomTypes?.length || 0), 0);
    
    setStats({
      totalHotels: hotels.length,
      totalBookings: bookings.length,
      totalRevenue: totalRevenue,
      totalRooms: totalRooms
    });
  }, [hotels, bookings]);

  const getHotelStats = (hotelId) => {
    const hotelBookings = bookings.filter(b => b.hotelId === hotelId);
    const totalRevenue = hotelBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const confirmedBookings = hotelBookings.filter(b => b.status === "Confirmed").length;
    return { totalBookings: hotelBookings.length, totalRevenue, confirmedBookings };
  };

  const currentMonthRevenue = bookings
    .filter(b => b.createdAt && new Date(b.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  
  const lastMonthRevenue = bookings
    .filter(b => b.createdAt && new Date(b.createdAt).getMonth() === new Date().getMonth() - 1)
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  
  const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const occupancyRate = bookings.length > 0 ? Math.round((bookings.filter(b => b.status === 'Confirmed').length / bookings.length) * 100) : 0;
  const avgRating = hotels.length > 0 ? (hotels.reduce((sum, h) => sum + (h.rating || 0), 0) / hotels.length).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <TrophyIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Owner'}!</h1>
                <p className="text-white/90 text-sm mt-1">Here's what's happening with your properties today</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to="/owner/hotels"
                className="bg-white text-black px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm transform hover:scale-105"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Manage Hotels
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Message with Animation */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-xl p-4 mb-6 flex items-center justify-between"
            >
              <p className="text-yellow-800 text-sm">{error}</p>
              <Link to="/owner/hotels" className="text-yellow-600 text-sm font-semibold hover:underline">
                + Add your first hotel →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Stats Cards with Animation */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Hotels', value: stats.totalHotels, icon: BuildingOfficeIcon, color: 'yellow', trend: null },
            { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarIcon, color: 'blue', trend: null },
            { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CurrencyRupeeIcon, color: 'green', trend: revenueGrowth },
            { label: 'Avg. Rating', value: avgRating, icon: StarIcon, color: 'purple', trend: null, suffix: '/5' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}{stat.suffix || ''}</p>
                  {stat.trend !== null && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                      <span>{Math.abs(stat.trend).toFixed(1)}% vs last month</span>
                    </div>
                  )}
                </div>
                <div className={`bg-${stat.color}-100 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs uppercase tracking-wider">Total Rooms</p>
                <p className="text-3xl font-bold mt-1">{stats.totalRooms}</p>
              </div>
              <HomeIcon className="h-8 w-8 text-blue-200" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs uppercase tracking-wider">Occupancy Rate</p>
                <p className="text-3xl font-bold mt-1">{occupancyRate}%</p>
              </div>
              <div className="w-16 bg-white/20 rounded-full h-2">
                <div className="bg-white rounded-full h-2" style={{ width: `${occupancyRate}%` }}></div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-5 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs uppercase tracking-wider">Success Rate</p>
                <p className="text-3xl font-bold mt-1">{bookings.length > 0 ? Math.round((bookings.filter(b => b.status !== 'Cancelled').length / bookings.length) * 100) : 0}%</p>
              </div>
              <CheckBadgeIcon className="h-8 w-8 text-purple-200" />
            </div>
          </motion.div>
        </div>

        {/* Negotiation Panel Section - Premium */}
        {hotels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-5 mb-8 border border-gray-100"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Customer Negotiation Panel</h3>
                  <p className="text-xs text-gray-500">Real-time chat with customers</p>
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedHotel?._id || ''}
                  onChange={(e) => setSelectedHotel(hotels.find(h => h._id === e.target.value))}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 bg-gray-50"
                >
                  {hotels.map(hotel => (
                    <option key={hotel._id} value={hotel._id}>
                      🏨 {hotel.hotelName} - {hotel.city}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNegotiationPanel(!showNegotiationPanel)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  {showNegotiationPanel ? 'Hide Panel' : 'Open Panel'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Negotiation Panel */}
        <AnimatePresence>
          {showNegotiationPanel && selectedHotel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <OwnerNegotiationPanel 
                hotelId={selectedHotel._id} 
                hotelName={selectedHotel.hotelName} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hotels Section - Premium Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Properties</h2>
              <p className="text-gray-500 text-sm mt-1">Manage and track your hotels</p>
            </div>
            <Link to="/owner/hotels" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center gap-1">
              Manage All <span aria-hidden="true">→</span>
            </Link>
          </div>
          
          {hotels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-2xl shadow-sm"
            >
              <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hotels added yet</p>
              <Link to="/owner/hotels" className="inline-block mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition">
                + Add your first hotel
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.slice(0, 6).map((hotel, idx) => {
                const hotelStats = getHotelStats(hotel._id);
                return (
                  <motion.div
                    key={hotel._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                        alt={hotel.hotelName}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-3 right-3 bg-yellow-500 text-black px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <StarIcon className="h-3 w-3" /> {hotel.rating || 4.0}
                      </div>
                      <div className="absolute bottom-3 left-3 text-white">
                        <p className="text-sm font-semibold">₹{hotel.price}/night</p>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{hotel.hotelName}</h3>
                      <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
                        <BuildingOfficeIcon className="h-3 w-3" /> {hotel.city}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-b border-gray-100">
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-600">{hotelStats.totalBookings}</p>
                          <p className="text-xs text-gray-500">Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-green-600">₹{hotelStats.totalRevenue.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Link
                          to={`/hotel/${hotel._id}`}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-center text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                          <EyeIcon className="h-4 w-4" /> View
                        </Link>
                        <Link
                          to={`/owner/hotels?edit=${hotel._id}`}
                          className="flex-1 bg-yellow-500 text-black py-2 rounded-xl text-center text-sm font-medium hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                        >
                          <PencilIcon className="h-4 w-4" /> Edit
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {hotels.length > 6 && (
            <div className="text-center mt-6">
              <Link to="/owner/hotels" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                View all {hotels.length} hotels →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity & Bookings Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          {bookings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
                  <p className="text-gray-500 text-sm">Latest reservations</p>
                </div>
                <Link to="/owner/bookings" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking, idx) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border rounded-xl p-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{booking.hotelName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            booking.status === "Confirmed" ? "bg-green-100 text-green-700" :
                            booking.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {booking.status || "Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{booking.userEmail || 'Guest'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          📅 {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'} 
                          {booking.checkOut && ` → ${new Date(booking.checkOut).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-600 font-bold text-lg">₹{Number(booking.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-gray-500 text-sm">Latest updates</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {activity.time ? new Date(activity.time).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { to: "/owner/hotels", icon: BuildingOfficeIcon, label: "Manage Hotels", color: "blue" },
            { to: "/owner/bookings", icon: CalendarIcon, label: "My Bookings", color: "green" },
            { to: "/owner/analytics", icon: ChartBarIcon, label: "Analytics", color: "purple" },
            { to: "/", icon: HomeIcon, label: "View Site", color: "gray" }
          ].map((action, idx) => (
            <Link
              key={idx}
              to={action.to}
              className={`bg-gradient-to-r from-${action.color}-500 to-${action.color}-600 text-white p-4 rounded-xl text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
            >
              <action.icon className="h-6 w-6 mx-auto mb-2 group-hover:rotate-12 transition-transform" />
              <p className="font-semibold text-sm">{action.label}</p>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default OwnerTools;