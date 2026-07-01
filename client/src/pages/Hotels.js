import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  StarIcon, 
  MapPinIcon, 
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import VoiceSearch from '../components/VoiceSearch';
import WeatherWidget from '../components/WeatherWidget';
import PriceNegotiator from '../components/PriceNegotiator';

function Hotels() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const cityQuery = params.get("city") || "";

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(cityQuery);
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState("");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [carouselIndices, setCarouselIndices] = useState({});
  const [priceRange, setPriceRange] = useState(50000);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  
  const perPage = 6;

  // Load hotels
  useEffect(() => {
    fetch("https://bookora-server-22ox.onrender.com/api/hotels")
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);
        setTimeout(() => setLoading(false), 500);
      })
      .catch(err => {
        console.error("Error fetching hotels:", err);
        setLoading(false);
      });
  }, []);

  // Auto-scroll effect for hotel images
  useEffect(() => {
    if (hotels.length === 0) return;
    
    const interval = setInterval(() => {
      setCarouselIndices(prev => {
        const newIndices = { ...prev };
        hotels.forEach(hotel => {
          const images = hotel.images || [];
          if (images.length > 1) {
            const currentIndex = prev[hotel._id] || 0;
            newIndices[hotel._id] = (currentIndex + 1) % images.length;
          }
        });
        return newIndices;
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [hotels]);

  // Get unique price range
  const maxHotelPrice = Math.max(...hotels.map(h => Number(h.price) || 0), 50000);
  
  useEffect(() => {
    setPriceRange(maxHotelPrice);
  }, [hotels]);

  // Handle voice search results - FIXED: Proper type checking
 // Voice search handler - Enhanced to handle hotel names
const handleVoiceSearch = (searchData) => {
  if (!searchData) {
    showToast('Please try saying something like "Taj Hotel" or "Find hotels in Goa"', 'info');
    return;
  }
  
  setIsVoiceSearching(true);
  
  try {
    console.log('🎤 Voice search received:', searchData);
    
    const query = searchData.query || searchData;
    const searchType = searchData.type || 'general';
    const hotelName = searchData.hotelName || null;
    
    if (searchType === 'hotel_name' && hotelName) {
      // Searching for specific hotel by name
      showToast(`🏨 Searching for "${hotelName}" hotel...`);
      setCity(hotelName.toLowerCase().trim());
      
      // Also set a flag to show we're searching for a specific hotel
      sessionStorage.setItem('voiceSearchHotel', hotelName);
      
    } else if (searchType === 'city_search') {
      showToast(`📍 Searching for hotels in ${query}`);
      setCity(query);
      
    } else if (searchType === 'preference_search') {
      showToast(`🎯 Searching for ${query}`);
      setCity(query);
      
    } else if (searchType === 'filter_search') {
      showToast(`🔍 Filtering: ${query}`);
      // For filter-only searches, keep current city but show toast
      if (query) {
        // You can implement additional filter logic here
        showToast(`Applied filter: ${query}`);
      }
      
    } else {
      showToast(`🔍 Searching: "${query}"`);
      setCity(query);
    }
    
    // Reset to first page to show new results
    setPage(1);
    
  } catch (error) {
    console.error('Voice search error:', error);
    showToast('Could not process voice search. Please try again.', 'error');
  } finally {
    setIsVoiceSearching(false);
    
    // Clear the flag after 5 seconds
    setTimeout(() => {
      sessionStorage.removeItem('voiceSearchHotel');
    }, 5000);
  }
};

// Toast notification helper
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } animate-fade-in flex items-center gap-2`;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

  // Carousel handlers
  const handlePrevImage = (hotelId, images, currentIndex) => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCarouselIndices(prev => ({ ...prev, [hotelId]: newIndex }));
  };

  const handleNextImage = (hotelId, images, currentIndex) => {
    const newIndex = (currentIndex + 1) % images.length;
    setCarouselIndices(prev => ({ ...prev, [hotelId]: newIndex }));
  };

  // Filter and sort - FIXED: Added safety checks
  // =============================================
// SMART FILTER + VOICE SEARCH SUPPORT
// =============================================

let filtered = hotels.filter((hotel) => {

  // SAFE VALUES

  const hotelCity =
    hotel.city?.toLowerCase() || "";

  const hotelName =
    hotel.hotelName?.toLowerCase() || "";

  const searchText =
    typeof city === "string"
      ? city.toLowerCase().trim()
      : "";

  const hotelPrice =
    Number(hotel.price) || 0;

  const hotelRating =
    Number(hotel.rating) || 0;

  // =============================================
  // SMART SEARCH
  // SUPPORTS:
  // - CITY SEARCH
  // - HOTEL NAME SEARCH
  // - VOICE SEARCH
  // =============================================

  const matchSearch =
    searchText === "" ||
    hotelCity.includes(searchText) ||
    hotelName.includes(searchText);

  // PRICE FILTER

  const matchPrice =
    maxPrice === "" ||
    hotelPrice <= Number(maxPrice);

  // RATING FILTER

  const matchRating =
    minRating === "" ||
    hotelRating >= Number(minRating);

  return (
    matchSearch &&
    matchPrice &&
    matchRating
  );

});
  // Apply sorting
  if (sort === "low") filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  if (sort === "high") filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  if (sort === "rating") filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

  const totalPages = Math.ceil(filtered.length / perPage);
  const start = (page - 1) * perPage;
  const currentHotels = filtered.slice(start, start + perPage);

  useEffect(() => setPage(1), [city, maxPrice, minRating, sort]);

  const resetFilters = () => {
    setCity("");
    setMaxPrice("");
    setMinRating("");
    setSort("");
    setPriceRange(maxHotelPrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-64 mb-6"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Hero Banner with Voice Search */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-10 overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Find Your Perfect Stay
          </h1>
          <p className="text-gray-300 mt-2">Discover luxury hotels at the best prices</p>
          
          {/* Search Bar with Voice Search */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by city, hotel, or destination... or click the microphone 🎤"
                value={typeof city === 'string' ? city : ''}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-5 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <VoiceSearch 
                  onSearchResult={handleVoiceSearch}
                  autoNavigate={false}
                />
              </div>
            </div>
            {isVoiceSearching && (
              <p className="text-xs text-yellow-400 mt-2 animate-pulse">
                🎤 Processing your voice search...
              </p>
            )}
            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Filter Toggle Button - Mobile */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 bg-white py-3 rounded-xl shadow-sm font-semibold"
          >
            <FunnelIcon className="h-5 w-5" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Filters Sidebar */}
          <div className={`lg:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-lg p-5 sticky top-24">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-yellow-500" />
                  Filters
                </h2>
                <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                  <ArrowPathIcon className="h-4 w-4" />
                  Reset
                </button>
              </div>
              
              {/* City Filter */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2">📍 City</label>
                <input
                  type="text"
                  placeholder="Enter city name"
                  value={typeof city === 'string' ? city : ''}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              
              {/* Price Filter */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2">💰 Max Price per night</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={maxHotelPrice}
                    value={maxPrice || maxHotelPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <span className="font-semibold text-yellow-600 text-sm min-w-[70px]">
                    ₹{Number(maxPrice || maxHotelPrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₹0</span>
                  <span>₹{maxHotelPrice.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Rating Filter */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2">⭐ Minimum Rating</label>
                <div className="flex gap-2">
                  {[3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating.toString() ? "" : rating.toString())}
                      className={`flex-1 py-2 rounded-xl font-medium transition text-sm ${
                        minRating === rating.toString()
                          ? "bg-yellow-500 text-black"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sort Options */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2">📊 Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                >
                  <option value="">Recommended</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                  <option value="rating">Rating: High to Low</option>
                </select>
              </div>
              
              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setView("grid")}
                  className={`flex-1 py-2 rounded-xl font-medium transition text-sm ${
                    view === "grid" ? "bg-yellow-500 text-black" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`flex-1 py-2 rounded-xl font-medium transition text-sm ${
                    view === "list" ? "bg-yellow-500 text-black" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  List View
                </button>
              </div>
            </div>
          </div>
          
          {/* Hotel Listings */}
          <div className="flex-1">
            {city && typeof city === 'string' && city.trim().length > 2 && (
  <div className="mb-6">
    <WeatherWidget city={city} />
  </div>
)}
            
            {currentHotels.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                <div className="text-6xl mb-4">🏨</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Hotels Found</h2>
                <p className="text-gray-500">Try adjusting your filters to find more options</p>
                <button onClick={resetFilters} className="mt-4 text-yellow-600 font-semibold hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className={`${view === "grid" ? "grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-5"}`}>
                  {currentHotels.map((hotel) => {
                    const currentImageIndex = carouselIndices[hotel._id] || 0;
                    const hotelImages = hotel.images || [];
                    const displayImage = hotelImages.length > 0 ? hotelImages[currentImageIndex] : null;
                    
                    return view === "grid" ? (
                      // Grid View Card
                      <div key={hotel._id} className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="relative h-48 overflow-hidden bg-gray-900">
                          {displayImage ? (
                            <>
                              <img src={displayImage} alt={hotel.hotelName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              {hotelImages.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handlePrevImage(hotel._id, hotelImages, currentImageIndex);
                                    }}
                                    className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
                                  >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleNextImage(hotel._id, hotelImages, currentImageIndex);
                                    }}
                                    className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
                                  >
                                    <ChevronRightIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                                {hotelImages.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition ${
                                      currentImageIndex === idx ? "bg-yellow-500 w-3" : "bg-white/50"
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                              <HomeIcon className="h-12 w-12 text-gray-500" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <StarIcon className="h-3 w-3 text-yellow-400" />
                            {hotel.rating || 4}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{hotel.hotelName}</h3>
                          <p className="text-gray-500 text-xs mb-2 flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" />
                            {hotel.city}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-yellow-400 text-xs">
                              {"★".repeat(Math.floor(hotel.rating || 4))}
                              {"☆".repeat(5 - Math.floor(hotel.rating || 4))}
                            </div>
                            <span className="text-xs text-gray-500">({hotel.reviews?.length || 0})</span>
                          </div>
                          <p className="text-yellow-600 font-bold text-xl mb-3">₹{hotel.price}<span className="text-xs text-gray-400">/night</span></p>
                          
                          {/* AI Price Comparison */}
                          <div className="mb-3">
                            <PriceNegotiator hotelId={hotel._id} hotelPrice={hotel.price} isCompact={true} />
                          </div>
                          
                          <Link to={`/hotel/${hotel._id}`} className="block text-center bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 rounded-lg font-semibold text-sm hover:shadow-md transition-all duration-300">
                            View Details →
                          </Link>
                        </div>
                      </div>
                    ) : (
                      // List View Card
                      <div key={hotel._id} className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row">
                        <div className="relative md:w-56 h-48 md:h-auto overflow-hidden bg-gray-900">
                          {displayImage ? (
                            <img src={displayImage} alt={hotel.hotelName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                              <HomeIcon className="h-10 w-10 text-gray-500" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <StarIcon className="h-3 w-3 text-yellow-400" />
                            {hotel.rating || 4}
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">{hotel.hotelName}</h3>
                            <p className="text-yellow-600 font-bold text-xl">₹{hotel.price}<span className="text-xs text-gray-400">/night</span></p>
                          </div>
                          <p className="text-gray-500 text-xs mb-2 flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" />
                            {hotel.city}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-yellow-400 text-xs">
                              {"★".repeat(Math.floor(hotel.rating || 4))}
                              {"☆".repeat(5 - Math.floor(hotel.rating || 4))}
                            </div>
                            <span className="text-xs text-gray-500">({hotel.reviews?.length || 0} reviews)</span>
                          </div>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2">{hotel.description?.substring(0, 100)}...</p>
                          
                          {/* AI Price Comparison */}
                          <div className="mb-3">
                            <PriceNegotiator hotelId={hotel._id} hotelPrice={hotel.price} isCompact={true} />
                          </div>
                          
                          <Link to={`/hotel/${hotel._id}`} className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-5 py-2 rounded-lg font-semibold text-sm hover:shadow-md transition-all duration-300">
                            Book Now →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8 flex-wrap">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white rounded-xl shadow-sm disabled:opacity-50 hover:shadow-md transition text-sm"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <button
                          key={i}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-xl transition text-sm ${
                            page === pageNum
                              ? "bg-yellow-500 text-black font-semibold shadow-md"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white rounded-xl shadow-sm disabled:opacity-50 hover:shadow-md transition text-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hotels;