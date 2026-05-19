import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChartBarIcon, ArrowLeftIcon, TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

function OwnerAnalytics() {
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [hotelsRes, bookingsRes] = await Promise.all([
        fetch("http://localhost:5000/api/hotels/owner/my-hotels", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/hotels/owner/my-bookings", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);
      
      const hotelsData = await hotelsRes.json();
      const bookingsData = await bookingsRes.json();
      
      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
  
  // Monthly revenue
  const monthlyRevenue = {};
  bookings.forEach(b => {
    if (b.createdAt) {
      const month = new Date(b.createdAt).toLocaleString('default', { month: 'long' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(b.amount) || 0);
    }
  });

  // Hotel performance
  const hotelPerformance = hotels.map(hotel => ({
    name: hotel.hotelName,
    bookings: bookings.filter(b => b.hotelId === hotel._id).length,
    revenue: bookings.filter(b => b.hotelId === hotel._id).reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  })).sort((a, b) => b.revenue - a.revenue);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/owner/dashboard" className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm opacity-90">Track your business performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Total Hotels</p>
            <p className="text-3xl font-bold text-gray-900">{hotels.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Confirmed Bookings</p>
            <p className="text-3xl font-bold text-green-600">{confirmedBookings}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-600">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Hotel Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hotel Performance</h2>
          <div className="space-y-3">
            {hotelPerformance.map((hotel, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{hotel.name}</p>
                    <p className="text-sm text-gray-500">{hotel.bookings} bookings</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">₹{hotel.revenue.toLocaleString()}</p>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 rounded-full h-2"
                    style={{ width: `${Math.min(100, (hotel.revenue / totalRevenue) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Revenue</h2>
          <div className="space-y-3">
            {Object.entries(monthlyRevenue).map(([month, revenue]) => (
              <div key={month} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-gray-600">{month}</div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-teal-500 h-full flex items-center justify-end pr-2 text-white text-xs font-bold"
                      style={{ width: `${Math.min(100, (revenue / totalRevenue) * 100)}%` }}
                    >
                      {revenue > 0 && `₹${revenue.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerAnalytics;