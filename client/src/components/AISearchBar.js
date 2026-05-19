import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaRobot, FaSearch, FaSpinner, FaStar, FaMapMarkerAlt, 
  FaRupeeSign, FaTimes, FaFilter, FaSortAmountDown, 
  FaClock, FaBed, FaWifi, FaSwimmingPool, FaUtensils,
  FaParking, FaDumbbell, FaCalendar, FaUsers, FaTags,
  FaMicrophone, FaStop, FaVolumeUp, FaHeart, FaShare,
  FaChevronDown, FaChevronUp, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import aiService from '../services/aiService';
import VoiceSearch from './VoiceSearch';

const AISearchBar = ({ onSearchResults, initialQuery = '', autoSearch = false }) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: null,
    minRating: null,
    sortBy: 'relevance',
    amenities: []
  });
  const [expandedHotel, setExpandedHotel] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Available amenities for filtering
  const availableAmenities = [
    { id: 'wifi', name: 'Free WiFi', icon: <FaWifi /> },
    { id: 'pool', name: 'Swimming Pool', icon: <FaSwimmingPool /> },
    { id: 'restaurant', name: 'Restaurant', icon: <FaUtensils /> },
    { id: 'parking', name: 'Free Parking', icon: <FaParking /> },
    { id: 'gym', name: 'Fitness Center', icon: <FaDumbbell /> },
    { id: 'spa', name: 'Spa', icon: <FaInfoCircle /> }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aiRecentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
    
    const savedWishlist = localStorage.getItem('aiWishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    
    if (initialQuery && autoSearch) {
      handleSearch(initialQuery);
    }
  }, []);

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save recent search
  const saveRecentSearch = (searchQuery) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('aiRecentSearches', JSON.stringify(updated));
  };

  // Parse natural language query intelligently
  const parseQueryIntelligently = (queryText) => {
    const lowerQuery = queryText.toLowerCase();
    const parsed = {
      cities: [],
      budget: null,
      budgetMin: null,
      preferences: [],
      guests: null,
      nights: null,
      stars: null,
      amenities: [],
      dates: null,
      isUrgent: false,
      wantsRecommendation: false
    };
    
    // 100+ cities database
    const citiesDB = {
      'goa': 'Goa', 'mumbai': 'Mumbai', 'delhi': 'Delhi', 'bangalore': 'Bangalore',
      'hyderabad': 'Hyderabad', 'chennai': 'Chennai', 'kolkata': 'Kolkata', 'jaipur': 'Jaipur',
      'agra': 'Agra', 'pune': 'Pune', 'kochi': 'Kochi', 'udaipur': 'Udaipur',
      'manali': 'Manali', 'shimla': 'Shimla', 'darjeeling': 'Darjeeling', 'ooty': 'Ooty',
      'munnar': 'Munnar', 'varanasi': 'Varanasi', 'amritsar': 'Amritsar', 'chandigarh': 'Chandigarh',
      'nagpur': 'Nagpur', 'lucknow': 'Lucknow', 'bhopal': 'Bhopal', 'indore': 'Indore',
      'surat': 'Surat', 'vadodara': 'Vadodara', 'ahmedabad': 'Ahmedabad', 'rajkot': 'Rajkot',
      'nashik': 'Nashik', 'aurangabad': 'Aurangabad', 'kolhapur': 'Kolhapur', 'solapur': 'Solapur',
      'mangalore': 'Mangalore', 'mysore': 'Mysore', 'hubli': 'Hubli', 'belgaum': 'Belgaum',
      'vijayawada': 'Vijayawada', 'visakhapatnam': 'Visakhapatnam', 'guntur': 'Guntur',
      'coimbatore': 'Coimbatore', 'madurai': 'Madurai', 'tiruchirappalli': 'Tiruchirappalli',
      'salem': 'Salem', 'tirunelveli': 'Tirunelveli', 'thrissur': 'Thrissur', 'kollam': 'Kollam',
      'kottayam': 'Kottayam', 'bhubaneswar': 'Bhubaneswar', 'cuttack': 'Cuttack', 'ranchi': 'Ranchi',
      'jamshedpur': 'Jamshedpur', 'dhanbad': 'Dhanbad', 'patna': 'Patna', 'gaya': 'Gaya',
      'guwahati': 'Guwahati', 'silchar': 'Silchar', 'dibrugarh': 'Dibrugarh', 'shillong': 'Shillong',
      // International cities
      'new york': 'New York', 'los angeles': 'Los Angeles', 'chicago': 'Chicago', 'miami': 'Miami',
      'london': 'London', 'paris': 'Paris', 'berlin': 'Berlin', 'rome': 'Rome', 'venice': 'Venice',
      'barcelona': 'Barcelona', 'madrid': 'Madrid', 'amsterdam': 'Amsterdam', 'vienna': 'Vienna',
      'prague': 'Prague', 'budapest': 'Budapest', 'istanbul': 'Istanbul', 'dubai': 'Dubai',
      'tokyo': 'Tokyo', 'osaka': 'Osaka', 'kyoto': 'Kyoto', 'seoul': 'Seoul', 'bangkok': 'Bangkok',
      'phuket': 'Phuket', 'singapore': 'Singapore', 'kuala lumpur': 'Kuala Lumpur', 'bali': 'Bali',
      'sydney': 'Sydney', 'melbourne': 'Melbourne', 'auckland': 'Auckland', 'cape town': 'Cape Town'
    };
    
    for (const [key, city] of Object.entries(citiesDB)) {
      if (lowerQuery.includes(key)) {
        parsed.cities.push(city);
      }
    }
    
    // Extract budget
    const budgetPatterns = [
      /(?:under|below|less than|within|max|upto|up to|budget of)\s*₹?\s*(\d+(?:,\d+)?)/i,
      /(\d+(?:,\d+)?)\s*(?:rupees|rs|inr)/i,
      /₹\s*(\d+(?:,\d+)?)/i
    ];
    
    for (const pattern of budgetPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        parsed.budget = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }
    
    // Extract budget range (e.g., "between 3000 and 5000")
    const rangeMatch = lowerQuery.match(/(?:between|from)\s*(\d+)\s*(?:to|and)\s*(\d+)/i);
    if (rangeMatch) {
      parsed.budgetMin = parseInt(rangeMatch[1]);
      parsed.budget = parseInt(rangeMatch[2]);
    }
    
    // Extract guests
    const guestsMatch = lowerQuery.match(/(\d+)\s*(?:person|people|guest|adult|pax)/i);
    if (guestsMatch) {
      parsed.guests = parseInt(guestsMatch[1]);
    }
    
    // Extract nights
    const nightsMatch = lowerQuery.match(/(\d+)\s*(?:night|days?)/i);
    if (nightsMatch) {
      parsed.nights = parseInt(nightsMatch[1]);
    }
    
    // Extract star rating
    const starsMatch = lowerQuery.match(/(\d+)\s*star/i);
    if (starsMatch) {
      parsed.stars = parseInt(starsMatch[1]);
    }
    
    // Extract preferences
    const preferenceMap = {
      'romantic': ['romantic', 'honeymoon', 'couple', 'anniversary', 'love', 'valentine'],
      'beach': ['beach', 'sea', 'ocean', 'coastal', 'shore', 'seaside', 'beachfront'],
      'business': ['business', 'corporate', 'conference', 'meeting', 'work', 'office'],
      'family': ['family', 'kids', 'children', 'child friendly', 'family friendly'],
      'luxury': ['luxury', 'premium', '5 star', 'five star', 'deluxe', 'lavish'],
      'budget': ['budget', 'cheap', 'affordable', 'economical', 'inexpensive', 'value'],
      'adventure': ['adventure', 'trek', 'hiking', 'rafting', 'camping', 'outdoor'],
      'spa': ['spa', 'wellness', 'massage', 'sauna', 'jacuzzi', 'steam'],
      'wifi': ['wifi', 'internet', 'broadband', 'high speed internet'],
      'breakfast': ['breakfast', 'buffet', 'complimentary breakfast', 'free breakfast'],
      'pet': ['pet friendly', 'dogs allowed', 'pets allowed', 'bring pet']
    };
    
    for (const [pref, keywords] of Object.entries(preferenceMap)) {
      if (keywords.some(kw => lowerQuery.includes(kw))) {
        parsed.preferences.push(pref);
      }
    }
    
    // Extract amenities
    for (const amenity of availableAmenities) {
      if (lowerQuery.includes(amenity.name.toLowerCase())) {
        parsed.amenities.push(amenity.id);
      }
    }
    
    // Detect urgency
    parsed.isUrgent = /(?:tonight|today|now|asap|immediate|urgent)/i.test(lowerQuery);
    parsed.wantsRecommendation = /(?:recommend|suggest|best|top|good|nice)/i.test(lowerQuery);
    
    return parsed;
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setShowResults(true);
    
    // Parse query intelligently
    const parsedQuery = parseQueryIntelligently(searchQuery);
    console.log('Parsed Query:', parsedQuery);
    
    saveRecentSearch(searchQuery);
    
    try {
      const data = await aiService.aiSearch(searchQuery);
      if (data?.success) {
        // Apply filters based on parsed query
        let filteredResults = data.results || [];
        
        // Apply budget filter
        if (parsedQuery.budget) {
          filteredResults = filteredResults.filter(h => (h.pricePerNight || h.price) <= parsedQuery.budget);
        }
        
        // Apply star rating filter
        if (parsedQuery.stars) {
          filteredResults = filteredResults.filter(h => (h.rating || 0) >= parsedQuery.stars);
        }
        
        // Apply preferences filter
        if (parsedQuery.preferences.length > 0) {
          filteredResults = filteredResults.filter(hotel => {
            const amenities = (hotel.amenities || []).map(a => a.toLowerCase());
            return parsedQuery.preferences.some(pref => 
              amenities.some(a => a.includes(pref))
            );
          });
        }
        
        setResults({
          ...data,
          results: filteredResults,
          total: filteredResults.length,
          parsed_query: parsedQuery
        });
        
        if (onSearchResults) onSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('AI search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = (voiceQuery) => {
    setQuery(voiceQuery);
    handleSearch(voiceQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
  };

  const applyFilters = () => {
    if (!results?.results) return;
    
    let filtered = [...results.results];
    
    if (filters.maxPrice) {
      filtered = filtered.filter(h => (h.pricePerNight || h.price) <= filters.maxPrice);
    }
    
    if (filters.minRating) {
      filtered = filtered.filter(h => (h.rating || 0) >= filters.minRating);
    }
    
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(hotel => {
        const hotelAmenities = (hotel.amenities || []).map(a => a.toLowerCase());
        return filters.amenities.some(a => 
          hotelAmenities.some(ha => ha.includes(a))
        );
      });
    }
    
    // Apply sorting
    switch(filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => (a.pricePerNight || a.price) - (b.pricePerNight || b.price));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.pricePerNight || b.price) - (a.pricePerNight || a.price));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    
    setResults({ ...results, results: filtered, total: filtered.length });
  };

  const toggleWishlist = (hotelId) => {
    if (wishlist.includes(hotelId)) {
      setWishlist(wishlist.filter(id => id !== hotelId));
    } else {
      setWishlist([...wishlist, hotelId]);
    }
    localStorage.setItem('aiWishlist', JSON.stringify(wishlist));
  };

  const viewHotelDetails = (hotelId) => {
    navigate(`/hotel/${hotelId}`);
    setShowResults(false);
  };

  const exampleSearches = [
    "Romantic beach hotel in Goa under 5000",
    "Business hotels in Mumbai near airport",
    "Family resorts in Jaipur with pool",
    "Budget stays in Bangalore",
    "5 star luxury hotel in Delhi with spa",
    "Pet friendly hotels in Pune",
    "Honeymoon resorts in Udaipur",
    "Beachfront villas in Goa for couple"
  ];

  const getIntentMessage = (parsedQuery) => {
    if (!parsedQuery) return null;
    
    const parts = [];
    if (parsedQuery.cities.length > 0) parts.push(`in ${parsedQuery.cities[0]}`);
    if (parsedQuery.budget) parts.push(`under ₹${parsedQuery.budget}`);
    if (parsedQuery.preferences.length > 0) parts.push(`for ${parsedQuery.preferences.join(' & ')} travel`);
    if (parsedQuery.guests) parts.push(`for ${parsedQuery.guests} guests`);
    
    if (parts.length > 0) {
      return `I understand you're looking for hotels ${parts.join(' ')}.`;
    }
    return null;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-4xl mx-auto">
      {/* Search Input Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center p-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Describe your ideal hotel... (e.g., 'Romantic beach hotel in Goa under 5000 with pool')"
              className="w-full px-4 py-3 pr-10 text-gray-700 placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 px-2 border-l">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition ${showFilters ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Filters"
            >
              <FaFilter />
            </button>
            <VoiceSearch onSearchResult={handleVoiceSearch} />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              Search
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t bg-gray-50 p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="500"
                    value={filters.maxPrice || 50000}
                    onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₹1000</span>
                    <span>₹{filters.maxPrice || 50000}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFilters({ ...filters, minRating: filters.minRating === rating ? null : rating })}
                        className={`px-3 py-1 rounded-lg text-sm transition ${
                          filters.minRating === rating ? 'bg-purple-600 text-white' : 'bg-white border text-gray-700'
                        }`}
                      >
                        {rating}+ ⭐
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                  <div className="flex flex-wrap gap-1">
                    {availableAmenities.map(amenity => (
                      <button
                        key={amenity.id}
                        onClick={() => {
                          const newAmenities = filters.amenities.includes(amenity.id)
                            ? filters.amenities.filter(a => a !== amenity.id)
                            : [...filters.amenities, amenity.id];
                          setFilters({ ...filters, amenities: newAmenities });
                        }}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          filters.amenities.includes(amenity.id) ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600'
                        }`}
                        title={amenity.name}
                      >
                        {amenity.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                <button
                  onClick={() => setFilters({ maxPrice: null, minRating: null, sortBy: 'relevance', amenities: [] })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Example Searches */}
      <div className="flex flex-wrap gap-2 mt-3">
        {exampleSearches.map((example, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(example);
              handleSearch(example);
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition text-gray-600"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border max-h-[500px] overflow-y-auto z-50"
          >
            {loading ? (
              <div className="p-12 text-center">
                <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">AI is searching for the best matches...</p>
                <p className="text-sm text-gray-400 mt-1">Analyzing thousands of hotels</p>
              </div>
            ) : results?.results?.length > 0 ? (
              <div>
                {/* AI Suggestion Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b sticky top-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <FaRobot className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      {results.parsed_query && getIntentMessage(results.parsed_query) && (
                        <p className="text-sm font-medium text-purple-800">{getIntentMessage(results.parsed_query)}</p>
                      )}
                      <p className="text-sm text-gray-700">{results.ai_suggestion}</p>
                      {results.parsed_query?.isUrgent && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 inline-flex px-2 py-1 rounded">
                          <FaClock /> Urgent booking detected - Today/Night availability
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Search Summary */}
                {results.search_summary && (
                  <div className="bg-blue-50 px-4 py-2 text-xs text-blue-700 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaTags />
                      <span>{results.search_summary.location} • {results.search_summary.budget} • {results.search_summary.preferences}</span>
                    </div>
                    <span className="text-gray-500">{results.total} hotels found</span>
                  </div>
                )}
                
                {/* Hotel Results */}
                {results.results.map((hotel, idx) => {
                  const hotelId = hotel._id || hotel.id;
                  const isExpanded = expandedHotel === hotelId;
                  const isInWishlist = wishlist.includes(hotelId);
                  const hotelPrice = hotel.pricePerNight || hotel.price;
                  const hotelRating = hotel.rating || hotel.averageRating;
                  const hotelAmenities = hotel.amenities || hotel.facilities || [];
                  
                  return (
                    <div
                      key={hotelId}
                      className="p-4 border-b hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex gap-4">
                        {/* Hotel Image */}
                        <div 
                          className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative group"
                          onClick={() => viewHotelDetails(hotelId)}
                        >
                          {hotel.images?.[0] ? (
                            <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-gray-100 to-gray-200">
                              🏨
                            </div>
                          )}
                        </div>
                        
                        {/* Hotel Info */}
                        <div className="flex-1" onClick={() => viewHotelDetails(hotelId)}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">{hotel.name || hotel.hotelName}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <FaMapMarkerAlt size={10} className="text-red-500" />
                                {hotel.city || hotel.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-purple-600">₹{hotelPrice}</div>
                              <div className="text-xs text-gray-500">per night</div>
                            </div>
                          </div>
                          
                          {/* Rating and AI Score */}
                          <div className="flex items-center gap-3 mt-1">
                            {hotelRating > 0 && (
                              <div className="flex items-center">
                                <FaStar className="text-yellow-500 mr-1" size={12} />
                                <span className="text-sm font-semibold">{hotelRating}</span>
                                <span className="text-xs text-gray-500 ml-1">/5</span>
                              </div>
                            )}
                            {hotel.ai_score && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                AI Match: {hotel.ai_score}%
                              </span>
                            )}
                            {hotel.parsed_query?.preferences?.slice(0, 2).map((pref, i) => (
                              <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {pref}
                              </span>
                            ))}
                          </div>
                          
                          {/* AI Reason */}
                          {hotel.ai_reasons && hotel.ai_reasons[0] && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{hotel.ai_reasons[0]}</p>
                          )}
                          
                          {/* Amenities Preview */}
                          {hotelAmenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {hotelAmenities.slice(0, 4).map((amenity, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleWishlist(hotelId)}
                            className={`p-2 rounded-lg transition ${isInWishlist ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'}`}
                            title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            <FaHeart />
                          </button>
                          <button
                            onClick={() => setExpandedHotel(isExpanded ? null : hotelId)}
                            className="text-gray-400 hover:text-purple-600"
                          >
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pt-3 border-t"
                          >
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <FaCalendar className="text-gray-400" />
                                <span>Check-in: Flexible</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaUsers className="text-gray-400" />
                                <span>Up to {hotel.maxGuests || 4} guests</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaBed className="text-gray-400" />
                                <span>Free cancellation available</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaCheckCircle className="text-green-500" />
                                <span>Instant confirmation</span>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => viewHotelDetails(hotelId)}
                                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition"
                              >
                                View Details
                              </button>
                              <button
                                className="flex-1 border border-purple-600 text-purple-600 py-2 rounded-lg font-medium hover:bg-purple-50 transition"
                              >
                                Book Now
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                
                {/* Footer */}
                <div className="p-3 text-center text-xs text-gray-500 bg-gray-50">
                  <p>Found {results.total} hotels • AI-powered smart search</p>
                  <p className="text-gray-400 mt-1">Try being more specific for better results</p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-600 font-medium">No hotels found matching your criteria.</p>
                <p className="text-sm text-gray-400 mt-2">Try adjusting your search or try these tips:</p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1">
                  <li>• Be more specific about location (e.g., "North Goa" instead of "Goa")</li>
                  <li>• Increase your budget range</li>
                  <li>• Remove some preferences or filters</li>
                  <li>• Try different keywords</li>
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISearchBar;