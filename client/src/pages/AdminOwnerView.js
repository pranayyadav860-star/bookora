// client/src/pages/AdminOwnerView.js
// COMPLETE WORKING VERSION

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

function AdminOwnerView() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOwner, setExpandedOwner] = useState(null);
  const [ownerHotels, setOwnerHotels] = useState({});
  const [ownerBookings, setOwnerBookings] = useState({});
  const [loadingHotels, setLoadingHotels] = useState({});
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const loadOwners = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      
      const allUsers = await res.json();
      const ownerUsers = allUsers.filter(u => u.role === "owner");
      setOwners(ownerUsers);
    } catch (err) {
      console.error("Error loading owners:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerHotels = async (ownerId) => {
    setLoadingHotels(prev => ({ ...prev, [ownerId]: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://bookora-server-22ox.onrender.com/api/hotels/owner/${ownerId}/hotels`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const hotels = await res.json();
      setOwnerHotels(prev => ({ ...prev, [ownerId]: hotels }));
    } catch (err) {
      console.error("Error loading owner hotels:", err);
      setOwnerHotels(prev => ({ ...prev, [ownerId]: [] }));
    } finally {
      setLoadingHotels(prev => ({ ...prev, [ownerId]: false }));
    }
  };

  const loadOwnerBookings = async (ownerId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://bookora-server-22ox.onrender.com/api/hotels/owner/${ownerId}/bookings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const bookings = await res.json();
      setOwnerBookings(prev => ({ ...prev, [ownerId]: bookings }));
    } catch (err) {
      console.error("Error loading owner bookings:", err);
      setOwnerBookings(prev => ({ ...prev, [ownerId]: [] }));
    }
  };

  const handleOwnerClick = async (owner) => {
    if (expandedOwner === owner._id) {
      setExpandedOwner(null);
    } else {
      setExpandedOwner(owner._id);
      if (!ownerHotels[owner._id]) {
        await loadOwnerHotels(owner._id);
        await loadOwnerBookings(owner._id);
      }
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  // Calculate totals
  const totalHotels = Object.values(ownerHotels).flat().length;
  const totalBookings = Object.values(ownerBookings).flat().length;
  const totalRevenue = Object.values(ownerBookings).flat().reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading owners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Owner Management</h1>
              <p className="text-white/90 mt-1">View and manage all hotel owners</p>
            </div>
            <Link to="/admin/dashboard" className="bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Owners</p>
                <p className="text-3xl font-bold text-gray-900">{owners.length}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Properties</p>
                <p className="text-3xl font-bold text-blue-600">{totalHotels}</p>
              </div>
              <BuildingOfficeIcon className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-green-600">{totalBookings}</p>
              </div>
              <CalendarIcon className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <CurrencyRupeeIcon className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Owners List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Registered Owners</h2>
            <p className="text-sm text-gray-500 mt-1">Click on any owner to view their hotels and bookings</p>
          </div>
          
          {owners.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No owners registered yet</p>
              <Link to="/owner/register" className="inline-block mt-3 text-yellow-600 hover:underline">
                + Register as Owner
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {owners.map((owner) => (
                <div key={owner._id} className="hover:bg-gray-50 transition">
                  {/* Owner Header */}
                  <div 
                    className="px-6 py-4 cursor-pointer flex justify-between items-center"
                    onClick={() => handleOwnerClick(owner)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-lg">
                          {owner.name?.charAt(0) || owner.email?.charAt(0) || "O"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{owner.name || "N/A"}</h3>
                        <p className="text-sm text-gray-500">{owner.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          📅 Joined: {owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-500">Hotels</p>
                        <p className="font-semibold text-gray-900">{ownerHotels[owner._id]?.length || 0}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-500">Bookings</p>
                        <p className="font-semibold text-gray-900">{ownerBookings[owner._id]?.length || 0}</p>
                      </div>
                      {expandedOwner === owner._id ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Owner Details */}
                  {expandedOwner === owner._id && (
                    <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                      <div className="grid md:grid-cols-2 gap-6 mt-4">
                        
                        {/* Owner's Hotels */}
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <BuildingOfficeIcon className="h-5 w-5 text-yellow-500" />
                            Properties Owned ({ownerHotels[owner._id]?.length || 0})
                          </h4>
                          {loadingHotels[owner._id] ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mx-auto"></div>
                            </div>
                          ) : ownerHotels[owner._id]?.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">No hotels added yet</p>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              {ownerHotels[owner._id]?.map((hotel) => (
                                <div key={hotel._id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                    <p className="font-medium text-gray-900">{hotel.hotelName}</p>
                                    <p className="text-xs text-gray-500">📍 {hotel.city} | ₹{hotel.price}/night</p>
                                    <p className="text-xs text-gray-400">⭐ {hotel.rating} rating</p>
                                  </div>
                                  <Link
                                    to={`/hotel/${hotel._id}`}
                                    className="text-yellow-600 hover:text-yellow-700 p-2"
                                    target="_blank"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Link>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Owner's Bookings */}
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-green-500" />
                            Recent Bookings ({ownerBookings[owner._id]?.length || 0})
                          </h4>
                          {ownerBookings[owner._id]?.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">No bookings yet</p>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              {ownerBookings[owner._id]?.slice(0, 10).map((booking) => (
                                <div key={booking._id} className="border rounded-lg p-3">
                                  <p className="font-medium text-gray-900">{booking.hotelName}</p>
                                  <p className="text-xs text-gray-500">
                                    📅 {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'} 
                                    → {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}
                                  </p>
                                  <p className="text-xs text-gray-500">👤 {booking.userEmail}</p>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      booking.status === "Confirmed" ? "bg-green-100 text-green-700" :
                                      booking.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                      "bg-red-100 text-red-700"
                                    }`}>
                                      {booking.status || "Pending"}
                                    </span>
                                    <p className="text-sm font-bold text-green-600">₹{Number(booking.amount).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                        <Link
                          to={`/admin/hotels`}
                          className="text-sm bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                        >
                          View All Hotels
                        </Link>
                        <Link
                          to={`/admin/bookings`}
                          className="text-sm bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                        >
                          View All Bookings
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ About Owner View</h3>
          <p className="text-sm text-blue-700">
            As an admin, you can see all registered owners and their properties. Click on any owner to expand and view their hotels and bookings.
            Use the "View All Hotels" and "View All Bookings" links to see complete details.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminOwnerView;