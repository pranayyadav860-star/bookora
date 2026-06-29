import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wishlist/my")
      .then(({ data }) => setWishlist(data))
      .catch(() => setWishlist([]))
      .finally(() => setLoading(false));
  }, []);

  const removeFromWishlist = async (hotelId) => {
    try {
      await api.delete(`/wishlist/remove/${hotelId}`);
      setWishlist(wishlist.filter(item => item.hotelId !== hotelId));
    } catch (err) {
      alert("Failed to remove from wishlist");
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        ❤️ My Wishlist
        <span className="text-base font-normal text-gray-400 ml-2">
          ({wishlist.length} hotels)
        </span>
      </h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏨</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-400 mb-6">
            Save hotels you love by clicking the heart icon
          </p>
          <Link to="/hotels"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Browse Hotels
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wishlist.map((item) => (
            <div key={item.hotelId}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">
                  {item.hotelName}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  📍 {item.city}
                </p>
                {item.price && (
                  <p className="text-blue-600 font-medium mt-1">
                    ₹{item.price.toLocaleString()} / night
                  </p>
                )}
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link to={`/hotel/${item.hotelId}`}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  View Hotel
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.hotelId)}
                  className="px-4 py-2 bg-red-50 text-red-500 text-sm rounded-lg hover:bg-red-100 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}