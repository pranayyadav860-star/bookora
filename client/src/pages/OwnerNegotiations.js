import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OwnerNegotiationPanel from '../components/OwnerNegotiationPanel';
import { 
  BuildingOfficeIcon, 
  ChatBubbleLeftRightIcon, 
  BellAlertIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function OwnerNegotiations() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    fetchOwnerHotels();
  }, [user]);

  const fetchOwnerHotels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/hotels/owner', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setHotels(data);
      if (data.length > 0) {
        setSelectedHotel(data[0]);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <ChatBubbleLeftRightIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Customer Negotiations</h1>
          </div>
          <p className="text-purple-100">Respond to customer price negotiation requests in real-time</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hotel Selector */}
        {hotels.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Hotel
                </label>
                <select
                  value={selectedHotel?._id || ''}
                  onChange={(e) => {
                    const hotel = hotels.find(h => h._id === e.target.value);
                    setSelectedHotel(hotel);
                  }}
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                >
                  {hotels.map(hotel => (
                    <option key={hotel._id} value={hotel._id}>
                      {hotel.hotelName} - {hotel.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500">
                <BellAlertIcon className="h-5 w-5 inline mr-1" />
                New negotiation requests will appear here
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800">No hotels found. Please add a hotel first.</p>
            <button 
              onClick={() => navigate('/admin/hotels')}
              className="mt-2 text-yellow-600 font-semibold"
            >
              + Add Hotel
            </button>
          </div>
        )}

        {/* Negotiation Panel */}
        {selectedHotel && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-800">
                Active Negotiations for {selectedHotel.hotelName}
              </h2>
              <p className="text-xs text-gray-500">Real-time chat with customers</p>
            </div>
            <OwnerNegotiationPanel 
              hotelId={selectedHotel._id} 
              hotelName={selectedHotel.hotelName} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerNegotiations;