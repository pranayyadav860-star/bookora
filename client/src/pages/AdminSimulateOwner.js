// client/src/pages/AdminSimulateOwner.js
// SIMPLE WORKING VERSION - With Debug Info

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  EyeIcon,
  PencilIcon,
  PlusCircleIcon,
  HomeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

function AdminSimulateOwner() {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Load all owners
  useEffect(() => {
    const loadOwners = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        console.log("Fetching users from API...");
        const res = await fetch("https://bookora-server-22ox.onrender.com/api/users", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        
        const allUsers = await res.json();
        console.log("All users:", allUsers);
        
        // Filter only users with role "owner"
        const ownerUsers = allUsers.filter(u => u.role === "owner");
        console.log("Owners found:", ownerUsers.length);
        setOwners(ownerUsers);
        
        // If there are owners, select the first one
        if (ownerUsers.length > 0) {
          setSelectedOwner(ownerUsers[0]);
        } else {
          setError("No owners found in the system. Please register an owner first.");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading owners:", err);
        setError("Failed to load owners: " + err.message);
        setLoading(false);
      }
    };
    
    loadOwners();
  }, []);

  // Load data for selected owner
  useEffect(() => {
    if (!selectedOwner) return;
    
    const loadOwnerData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        console.log(`Loading hotels for owner: ${selectedOwner.name} (${selectedOwner._id})`);
        
        // Get owner's hotels
        const hotelsRes = await fetch(`https://bookora-server-22ox.onrender.com/api/hotels/owner/${selectedOwner._id}/hotels`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (hotelsRes.ok) {
          const hotelsData = await hotelsRes.json();
          setHotels(Array.isArray(hotelsData) ? hotelsData : []);
          console.log(`Found ${hotelsData.length} hotels for this owner`);
        } else {
          console.log("Failed to fetch hotels:", hotelsRes.status);
          setHotels([]);
        }
        
        // Get owner's bookings
        const bookingsRes = await fetch(`https://bookora-server-22ox.onrender.com/api/hotels/owner/${selectedOwner._id}/bookings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(Array.isArray(bookingsData) ? bookingsData : []);
          console.log(`Found ${bookingsData.length} bookings for this owner`);
        } else {
          setBookings([]);
        }
        
      } catch (err) {
        console.error("Error loading owner data:", err);
      }
    };
    
    loadOwnerData();
  }, [selectedOwner]);

  const stats = {
    totalHotels: hotels.length,
    totalBookings: bookings.length,
    totalRevenue: bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0),
    totalRooms: hotels.reduce((sum, h) => sum + (h.roomTypes?.length || 0), 0)
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/admin/dashboard" className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (owners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md mx-4">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Owners Found</h2>
          <p className="text-gray-600 mb-4">There are no registered hotel owners in the system yet.</p>
          <div className="space-y-3">
            <Link to="/owner/register" className="block bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold">
              Register as Owner
            </Link>
            <Link to="/admin/dashboard" className="block bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold">
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Simulation Banner */}
      <div className="bg-purple-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            <span>Admin Simulation Mode - Viewing as admin</span>
          </div>
          <Link to="/admin/dashboard" className="bg-white text-purple-600 px-3 py-1 rounded-lg text-sm font-semibold">
            Exit to Admin
          </Link>
        </div>
      </div>

      {/* Header with Owner Selector Dropdown */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">👁️ View Owner Dashboard</h1>
              <p className="text-white/90 text-sm mt-1">
                Select an owner to see exactly what they see
              </p>
            </div>
            
            {/* Owner Selector Dropdown - VISIBLE NOW */}
            <div className="bg-white rounded-xl px-4 py-2 min-w-[200px]">
              <label className="text-xs text-gray-500 block">Select Owner:</label>
              <select
                value={selectedOwner?._id || ""}
                onChange={(e) => {
                  const owner = owners.find(o => o._id === e.target.value);
                  setSelectedOwner(owner);
                }}
                className="text-black font-semibold bg-transparent outline-none w-full cursor-pointer"
              >
                {owners.map(owner => (
                  <option key={owner._id} value={owner._id}>
                    {owner.name || owner.email} ({owner.hotelIds?.length || 0} hotels)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Current Owner Info */}
      {selectedOwner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">
                  {selectedOwner.name?.charAt(0) || selectedOwner.email?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Currently viewing dashboard for:</p>
                <p className="font-semibold text-gray-900">{selectedOwner.name || "Unnamed"}</p>
                <p className="text-sm text-gray-500">{selectedOwner.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Dashboard View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase">Hotels</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHotels}</p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase">Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase">Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <CurrencyRupeeIcon className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase">Rooms</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalRooms}</p>
              </div>
              <HomeIcon className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Hotels Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Properties ({hotels.length})
          </h2>
          
          {hotels.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">This owner hasn't added any hotels yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hotels.map((hotel) => {
                const hotelBookings = bookings.filter(b => b.hotelId === hotel._id);
                const hotelRevenue = hotelBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
                
                return (
                  <div key={hotel._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                        alt={hotel.hotelName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-0.5 rounded-lg text-xs font-semibold">
                        ⭐ {hotel.rating}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900">{hotel.hotelName}</h3>
                      <p className="text-gray-500 text-xs mb-2">📍 {hotel.city}</p>
                      <p className="text-yellow-600 text-xl font-bold">₹{hotel.price}<span className="text-xs text-gray-400">/night</span></p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-600">{hotelBookings.length}</p>
                          <p className="text-xs text-gray-500">Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-600">₹{hotelRevenue.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Link
                          to={`/hotel/${hotel._id}`}
                          className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded-lg text-center text-sm font-medium hover:bg-gray-200 transition"
                          target="_blank"
                        >
                          <EyeIcon className="h-3 w-3 inline mr-1" />
                          View
                        </Link>
                        <Link
                          to="/admin/hotels"
                          className="flex-1 bg-yellow-500 text-black py-1.5 rounded-lg text-center text-sm font-medium hover:bg-yellow-600 transition"
                        >
                          <PencilIcon className="h-3 w-3 inline mr-1" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bookings Section */}
        {bookings.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
            <div className="space-y-2">
              {bookings.slice(0, 10).map((booking) => (
                <div key={booking._id} className="border rounded-lg p-3 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{booking.hotelName}</p>
                      <p className="text-sm text-gray-500">{booking.userEmail}</p>
                      <p className="text-xs text-gray-400">
                        {booking.checkIn} → {booking.checkOut}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{booking.amount}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSimulateOwner;