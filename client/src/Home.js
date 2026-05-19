// client/src/Home.js
// PREMIUM VERSION - Animated Coupons with Cursor Tracking

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
            


function Home() {
  const [hotels, setHotels] = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [slide, setSlide] = useState(0);
  const [searchCity, setSearchCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [showAllCities, setShowAllCities] = useState(false);
  const [cityHotelCounts, setCityHotelCounts] = useState({});
  const [sortedCities, setSortedCities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("loading");
  
  // Coupons States
  const [latestCoupons, setLatestCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  
  const navigate = useNavigate();

  // Load coupons
  useEffect(() => {
    const loadLatestCoupons = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/coupons/active");
        const data = await response.json();
        const latestFive = Array.isArray(data) ? data.slice(0, 5) : [];
        setLatestCoupons(latestFive);
      } catch (err) {
        console.error("Error loading coupons:", err);
        setLatestCoupons([]);
      } finally {
        setCouponsLoading(false);
      }
    };
    loadLatestCoupons();
  }, []);

  // Get today's date
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinCheckOutDate = () => {
    if (!checkIn) return getTodayDate();
    const checkInDate = new Date(checkIn);
    const nextDay = new Date(checkInDate);
    nextDay.setDate(checkInDate.getDate() + 1);
    const year = nextDay.getFullYear();
    const month = String(nextDay.getMonth() + 1).padStart(2, '0');
    const day = String(nextDay.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const cityCoordinates = {
    "Mumbai": { lat: 19.0760, lng: 72.8777 },
    "Delhi": { lat: 28.7041, lng: 77.1025 },
    "Bangalore": { lat: 12.9716, lng: 77.5946 },
    "Goa": { lat: 15.2993, lng: 74.1240 },
    "Jaipur": { lat: 26.9124, lng: 75.7873 },
    "Chennai": { lat: 13.0827, lng: 80.2707 },
    "Kolkata": { lat: 22.5726, lng: 88.3639 },
    "Hyderabad": { lat: 17.3850, lng: 78.4867 },
    "Udaipur": { lat: 24.5854, lng: 73.7125 },
    "Agra": { lat: 27.1767, lng: 78.0081 },
    "Varanasi": { lat: 25.3176, lng: 82.9739 },
    "Kerala": { lat: 10.8505, lng: 76.2711 },
    "Pune": { lat: 18.5204, lng: 73.8567 },
    "Ahmedabad": { lat: 23.0225, lng: 72.5714 }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const banners = [
    {
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      title: "Discover Luxury Hotels",
      subtitle: "Experience comfort like never before",
      offer: "Up to 40% OFF"
    },
    {
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
      title: "Premium Stays Await",
      subtitle: "Book your dream vacation today",
      offer: "Free Breakfast"
    },
    {
      image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461",
      title: "Unbeatable Deals",
      subtitle: "Save up to 40% on luxury suites",
      offer: "Limited Time"
    }
  ];

  const allCities = [
    { name: "Mumbai", image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7", tag: "The City of Dreams" },
    { name: "Delhi", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5", tag: "Heart of India" },
    { name: "Bangalore", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2", tag: "Silicon Valley" },
    { name: "Goa", image: "https://images.unsplash.com/photo-1512343879784-960f40e7b214", tag: "Beach Paradise" },
    { name: "Jaipur", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41", tag: "Pink City" },
    { name: "Chennai", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220", tag: "Gateway to South" },
    { name: "Kolkata", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3", tag: "City of Joy" },
    { name: "Hyderabad", image: "https://images.unsplash.com/photo-1612189958274-cbd7b4f64c5d", tag: "City of Pearls" },
    { name: "Udaipur", image: "https://images.unsplash.com/photo-1590856029826-d7bc4e9cc8e5", tag: "City of Lakes" },
    { name: "Agra", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523", tag: "Taj Mahal City" },
    { name: "Varanasi", image: "https://images.unsplash.com/photo-1561361058-c24ce7a2b6a0", tag: "Spiritual Capital" },
    { name: "Kerala", image: "https://images.unsplash.com/photo-1583267746897-2cf415887172", tag: "God's Own Country" },
    { name: "Pune", image: "https://images.unsplash.com/photo-1622644803108-e67b1dde2f01", tag: "Oxford of the East" },
    { name: "Ahmedabad", image: "https://images.unsplash.com/photo-1621944190310-e3cca1564b7f", tag: "Manchester of India" }
  ];

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus("granted");
        },
        (error) => {
          console.log("Location permission denied:", error.message);
          setLocationStatus("denied");
        }
      );
    } else {
      setLocationStatus("denied");
    }
  }, []);

  const getHotelDistance = (hotelCity) => {
    if (!userLocation || !cityCoordinates[hotelCity]) return null;
    const coords = cityCoordinates[hotelCity];
    return calculateDistance(
      userLocation.lat, userLocation.lng,
      coords.lat, coords.lng
    );
  };

  const getSortedHotelsByLocationAndRating = (hotelsList) => {
    if (!hotelsList || hotelsList.length === 0) return [];
    
    let hotelsWithDistance = hotelsList.map(hotel => ({
      ...hotel,
      distance: getHotelDistance(hotel.city) || Infinity
    }));
    
    hotelsWithDistance.sort((a, b) => a.distance - b.distance);
    
    const cityGroups = {};
    hotelsWithDistance.forEach(hotel => {
      if (!cityGroups[hotel.city]) {
        cityGroups[hotel.city] = [];
      }
      cityGroups[hotel.city].push(hotel);
    });
    
    Object.keys(cityGroups).forEach(city => {
      cityGroups[city].sort((a, b) => b.rating - a.rating);
    });
    
    const sortedHotels = [];
    for (const city of Object.keys(cityGroups)) {
      sortedHotels.push(...cityGroups[city]);
    }
    
    return sortedHotels;
  };

  // Copy coupon code with animation
  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  // Mouse move handler for coupon cards
  const handleMouseMove = (e, cardRef) => {
    if (!cardRef) return;
    const rect = cardRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    cardRef.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = (cardRef) => {
    if (cardRef) {
      cardRef.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const hotelsRes = await fetch("http://localhost:5000/api/hotels");
        const hotelsData = await hotelsRes.json();
        setHotels(hotelsData);
        
        const counts = {};
        hotelsData.forEach(hotel => {
          if (hotel.city) {
            counts[hotel.city] = (counts[hotel.city] || 0) + 1;
          }
        });
        setCityHotelCounts(counts);
        
        let sorted = [...allCities];
        if (userLocation && locationStatus === "granted") {
          sorted.sort((a, b) => {
            const coordsA = cityCoordinates[a.name];
            const coordsB = cityCoordinates[b.name];
            if (!coordsA || !coordsB) return 0;
            const distanceA = calculateDistance(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng);
            const distanceB = calculateDistance(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng);
            return distanceA - distanceB;
          });
        } else {
          sorted.sort((a, b) => {
            const countA = counts[a.name] || 0;
            const countB = counts[b.name] || 0;
            return countB - countA;
          });
        }
        setSortedCities(sorted);
        
        const sortedHotels = getSortedHotelsByLocationAndRating(hotelsData);
        setFeaturedHotels(sortedHotels);
        
        const allReviews = [];
        hotelsData.forEach(hotel => {
          if (hotel.reviews && hotel.reviews.length > 0) {
            hotel.reviews.forEach(review => {
              allReviews.push({
                ...review,
                hotelName: hotel.hotelName,
                hotelCity: hotel.city
              });
            });
          }
        });
        
        allReviews.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        if (allReviews.length > 0) {
          setReviews(allReviews.slice(0, 6));
        } else {
          setReviews([
            {
              name: "Rahul Sharma",
              rating: 5,
              comment: "Amazing booking experience! The hotel was exactly as described.",
              hotelName: "Luxury Palace"
            },
            {
              name: "Sneha Patel",
              rating: 5,
              comment: "Great prices and luxury rooms. The customer support was exceptional.",
              hotelName: "Grand Resort"
            },
            {
              name: "Arjun Mehta",
              rating: 5,
              comment: "Best hotel booking platform I've used. Beautiful UI and instant booking.",
              hotelName: "Beach Paradise"
            }
          ]);
        }
        
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (locationStatus !== "loading") {
      loadData();
    }
  }, [userLocation, locationStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleSearch = () => {
    let query = `/hotels?`;
    if (searchCity) query += `city=${encodeURIComponent(searchCity)}&`;
    if (checkIn) query += `checkIn=${checkIn}&`;
    if (checkOut) query += `checkOut=${checkOut}&`;
    if (guests) query += `guests=${guests}`;
    navigate(query);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCityClick = (cityName) => {
    navigate(`/hotels?city=${encodeURIComponent(cityName)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedCities = showAllCities ? sortedCities : sortedCities.slice(0, 6);
  const topFeaturedHotels = featuredHotels.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {locationStatus === "loading" ? "Detecting your location..." : "Loading amazing destinations..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      
      {/* HERO SECTION */}
      <div className="relative min-h-[800px] flex items-center">
        {banners.map((banner, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              slide === idx ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945";
              }}
            />
            <div className="absolute top-20 right-20 z-20 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold animate-bounce">
              {banner.offer}
            </div>
          </div>
        ))}

        <div className="relative z-20 w-full py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl text-white animate-fade-in">
              <span className="text-yellow-400 font-semibold tracking-wider uppercase">Welcome to Bookora</span>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mt-4">Discover Luxury Hotels & Premium Stays</h1>
              <p className="mt-5 text-xl text-gray-200">Best rooms. Best prices. Instant booking.</p>
            </div>

            <div className="mt-12 bg-white rounded-3xl shadow-2xl p-6 max-w-5xl transform hover:scale-105 transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input type="text" placeholder="📍 City (e.g., Mumbai, Delhi)" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className="md:col-span-2 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400" />
                <input type="date" value={checkIn} min={getTodayDate()} max={getMaxDate()} onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }} className="p-4 rounded-xl border border-gray-200" />
                <input type="date" value={checkOut} min={getMinCheckOutDate()} max={getMaxDate()} disabled={!checkIn} onChange={(e) => setCheckOut(e.target.value)} className={`p-4 rounded-xl border border-gray-200 ${!checkIn ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                <button onClick={handleSearch} className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold px-6 py-4 rounded-xl hover:shadow-lg transition-all hover:scale-105">🔍 Search Hotels</button>
              </div>
              {!checkIn && <p className="text-xs text-gray-500 mt-3">*Please select check-in date first</p>}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
          {banners.map((_, idx) => (
            <button key={idx} onClick={() => setSlide(idx)} className={`w-3 h-3 rounded-full transition-all ${slide === idx ? "bg-yellow-400 w-8" : "bg-white/50 hover:bg-yellow-400"}`} />
          ))}
        </div>
      </div>



      {/* CITIES GRID SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-yellow-500 font-semibold uppercase tracking-wider">Explore Destinations</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">{locationStatus === "granted" ? "Cities Near You" : "Popular Cities in India"}</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">{locationStatus === "granted" ? "Discover hotels in cities closest to your location" : "Discover the best hotels in India's most vibrant cities"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCities.map((cityItem, idx) => {
            const hotelCount = cityHotelCounts[cityItem.name] || 0;
            let distance = null;
            if (userLocation && cityCoordinates[cityItem.name]) {
              distance = calculateDistance(userLocation.lat, userLocation.lng, cityCoordinates[cityItem.name].lat, cityCoordinates[cityItem.name].lng);
            }
            return (
              <div
                key={idx}
                onClick={() => handleCityClick(cityItem.name)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={cityItem.image}
                    alt={cityItem.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold z-10">
                    🏨 {hotelCount} Hotel{hotelCount !== 1 ? 's' : ''}
                  </div>
                  
                  {distance !== null && distance < 100 && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10 animate-pulse">
                      📍 Near You • {Math.round(distance)} km
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold">{cityItem.name}</h3>
                  <p className="text-sm text-gray-200 mt-1">{cityItem.tag}</p>
                  {distance !== null && <p className="text-xs text-gray-300 mt-1">{Math.round(distance)} km away</p>}
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-sm bg-yellow-500 text-black px-3 py-1 rounded-full">
                      Explore {hotelCount} Hotels →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!showAllCities && sortedCities.length > 6 && (
          <div className="text-center mt-10">
            <button onClick={() => setShowAllCities(true)} className="border-2 border-yellow-500 text-yellow-600 px-8 py-3 rounded-full font-semibold hover:bg-yellow-500 hover:text-white transition-all">View All {sortedCities.length} Cities</button>
          </div>
        )}
        {showAllCities && (
          <div className="text-center mt-10">
            <button onClick={() => setShowAllCities(false)} className="text-yellow-600 hover:underline">Show Less ↑</button>
          </div>
        )}
      </div>

      {/* FEATURED HOTELS SECTION */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-yellow-500 font-semibold uppercase tracking-wider">Handpicked For You</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">{locationStatus === "granted" ? "Hotels Near You" : "Featured Hotels"}</h2>
            <p className="text-gray-500 mt-2">{locationStatus === "granted" ? "Discover top-rated hotels closest to your location" : "Our most popular luxury stays"}</p>
            {locationStatus === "granted" && userLocation && <p className="text-xs text-green-600 mt-1">✨ Showing hotels sorted by distance and rating</p>}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {topFeaturedHotels.map((hotel) => {
              const distance = getHotelDistance(hotel.city);
              return (
                <div key={hotel._id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1">
                  <div className="relative h-64 overflow-hidden">
                    <img src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"} alt={hotel.hotelName} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945"; }} />
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-lg text-sm font-semibold">⭐ {hotel.rating}</div>
                    {distance !== null && distance < 100 && <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold animate-pulse">📍 {Math.round(distance)} km away</div>}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{hotel.hotelName}</h3>
                    <p className="text-gray-500 text-sm mb-3">📍 {hotel.city}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex text-yellow-400">{"★".repeat(Math.floor(hotel.rating || 4))}{"☆".repeat(5 - Math.floor(hotel.rating || 4))}</div>
                      <span className="text-sm text-gray-500">({hotel.reviews?.length || 0} reviews)</span>
                    </div>
                    <p className="text-yellow-600 text-2xl font-bold">₹{hotel.price}<span className="text-sm text-gray-400 font-normal"> /night</span></p>
                    <Link to={`/hotel/${hotel._id}`} className="block text-center bg-gray-900 text-white py-3 rounded-xl mt-6 font-semibold hover:bg-yellow-500 hover:text-black transition-all">View Details →</Link>
                  </div>
                </div>
              );
            })}
          </div>

          {topFeaturedHotels.length === 0 && (
            <div className="text-center py-12"><p className="text-gray-500">No hotels found in your area</p></div>
          )}

          <div className="text-center mt-10">
            <Link to="/hotels" className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">View All Hotels →</Link>
          </div>
        </div>
      </div>
       

      {/* REVIEWS SECTION */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-yellow-500 font-semibold uppercase tracking-wider">Guest Reviews</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-2">What Our Guests Say</h2>
            <p className="text-gray-400 mt-4">Real reviews from real travelers</p>
          </div>
          
          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {reviews.slice(0, 3).map((review, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white hover:transform hover:scale-105 transition-all">
                  <div className="flex text-yellow-400 mb-4">
                    {"★".repeat(review.rating || 5)}
                    {"☆".repeat(5 - (review.rating || 5))}
                  </div>
                  <p className="leading-relaxed">"{review.comment}"</p>
                  <div className="mt-6">
                    <h4 className="font-bold text-lg">— {review.name}</h4>
                    <p className="text-gray-400 text-sm mt-1">Stayed at {review.hotelName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p className="text-white">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>

      {/* OFFER SECTION */}
      {/* PREMIUM ANIMATED COUPONS SECTION - 3D HOVER EFFECT */}
      {!couponsLoading && latestCoupons.length > 0 && (
        <div className="py-16 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-400 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full mb-4">
                <span className="text-yellow-600 text-sm font-semibold">✨ LIMITED TIME OFFERS ✨</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">🎁 Exclusive Coupons</h2>
              <p className="text-gray-600 mt-3 max-w-2xl mx-auto">Click any coupon to copy code & enjoy instant savings on your booking!</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {latestCoupons.map((coupon, idx) => {
                let cardRef = null;
                return (
                  <div
                    key={coupon._id || idx}
                    ref={(el) => cardRef = el}
                    onClick={() => copyCouponCode(coupon.code)}
                    onMouseMove={(e) => handleMouseMove(e, cardRef)}
                    onMouseLeave={() => handleMouseLeave(cardRef)}
                    className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-2xl cursor-pointer transition-all duration-300 overflow-hidden group"
                    style={{ 
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Animated Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Pulse Ring */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Glowing Badge */}
                      <div className="absolute -top-3 -right-3">
                        <div className={`${idx === 0 ? "bg-red-500 animate-pulse" : idx === 1 ? "bg-purple-500" : "bg-blue-500"} text-white text-xs px-2 py-1 rounded-full shadow-lg`}>
                          {idx === 0 ? "🔥 BEST DEAL" : idx === 1 ? "⭐ POPULAR" : `OFFER ${idx + 1}`}
                        </div>
                      </div>
                      
                      {/* Icon with Animation */}
                      <div className="text-5xl mb-4 text-center transform group-hover:scale-110 transition-transform duration-300">
                        {idx === 0 ? "🏆" : idx === 1 ? "🎉" : idx === 2 ? "💎" : idx === 3 ? "✨" : "🎁"}
                      </div>
                      
                      {/* Coupon Code with Glow */}
                      <div className="text-center">
                        <div className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-xl mb-3 shadow-inner">
                          <p className="font-mono font-bold text-gray-800 text-lg tracking-wider">
                            {coupon.code}
                          </p>
                        </div>
                      </div>
                      
                      {/* Discount Value */}
                      <p className="text-center">
                        <span className="text-3xl font-bold text-green-600">
                          {coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </span>
                      </p>
                      
                      {/* Description */}
                      {coupon.description && (
                        <p className="text-xs text-gray-500 text-center mt-2 line-clamp-2">{coupon.description}</p>
                      )}
                      
                      {/* Min Booking Amount */}
                      {coupon.minBookingAmount > 0 && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                          🛒 Min. Booking ₹{coupon.minBookingAmount}
                        </p>
                      )}
                      
                      {/* Valid Till */}
                      {coupon.validTill && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                          ⏰ Valid till: {new Date(coupon.validTill).toLocaleDateString()}
                        </p>
                      )}
                      
                      {/* Copy Button with Animation */}
                      <div className="mt-5">
                        {copiedCoupon === coupon.code ? (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-xl text-center font-semibold text-sm animate-pulse shadow-lg">
                            ✅ Copied! Apply at Checkout
                          </div>
                        ) : (
                          <div className="group/btn relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2.5 rounded-xl text-center font-semibold text-sm transition-all duration-300 hover:shadow-xl">
                            <span className="relative z-10">🎯 Click to Copy Code</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 transform translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Sparkle Effects on Hover */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping" style={{ animationDelay: '0s' }}></div>
                      <div className="absolute top-1/3 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping" style={{ animationDelay: '0.3s' }}></div>
                      <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-orange-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping" style={{ animationDelay: '0.6s' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Floating Animation Text */}
            
          </div>
        </div>
      )}

      {/* WHY CHOOSE US SECTION */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-yellow-500 font-semibold uppercase tracking-wider">Why Book with Us</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">The Bookora Advantage</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group"><div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-500 transition-all"><span className="text-3xl">💰</span></div><h3 className="text-xl font-bold">Best Price Guarantee</h3><p className="text-gray-500 mt-2">We ensure you get the best deals</p></div>
            <div className="text-center group"><div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-500 transition-all"><span className="text-3xl">🏨</span></div><h3 className="text-xl font-bold">500+ Hotels</h3><p className="text-gray-500 mt-2">Wide selection of premium stays</p></div>
            <div className="text-center group"><div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-500 transition-all"><span className="text-3xl">⭐</span></div><h3 className="text-xl font-bold">Verified Reviews</h3><p className="text-gray-500 mt-2">Real guest experiences</p></div>
            <div className="text-center group"><div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-500 transition-all"><span className="text-3xl">🎧</span></div><h3 className="text-xl font-bold">24/7 Support</h3><p className="text-gray-500 mt-2">We're here to help anytime</p></div>
          </div>
        </div>
      </div>
      

      {/* FOOTER */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div><h3 className="text-2xl font-bold text-yellow-500">BOOKORA</h3><p className="text-gray-400 mt-3">Luxury hotel booking made easy. Best prices, premium stays.</p><div className="flex gap-4 mt-4"><span className="text-2xl cursor-pointer hover:text-yellow-500">📘</span><span className="text-2xl cursor-pointer hover:text-yellow-500">📷</span><span className="text-2xl cursor-pointer hover:text-yellow-500">🐦</span></div></div>
            <div><h4 className="font-bold text-lg mb-4">Quick Links</h4><ul className="space-y-2 text-gray-400"><li><Link to="/" className="hover:text-yellow-500">Home</Link></li><li><Link to="/hotels" className="hover:text-yellow-500">Hotels</Link></li><li><Link to="/about" className="hover:text-yellow-500">About Us</Link></li><li><Link to="/contact" className="hover:text-yellow-500">Contact</Link></li></ul></div>
            <div><h4 className="font-bold text-lg mb-4">Support</h4><ul className="space-y-2 text-gray-400"><li><Link to="/faq" className="hover:text-yellow-500">FAQ</Link></li><li><Link to="/privacy" className="hover:text-yellow-500">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-yellow-500">Terms of Service</Link></li><li><Link to="/cancellation" className="hover:text-yellow-500">Cancellation Policy</Link></li></ul></div>
            <div><h4 className="font-bold text-lg mb-4">Contact Us</h4><ul className="space-y-2 text-gray-400"><li>📞 +91 93468 26589</li><li>✉️ support@bookora.com</li><li>📍 India</li></ul></div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500"><p>&copy; 2025 Bookora. All rights reserved. Luxury hotel booking platform.</p></div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }
          .delay-700 {
            animation-delay: 0.7s;
          }
        `}
      </style>
    </div>
  );
}

export default Home;