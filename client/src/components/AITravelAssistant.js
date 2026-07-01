import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  FaRobot, FaSpinner, FaTrophy, FaInfoCircle, FaMapMarkerAlt, 
  FaRupeeSign, FaStar, FaTimes, FaWifi, FaSwimmingPool, 
  FaUtensils, FaParking, FaDumbbell, FaCalendar, FaUser, 
  FaMicrophone, FaStop, FaVolumeUp, FaMoon, FaSun, FaCloudSun,
  FaPlane, FaTrain, FaTaxi, FaShoppingBag, FaRestaurant,
  FaHeart, FaShare, FaWhatsapp, FaTwitter, FaFacebook,
  FaBell, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaArrowLeft, FaArrowRight, FaFilter, FaSortAmountDown,
  FaGlobe, FaLanguage, FaSearch, FaHistory, FaTags, FaBed
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';  
import aiService from '../services/aiService';

const AITravelAssistant = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [sortBy, setSortBy] = useState('ai_score');
  const [filterPrice, setFilterPrice] = useState(null);
  const [filterRating, setFilterRating] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // Comprehensive global language support
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'Global' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'India' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', region: 'India' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', region: 'South Asia' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', region: 'India' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'India' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'India' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', region: 'India' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', region: 'India' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'India' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', region: 'India' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', region: 'South Asia' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'Europe' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'Europe' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Europe' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Europe' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'Europe' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'Europe' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: 'Asia' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: 'Asia' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', region: 'Asia' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'Middle East' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', region: 'Europe' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Europe' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'Europe' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'Europe' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'Asia' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', region: 'Asia' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Asia' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', region: 'Asia' }
  ];

  // Load saved data
  useEffect(() => {
    const savedSearches = localStorage.getItem('aiRecentSearches');
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
    
    const savedWishlist = localStorage.getItem('aiWishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) setSelectedLanguage(savedLanguage);
  }, []);

  // Voice recognition setup with language support
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      
      const langMap = {
        'hi': 'hi-IN', 'en': 'en-IN', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
        'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP', 'ko': 'ko-KR',
        'zh': 'zh-CN', 'ar': 'ar-SA', 'tr': 'tr-TR', 'nl': 'nl-NL', 'sv': 'sv-SE',
        'pl': 'pl-PL', 'vi': 'vi-VN', 'th': 'th-TH', 'id': 'id-ID', 'ms': 'ms-MY'
      };
      recognitionInstance.lang = langMap[selectedLanguage] || 'en-IN';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        setTimeout(() => handleSearch({ preventDefault: () => {} }), 100);
      };
      
      recognitionInstance.onerror = () => setIsListening(false);
      setRecognition(recognitionInstance);
    }
  }, [selectedLanguage]);

  const startVoiceSearch = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopVoiceSearch = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const addToWishlist = (hotel) => {
    if (!wishlist.find(w => w.id === hotel._id)) {
      const newWishlist = [...wishlist, { id: hotel._id, name: getHotelName(hotel), price: getHotelPrice(hotel), image: getHotelImage(hotel) }];
      setWishlist(newWishlist);
      localStorage.setItem('aiWishlist', JSON.stringify(newWishlist));
      showNotification(`✅ ${getHotelName(hotel)} added to wishlist!`, 'success');
    } else {
      showNotification(`ℹ️ ${getHotelName(hotel)} is already in your wishlist`, 'info');
    }
  };

  // Handle example click
  const handleExampleClick = (example) => {
    setQuery(example);
    setTimeout(() => {
      handleSearch({ preventDefault: () => {} });
    }, 100);
  };

  // Enhanced search with NLP
  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    
    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('aiRecentSearches', JSON.stringify(updated));
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://bookora-server-22ox.onrender.com/api/ai/travel-assistant', {
        query: query,
        language: selectedLanguage
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setResults(response.data);
      showNotification(`✨ Found ${response.data.total_matches} hotels matching your criteria!`, 'success');
    } catch (err) {
      console.error('AI search error:', err);
      setError(err.response?.data?.error || 'Failed to process your request');
      showNotification('❌ Search failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to hotel details
  const handleViewDetails = (hotel) => {
    if (hotel._id) {
      navigate(`/hotel/${hotel._id}`);
      setShowAssistant(false);
    } else if (hotel.id) {
      navigate(`/hotel/${hotel.id}`);
      setShowAssistant(false);
    } else {
      showNotification('Hotel details not available', 'error');
    }
  };

  // Share hotel
  const shareHotel = async (hotel) => {
    const shareData = {
      title: getHotelName(hotel),
      text: `Check out ${getHotelName(hotel)} at ${getHotelCity(hotel)}! Starting at ₹${getHotelPrice(hotel)}/night`,
      url: `${window.location.origin}/hotel/${hotel._id}`
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showNotification('✨ Shared successfully!', 'success');
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      showNotification('📋 Link copied to clipboard!', 'success');
    }
  };

  // Helper functions
  const getHotelName = (hotel) => hotel.name || hotel.hotelName || hotel.title || 'Unnamed Hotel';
  const getHotelPrice = (hotel) => hotel.pricePerNight || hotel.price || hotel.rate || 0;
  const getHotelCity = (hotel) => hotel.city || hotel.location || hotel.cityName || 'Unknown Location';
  const getHotelRating = (hotel) => hotel.rating || hotel.averageRating || hotel.stars || 0;
  const getHotelImage = (hotel) => hotel.images?.[0] || hotel.image || hotel.photo || null;
  const getHotelAmenities = (hotel) => hotel.amenities || hotel.facilities || [];

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <FaWifi className="text-blue-500" size={12} />;
    if (amenityLower.includes('pool')) return <FaSwimmingPool className="text-blue-400" size={12} />;
    if (amenityLower.includes('restaurant') || amenityLower.includes('dining')) return <FaUtensils className="text-orange-500" size={12} />;
    if (amenityLower.includes('parking')) return <FaParking className="text-gray-500" size={12} />;
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) return <FaDumbbell className="text-green-500" size={12} />;
    return <FaBed className="text-gray-400" size={12} />;
  };

  const filteredResults = results?.results?.filter(hotel => {
    if (filterPrice && getHotelPrice(hotel) > filterPrice) return false;
    if (filterRating && getHotelRating(hotel) < filterRating) return false;
    return true;
  }).sort((a, b) => {
    switch(sortBy) {
      case 'price_low': return getHotelPrice(a) - getHotelPrice(b);
      case 'price_high': return getHotelPrice(b) - getHotelPrice(a);
      case 'rating': return getHotelRating(b) - getHotelRating(a);
      default: return (b.ai_score || 0) - (a.ai_score || 0);
    }
  }) || [];

  const exampleQueries = [
    "Need romantic hotel in Goa under ₹5000 near beach",
    "Budget hotels in Mumbai under ₹3000 with pool",
    "Luxury business hotels in Bangalore with spa",
    "Family hotels in Delhi under ₹4000 with breakfast",
    "Pet friendly hotels in Pune",
    "5 star hotels in Jaipur for honeymoon",
    "Beach resorts in Bali under $100",
    "Luxury hotels in Paris with Eiffel Tower view"
  ];

  return (
    <>
      {/* Floating AI Assistant Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAssistant(!showAssistant)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 z-50 group"
      >
        <div className="relative">
          <FaRobot className="text-2xl group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </motion.button>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              notif.type === 'success' ? 'bg-green-500 text-white' :
              notif.type === 'error' ? 'bg-red-500 text-white' :
              notif.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {notif.type === 'success' && <FaCheckCircle />}
            {notif.type === 'error' && <FaExclamationTriangle />}
            <span className="text-sm">{notif.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className={`bg-white rounded-2xl max-w-5xl w-full ${isMinimized ? 'h-auto' : 'max-h-[90vh]'} overflow-hidden shadow-2xl transition-all duration-300`}>
              
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <FaRobot className="text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">AI Travel Assistant</h2>
                      <p className="text-purple-100 text-sm">Powered by Advanced AI • Supports 30+ Languages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Language Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                        className="bg-white/20 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:bg-white/30 transition"
                      >
                        <FaLanguage />
                        {languages.find(l => l.code === selectedLanguage)?.flag} {languages.find(l => l.code === selectedLanguage)?.name}
                      </button>
                      {showLanguageMenu && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                          <div className="sticky top-0 bg-white p-2 border-b">
                            <input
                              type="text"
                              placeholder="Search language..."
                              className="w-full px-3 py-1 border rounded-lg text-sm"
                              onChange={(e) => {
                                const search = e.target.value.toLowerCase();
                                document.querySelectorAll('.language-option').forEach(opt => {
                                  opt.style.display = opt.textContent.toLowerCase().includes(search) ? 'flex' : 'none';
                                });
                              }}
                            />
                          </div>
                          {languages.map(lang => (
                            <button
                              key={lang.code}
                              className={`language-option w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center gap-2 transition ${selectedLanguage === lang.code ? 'bg-purple-100 text-purple-700' : ''}`}
                              onClick={() => {
                                setSelectedLanguage(lang.code);
                                localStorage.setItem('preferredLanguage', lang.code);
                                setShowLanguageMenu(false);
                                showNotification(`Language changed to ${lang.name}`, 'success');
                              }}
                            >
                              <span className="text-lg">{lang.flag}</span>
                              <div>
                                <div className="text-sm font-medium">{lang.name}</div>
                                <div className="text-xs text-gray-500">{lang.nativeName}</div>
                              </div>
                              {selectedLanguage === lang.code && <FaCheckCircle className="ml-auto text-purple-600" size={14} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-2 rounded-lg transition">
                      {isMinimized ? '□' : '−'}
                    </button>
                    <button onClick={() => setShowAssistant(false)} className="hover:bg-white/20 p-2 rounded-lg transition">
                      <FaTimes />
                    </button>
                  </div>
                </div>
              </div>

              {!isMinimized && (
                <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
                  <div className="p-6">
                    {/* Search Input with Voice */}
                    <form onSubmit={handleSearch} className="mb-6">
                      <div className="relative">
                        <textarea
                          ref={searchInputRef}
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Describe your ideal stay in any language... e.g., 'Need a romantic beach hotel in Goa under ₹5000 with pool' | 'मुझे गोवा में ₹5000 से कम में रोमांटिक बीच होटल चाहिए'"
                          className="w-full p-4 pr-28 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button
                            type="button"
                            onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                            className={`p-2 rounded-lg transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            title="Voice Search"
                          >
                            {isListening ? <FaStop /> : <FaMicrophone />}
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            {isLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                            Search
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && !results && (
                      <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                          <FaHistory /> Recent Searches:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setQuery(search);
                                setTimeout(() => handleSearch({ preventDefault: () => {} }), 100);
                              }}
                              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Example Queries */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        <FaTags className="text-purple-500" /> Try these examples:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {exampleQueries.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => handleExampleClick(example)}
                            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filters and Sort */}
                    {results && results.results?.length > 0 && (
                      <div className="mb-6 bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                          <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-gray-700 font-medium"
                          >
                            <FaFilter /> Filters & Sort
                          </button>
                          <div className="flex items-center gap-2">
                            <FaSortAmountDown className="text-gray-500" />
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="bg-white border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="ai_score">AI Match Score</option>
                              <option value="price_low">Price: Low to High</option>
                              <option value="price_high">Price: High to Low</option>
                              <option value="rating">Rating</option>
                            </select>
                          </div>
                        </div>
                        
                        {showFilters && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t">
                            <div>
                              <label className="block text-sm font-medium mb-1">Max Price (₹)</label>
                              <input
                                type="range"
                                min="1000"
                                max="50000"
                                step="500"
                                value={filterPrice || 50000}
                                onChange={(e) => setFilterPrice(parseInt(e.target.value))}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>₹1000</span>
                                <span>₹{filterPrice || 50000}</span>
                                <span>₹50000</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Min Rating</label>
                              <div className="flex gap-2">
                                {[3, 4, 4.5].map(rating => (
                                  <button
                                    key={rating}
                                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                                    className={`px-3 py-1 rounded-lg text-sm transition ${
                                      filterRating === rating ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {rating}+ ⭐
                                  </button>
                                ))}
                                {filterRating && (
                                  <button
                                    onClick={() => setFilterRating(null)}
                                    className="text-red-500 text-sm"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                      </div>
                    )}

                    {/* Results */}
                    {results && (
                      <div className="space-y-6">
                        {/* Assistant Note */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                          <div className="flex items-start space-x-3">
                            <FaRobot className="text-purple-600 text-xl mt-1" />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">🤖 AI Assistant says:</p>
                              <p className="text-gray-700">{results.assistant_note}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                📊 Found {filteredResults.length} matches for your query
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Hotel Results */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Top Matches</h3>
                          {filteredResults.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p>No hotels match your filters.</p>
                              <button onClick={() => { setFilterPrice(null); setFilterRating(null); }} className="text-purple-600 mt-2">
                                Clear filters
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {filteredResults.map((hotel, index) => {
                                const hotelName = getHotelName(hotel);
                                const hotelPrice = getHotelPrice(hotel);
                                const hotelCity = getHotelCity(hotel);
                                const hotelRating = getHotelRating(hotel);
                                const hotelImage = getHotelImage(hotel);
                                const amenities = getHotelAmenities(hotel);
                                const inWishlist = wishlist.some(w => w.id === hotel._id);
                                
                                return (
                                  <motion.div
                                    key={hotel._id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border rounded-xl p-4 hover:shadow-xl transition-all duration-300 bg-white"
                                  >
                                    <div className="flex flex-col md:flex-row gap-4">
                                      {/* Rank Badge */}
                                      <div className="md:w-16 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                          #{index + 1}
                                        </div>
                                      </div>
                                      
                                      {/* Hotel Image */}
                                      <div className="md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative group">
                                        {hotelImage ? (
                                          <img 
                                            src={hotelImage} 
                                            alt={hotelName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                            🏨 No Image
                                          </div>
                                        )}
                                        <button
                                          onClick={() => addToWishlist(hotel)}
                                          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:scale-110 transition"
                                          title={inWishlist ? "In wishlist" : "Add to wishlist"}
                                        >
                                          <FaHeart className={inWishlist ? 'text-red-500' : 'text-gray-400'} />
                                        </button>
                                      </div>
                                      
                                      {/* Hotel Details */}
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start flex-wrap gap-2">
                                          <div>
                                            <h4 className="text-xl font-semibold text-gray-800">{hotelName}</h4>
                                            <p className="text-gray-600 flex items-center gap-1">
                                              <FaMapMarkerAlt className="text-red-500" size={12} />
                                              {hotelCity}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-2xl font-bold text-purple-600">
                                              {hotelPrice > 0 ? `₹${hotelPrice}` : 'Price on Request'}
                                            </div>
                                            <div className="text-sm text-gray-500">per night</div>
                                          </div>
                                        </div>
                                        
                                        {/* Rating and AI Score */}
                                        <div className="flex items-center space-x-4 mt-2 flex-wrap gap-2">
                                          {hotelRating > 0 && (
                                            <div className="flex items-center">
                                              <FaStar className="text-yellow-500 mr-1" />
                                              <span className="font-semibold">{hotelRating}</span>
                                              <span className="text-gray-500 ml-1">/5</span>
                                            </div>
                                          )}
                                          {hotel.ai_score && (
                                            <div className="bg-purple-100 px-3 py-1 rounded-full">
                                              <span className="text-purple-700 font-semibold">🤖 AI Match: {hotel.ai_score}%</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* AI Reasons */}
                                        {hotel.ai_reasons && hotel.ai_reasons.length > 0 && (
                                          <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                                            <p className="text-sm font-semibold text-blue-800 mb-2">✨ Why we recommend this:</p>
                                            <ul className="list-disc list-inside text-sm text-blue-700">
                                              {hotel.ai_reasons.map((reason, idx) => (
                                                <li key={idx}>{reason}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        
                                        {/* Amenities Preview */}
                                        {amenities && amenities.length > 0 && (
                                          <div className="flex flex-wrap gap-2 mt-3">
                                            {amenities.slice(0, 5).map((amenity, idx) => (
                                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                                {getAmenityIcon(amenity)}
                                                <span>{amenity}</span>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        
                                        <div className="mt-4 flex gap-3">
                                          <button 
                                            onClick={() => handleViewDetails(hotel)}
                                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                                          >
                                            View Details
                                          </button>
                                          <button
                                            onClick={() => shareHotel(hotel)}
                                            className="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                                            title="Share"
                                          >
                                            <FaShare />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Welcome Screen */}
                    {!results && !isLoading && !error && (
                      <div className="text-center py-12">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <FaRobot className="text-6xl text-purple-400 mx-auto mb-4" />
                        </motion.div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          Hi! I'm your AI Travel Assistant
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Describe your perfect stay in any language, and I'll find the best matches for you!
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                          <div className="bg-purple-50 p-4 rounded-lg text-left">
                            <p className="text-sm text-purple-800 font-semibold mb-2">💡 Tips for best results:</p>
                            <ul className="text-sm text-purple-700 space-y-1">
                              <li>• Mention your destination (city name)</li>
                              <li>• Specify your budget (e.g., "under ₹5000")</li>
                              <li>• Tell me your trip type (romantic, business, family)</li>
                              <li>• Add preferences (beach, mountain, city center)</li>
                              <li>• Works in 30+ languages</li>
                            </ul>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg text-left">
                            <p className="text-sm text-blue-800 font-semibold mb-2">🎤 Voice Search Available:</p>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• Click the microphone button</li>
                              <li>• Speak naturally in your language</li>
                              <li>• Supports 30+ languages</li>
                              <li>• Works with Indian English & Hindi</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                      <div className="text-center py-12">
                        <FaSpinner className="animate-spin text-5xl text-purple-600 mx-auto mb-4" />
                        <p className="text-gray-600">AI is analyzing your preferences...</p>
                        <p className="text-sm text-gray-500 mt-2">Searching across thousands of hotels worldwide</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AITravelAssistant;