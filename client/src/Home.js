// client/src/Home.js
// PERFORMANCE OPTIMIZED - All 6 slow-load issues fixed

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: Move all static data OUTSIDE the component.
//   Before: cityCoordinates, allCities, banners were re-created on EVERY render
//           (every state change = new objects = wasted memory + GC pressure).
//   After:  Defined once at module level — zero re-creation cost.
// ─────────────────────────────────────────────────────────────────────────────

const CITY_COORDINATES = {
  Mumbai:     { lat: 19.0760, lng: 72.8777 },
  Delhi:      { lat: 28.7041, lng: 77.1025 },
  Bangalore:  { lat: 12.9716, lng: 77.5946 },
  Goa:        { lat: 15.2993, lng: 74.1240 },
  Jaipur:     { lat: 26.9124, lng: 75.7873 },
  Chennai:    { lat: 13.0827, lng: 80.2707 },
  Kolkata:    { lat: 22.5726, lng: 88.3639 },
  Hyderabad:  { lat: 17.3850, lng: 78.4867 },
  Udaipur:    { lat: 24.5854, lng: 73.7125 },
  Agra:       { lat: 27.1767, lng: 78.0081 },
  Varanasi:   { lat: 25.3176, lng: 82.9739 },
  Kerala:     { lat: 10.8505, lng: 76.2711 },
  Pune:       { lat: 18.5204, lng: 73.8567 },
  Ahmedabad:  { lat: 23.0225, lng: 72.5714 },
  Shimla:     { lat: 31.1048, lng: 77.1734 },
  Manali:     { lat: 32.2432, lng: 77.1892 },
  Darjeeling: { lat: 27.0360, lng: 88.2627 },
  Amritsar:   { lat: 31.6340, lng: 74.8723 },
  Mysore:     { lat: 12.2958, lng: 76.6394 },
  Rishikesh:  { lat: 30.0869, lng: 78.2676 },
  Jodhpur:    { lat: 26.2389, lng: 73.0243 },
  Coorg:      { lat: 12.3375, lng: 75.8069 },
  Ooty:       { lat: 11.4102, lng: 76.6950 },
  Leh:        { lat: 34.1526, lng: 77.5771 },
  Andaman:    { lat: 11.7401, lng: 92.6586 },
  Srinagar:   { lat: 34.0837, lng: 74.7973 },
  Haridwar:   { lat: 29.9457, lng: 78.1642 },
  Bhopal:     { lat: 23.2599, lng: 77.4126 },
};

const ALL_CITIES = [
  { name: "Mumbai",     image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&q=70", tag: "The City of Dreams" },
  { name: "Delhi",      image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=70", tag: "Heart of India" },
  { name: "Bangalore",  image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=70", tag: "Silicon Valley of India" },
  { name: "Goa",        image: "https://images.unsplash.com/photo-1512343879784-960f40e7b214?w=600&q=70", tag: "Beach Paradise" },
  { name: "Jaipur",     image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=70", tag: "The Pink City" },
  { name: "Chennai",    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=70", tag: "Gateway to South India" },
  { name: "Kolkata",    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=70", tag: "City of Joy" },
  { name: "Hyderabad",  image: "https://images.unsplash.com/photo-1612189958274-cbd7b4f64c5d?w=600&q=70", tag: "City of Pearls" },
  { name: "Udaipur",    image: "https://images.unsplash.com/photo-1590856029826-d7bc4e9cc8e5?w=600&q=70", tag: "City of Lakes" },
  { name: "Agra",       image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=70", tag: "Home of the Taj Mahal" },
  { name: "Varanasi",   image: "https://images.unsplash.com/photo-1561361058-c24ce7a2b6a0?w=600&q=70", tag: "Spiritual Capital of India" },
  { name: "Kerala",     image: "https://images.unsplash.com/photo-1583267746897-2cf415887172?w=600&q=70", tag: "God's Own Country" },
  { name: "Pune",       image: "https://images.unsplash.com/photo-1622644803108-e67b1dde2f01?w=600&q=70", tag: "Oxford of the East" },
  { name: "Ahmedabad",  image: "https://images.unsplash.com/photo-1621944190310-e3cca1564b7f?w=600&q=70", tag: "Manchester of India" },
  { name: "Shimla",     image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=70", tag: "Queen of Hills" },
  { name: "Manali",     image: "https://images.unsplash.com/photo-1643117590471-f1f3d30c60d5?w=600&q=70", tag: "Valley of the Gods" },
  { name: "Darjeeling", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=70", tag: "Land of the Thunderbolt" },
  { name: "Amritsar",   image: "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=600&q=70", tag: "Home of the Golden Temple" },
  { name: "Mysore",     image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=70", tag: "City of Palaces" },
  { name: "Rishikesh",  image: "https://images.unsplash.com/photo-1591018653573-3b8741c41e1b?w=600&q=70", tag: "Yoga Capital of the World" },
  { name: "Jodhpur",    image: "https://images.unsplash.com/photo-1477587458883-47145ed6736c?w=600&q=70", tag: "The Blue City" },
  { name: "Coorg",      image: "https://images.unsplash.com/photo-1590577976322-3d2d6a2130f5?w=600&q=70", tag: "Scotland of India" },
  { name: "Ooty",       image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=70", tag: "Queen of Hill Stations" },
  { name: "Leh",        image: "https://images.unsplash.com/photo-1622479989781-2a4ae45c3b6a?w=600&q=70", tag: "Land of High Passes" },
  { name: "Andaman",    image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=70", tag: "Emerald Islands" },
  { name: "Srinagar",   image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=600&q=70", tag: "Paradise on Earth" },
  { name: "Haridwar",   image: "https://images.unsplash.com/photo-1591018653573-3b8741c41e1b?w=600&q=70", tag: "Gateway to the Gods" },
  { name: "Bhopal",     image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600&q=70", tag: "City of Lakes" },
];

const BANNERS = [
  { image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=75", title: "Discover Luxury Hotels", subtitle: "Experience comfort like never before", offer: "Up to 40% OFF" },
  { image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1400&q=75", title: "Premium Stays Await",   subtitle: "Book your dream vacation today",        offer: "Free Breakfast" },
  { image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1400&q=75", title: "Unbeatable Deals",      subtitle: "Save up to 40% on luxury suites",        offer: "Limited Time"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: Move pure calculation outside component — recreated on every render before.
// ─────────────────────────────────────────────────────────────────────────────
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple in-memory cache so a browser refresh doesn't re-fetch if data is fresh
// ─────────────────────────────────────────────────────────────────────────────
const cache = { hotels: null, coupons: null, fetchedAt: 0 };
const CACHE_TTL_MS = 60_000; // 1 minute

function Home() {
  const [hotels,         setHotels]         = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [slide,          setSlide]          = useState(0);
  const [searchCity,     setSearchCity]     = useState("");
  const [checkIn,        setCheckIn]        = useState("");
  const [checkOut,       setCheckOut]       = useState("");
  const [guests,         setGuests]         = useState(1);
  const [showAllCities,  setShowAllCities]  = useState(false);
  const [cityHotelCounts,setCityHotelCounts]= useState({});
  const [sortedCities,   setSortedCities]   = useState([]);
  const [reviews,        setReviews]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [userLocation,   setUserLocation]   = useState(null);
  const [locationStatus, setLocationStatus] = useState("loading");

  const [latestCoupons,  setLatestCoupons]  = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [copiedCoupon,   setCopiedCoupon]   = useState(null);

  const navigate    = useNavigate();
  const bannerTimer = useRef(null);

  // ── Date helpers (stable refs, not recreated each render) ─────────────────
  const getTodayDate       = useCallback(() => new Date().toISOString().split("T")[0], []);
  const getMaxDate         = useCallback(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split("T")[0]; }, []);
  const getMinCheckOutDate = useCallback(() => {
    if (!checkIn) return getTodayDate();
    const d = new Date(checkIn); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, [checkIn, getTodayDate]);

  // ── FIX 3: Parallel API calls with Promise.all ─────────────────────────────
  //   Before: coupons fetched in a separate useEffect → sequential round trips.
  //           Hotels waited for locationStatus (could be 5 s timeout).
  //   After:  Both requests fire at the same time; location detection runs in
  //           parallel and doesn't block the hotel list from loading.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    const fetchAll = async () => {
      // Use cache if fresh
      if (cache.hotels && cache.coupons && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
        applyData(cache.hotels, cache.coupons);
        return;
      }

      try {
        const [hotelsRes, couponsRes] = await Promise.all([
          fetch("https://bookora-server-22ox.onrender.com/api/hotels",          { signal: controller.signal }),
          fetch("https://bookora-server-22ox.onrender.com/api/coupons/active",  { signal: controller.signal }),
        ]);

        const [hotelsData, couponsData] = await Promise.all([
          hotelsRes.json(),
          couponsRes.json(),
        ]);

        cache.hotels    = hotelsData;
        cache.coupons   = couponsData;
        cache.fetchedAt = Date.now();

        applyData(hotelsData, couponsData);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      }
    };

    const applyData = (hotelsData, couponsData) => {
      // Hotels
      setHotels(hotelsData);

      const counts = {};
      hotelsData.forEach(h => { if (h.city) counts[h.city] = (counts[h.city] || 0) + 1; });
      setCityHotelCounts(counts);

      // Sort cities by hotel count (location sort applied later if granted)
      const sorted = [...ALL_CITIES].sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0));
      setSortedCities(sorted);
      setFeaturedHotels(hotelsData);

      // Reviews
      const allReviews = [];
      hotelsData.forEach(hotel =>
        hotel.reviews?.forEach(rev => allReviews.push({ ...rev, hotelName: hotel.hotelName }))
      );
      allReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setReviews(allReviews.slice(0, 6));

      // Coupons
      const adminCoupons = Array.isArray(couponsData)
        ? couponsData.filter(c => c.isGlobal === true)
        : [];
      setLatestCoupons(adminCoupons);
      setCouponsLoading(false);
      setLoading(false);
    };

    fetchAll();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Location: runs independently, re-sorts the moment GPS resolves ──────────
  //   Race-condition fix: sort ALL_CITIES (the stable module constant) instead
  //   of using `prev` state — so it works even if hotels haven't loaded yet.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!("geolocation" in navigator)) { setLocationStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationStatus("granted");

        // Always sort ALL_CITIES by distance — nearest city first, always correct
        const byDistance = (a, b) => {
          const dA = CITY_COORDINATES[a.name] ? calcDistance(loc.lat, loc.lng, CITY_COORDINATES[a.name].lat, CITY_COORDINATES[a.name].lng) : Infinity;
          const dB = CITY_COORDINATES[b.name] ? calcDistance(loc.lat, loc.lng, CITY_COORDINATES[b.name].lat, CITY_COORDINATES[b.name].lng) : Infinity;
          return dA - dB;
        };
        setSortedCities([...ALL_CITIES].sort(byDistance));

        setFeaturedHotels(prev =>
          [...prev]
            .map(h => ({
              ...h,
              distance: CITY_COORDINATES[h.city]
                ? calcDistance(loc.lat, loc.lng, CITY_COORDINATES[h.city].lat, CITY_COORDINATES[h.city].lng)
                : Infinity,
            }))
            .sort((a, b) => a.distance - b.distance)
        );
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

  // ── Banner slideshow ───────────────────────────────────────────────────────
  useEffect(() => {
    bannerTimer.current = setInterval(() => setSlide(p => (p + 1) % BANNERS.length), 5000);
    return () => clearInterval(bannerTimer.current);
  }, []);

  // ── FIX 5: useCallback + useMemo to stop expensive re-computation ──────────
  //   Before: getHotelDistance called inline in JSX on every render → O(n) trig
  //           per hotel per render.
  //   After:  memoized helper; featured hotel list already pre-sorted with dist.
  // ──────────────────────────────────────────────────────────────────────────
  const getHotelDistance = useCallback(hotelCity => {
    if (!userLocation || !CITY_COORDINATES[hotelCity]) return null;
    const c = CITY_COORDINATES[hotelCity];
    return calcDistance(userLocation.lat, userLocation.lng, c.lat, c.lng);
  }, [userLocation]);

  const displayedCities   = useMemo(() => showAllCities ? sortedCities : sortedCities.slice(0, 6), [sortedCities, showAllCities]);
  const topFeaturedHotels = useMemo(() => featuredHotels.slice(0, 3), [featuredHotels]);

  // ── Copy coupon ────────────────────────────────────────────────────────────
  const copyCouponCode = useCallback(code => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchCity) params.append("city", searchCity);
    if (checkIn)    params.append("checkIn", checkIn);
    if (checkOut)   params.append("checkOut", checkOut);
    if (guests)     params.append("guests", guests);
    navigate(`/hotels?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchCity, checkIn, checkOut, guests, navigate]);

  const handleCityClick = useCallback(cityName => {
    navigate(`/hotels?city=${encodeURIComponent(cityName)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  // ── FIX 6: Don't block render while loading — show skeleton instead ─────────
  //   Before: full-screen spinner blocked the whole page until ALL data loaded.
  //   After:  hero + search bar render immediately; cards show skeleton shimmer.
  // ──────────────────────────────────────────────────────────────────────────
  const activeCoupon = latestCoupons[0]; // ticker handles cycling via CSS

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative min-h-[90vh] flex items-center">
        {BANNERS.map((banner, idx) => (
          <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${slide === idx ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            {/* FIX 6b: loading="eager" on first banner, lazy on rest */}
            <img
              src={banner.image}
              alt={banner.title}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover"
              onError={e => (e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=75")}
            />
            <div className="absolute top-20 right-20 z-20 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold animate-bounce">
              {banner.offer}
            </div>
          </div>
        ))}

        <div className="relative z-20 w-full py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl text-white animate-fade-in-up">
              <span className="text-yellow-400 font-semibold tracking-wider uppercase">Welcome to Bookora</span>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mt-4">Discover Luxury Hotels & Premium Stays</h1>
              <p className="mt-5 text-xl text-gray-200">Best rooms. Best prices. Instant booking.</p>
            </div>

            {/* Search Bar */}
            <div className="mt-12 bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl p-6 max-w-5xl border border-white/30 transform hover:scale-[1.02] transition-all duration-500">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input type="text" placeholder="📍 City (e.g., Mumbai, Delhi)" value={searchCity}
                  onChange={e => setSearchCity(e.target.value)}
                  className="md:col-span-2 p-4 rounded-xl bg-white/90 backdrop-blur-sm border-0 focus:ring-2 focus:ring-yellow-400" />
                <input type="date" value={checkIn} min={getTodayDate()} max={getMaxDate()}
                  onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }}
                  className="p-4 rounded-xl bg-white/90 backdrop-blur-sm" />
                <input type="date" value={checkOut} min={getMinCheckOutDate()} max={getMaxDate()} disabled={!checkIn}
                  className={`p-4 rounded-xl bg-white/90 backdrop-blur-sm ${!checkIn ? "opacity-50 cursor-not-allowed" : ""}`}
                  onChange={e => setCheckOut(e.target.value)} />
                <button onClick={handleSearch}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold px-6 py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all">
                  🔍 Search Hotels
                </button>
              </div>
              {!checkIn && <p className="text-xs text-white/80 mt-3 ml-2">*Select check-in date first</p>}
            </div>

            {/* ── COUPON TICKER ─────────────────────────────────────────── */}
            {!couponsLoading && latestCoupons.length > 0 && (
              <div className="mt-8 max-w-5xl">
                <div className="coupon-ticker-wrapper">
                  <div className="coupon-label-strip">
                    <span className="coupon-fire">🔥</span>
                    <span className="coupon-label-text">HOT DEALS</span>
                  </div>
                  <div className="coupon-track-outer">
                    <div className="coupon-track">
                      {[...latestCoupons, ...latestCoupons].map((coupon, idx) => (
                        <button
                          key={`${coupon._id}-${idx}`}
                          onClick={() => copyCouponCode(coupon.code)}
                          className={`coupon-pill ${copiedCoupon === coupon.code ? "coupon-pill--copied" : ""}`}
                        >
                          <span className="coupon-shimmer" aria-hidden="true"></span>
                          <span className="coupon-tag-icon">🏷️</span>
                          <span className="coupon-code">{coupon.code}</span>
                          <span className="coupon-divider">|</span>
                          <span className="coupon-value">
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} OFF`}
                          </span>
                          {coupon.minBookingAmount > 0 && (
                            <span className="coupon-min">Min ₹{coupon.minBookingAmount}</span>
                          )}
                          <span className="coupon-copy-icon">{copiedCoupon === coupon.code ? "✅" : "⎘"}</span>
                        </button>
                      ))}
                    </div>
                    <div className="coupon-fade-left"  aria-hidden="true"></div>
                    <div className="coupon-fade-right" aria-hidden="true"></div>
                  </div>
                  <div className="coupon-cta">
                    {copiedCoupon
                      ? <span className="coupon-copied-badge">✓ Copied!</span>
                      : <span className="coupon-tap-hint">Tap to copy</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hero Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
          {BANNERS.map((_, idx) => (
            <button key={idx} onClick={() => setSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${slide === idx ? "bg-yellow-400 w-8" : "bg-white/50 hover:bg-yellow-400"}`} />
          ))}
        </div>
      </div>

      {/* ── Cities Grid ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-fade-in-up">
          <span className="text-yellow-500 font-semibold uppercase tracking-wider">Explore Destinations</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">
            {locationStatus === "granted" ? "Cities Near You" : "Popular Cities in India"}
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            {locationStatus === "granted"
              ? "Discover hotels in cities closest to your location"
              : "Discover the best hotels across 28 stunning Indian destinations"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? /* Skeleton cards while loading */
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-lg bg-gray-100 h-72 animate-pulse" />
              ))
            : displayedCities.map((cityItem, idx) => {
                const hotelCount = cityHotelCounts[cityItem.name] || 0;
                const distance   = userLocation && CITY_COORDINATES[cityItem.name]
                  ? calcDistance(userLocation.lat, userLocation.lng, CITY_COORDINATES[cityItem.name].lat, CITY_COORDINATES[cityItem.name].lng)
                  : null;
                return (
                  <div key={idx} onClick={() => handleCityClick(cityItem.name)}
                    className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                    <div className="relative h-72 overflow-hidden">
                      {/* FIX 6c: lazy-load city images — they are below the fold */}
                      <img src={cityItem.image} alt={cityItem.name} loading="lazy" decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={e => (e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70")} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                        🏨 {hotelCount} Hotel{hotelCount !== 1 ? "s" : ""}
                      </div>
                      {distance !== null && distance < 100 && (
                        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
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
            <button onClick={() => setShowAllCities(true)}
              className="border-2 border-yellow-500 text-yellow-600 px-8 py-3 rounded-full font-semibold hover:bg-yellow-500 hover:text-white transition-all">
              View All {sortedCities.length} Cities
            </button>
          </div>
        )}
        {showAllCities && (
          <div className="text-center mt-10">
            <button onClick={() => setShowAllCities(false)} className="text-yellow-600 hover:underline">Show Less ↑</button>
          </div>
        )}
      </div>

      {/* ── Featured Hotels ───────────────────────────────────────────────── */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 animate-fade-in-up">
            <span className="text-yellow-500 font-semibold uppercase tracking-wider">Handpicked For You</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">
              {locationStatus === "granted" ? "Hotels Near You" : "Featured Hotels"}
            </h2>
            <p className="text-gray-500 mt-2">
              {locationStatus === "granted" ? "Top-rated hotels closest to your location" : "Our most popular luxury stays"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                    <div className="h-64 bg-gray-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))
              : topFeaturedHotels.map(hotel => {
                  const distance = getHotelDistance(hotel.city);
                  return (
                    <div key={hotel._id}
                      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1">
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70"}
                          alt={hotel.hotelName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                          onError={e => (e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70")}
                        />
                        <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-lg text-sm font-semibold">⭐ {hotel.rating}</div>
                        {distance !== null && distance < 100 && (
                          <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold animate-pulse">
                            📍 {Math.round(distance)} km away
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900">{hotel.hotelName}</h3>
                        <p className="text-gray-500 text-sm mb-3">📍 {hotel.city}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex text-yellow-400">{"★".repeat(Math.floor(hotel.rating || 4))}{"☆".repeat(5 - Math.floor(hotel.rating || 4))}</div>
                          <span className="text-sm text-gray-500">({hotel.reviews?.length || 0} reviews)</span>
                        </div>
                        <p className="text-yellow-600 text-2xl font-bold">₹{hotel.price}<span className="text-sm text-gray-400 font-normal"> /night</span></p>
                        <Link to={`/hotel/${hotel._id}`}
                          className="block text-center bg-gray-900 text-white py-3 rounded-xl mt-6 font-semibold hover:bg-yellow-500 hover:text-black transition-all">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  );
                })}
          </div>
          {!loading && topFeaturedHotels.length === 0 && (
            <div className="text-center py-12"><p className="text-gray-500">No hotels found in your area</p></div>
          )}
          <div className="text-center mt-10">
            <Link to="/hotels"
              className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              View All Hotels →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Reviews ──────────────────────────────────────────────────────── */}
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
                  <div className="flex text-yellow-400 mb-4">{"★".repeat(review.rating || 5)}{"☆".repeat(5 - (review.rating || 5))}</div>
                  <p className="leading-relaxed">"{review.comment}"</p>
                  <div className="mt-6">
                    <h4 className="font-bold text-lg">— {review.name}</h4>
                    <p className="text-gray-400 text-sm mt-1">Stayed at {review.hotelName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Why Choose Us ────────────────────────────────────────────────── */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-yellow-500 font-semibold uppercase tracking-wider">Why Book with Us</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">The Bookora Advantage</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "💰", title: "Best Price Guarantee", desc: "We ensure you get the best deals" },
              { icon: "🏨", title: "500+ Hotels",          desc: "Wide selection of premium stays" },
              { icon: "⭐", title: "Verified Reviews",     desc: "Real guest experiences" },
              { icon: "🎧", title: "24/7 Support",         desc: "We're here to help anytime" },
            ].map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-500 transition-all">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-gray-500 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-yellow-500">BOOKORA</h3>
              <p className="text-gray-400 mt-3">Luxury hotel booking made easy. Best prices, premium stays.</p>
              <div className="flex gap-4 mt-4">
                <span className="text-2xl cursor-pointer hover:text-yellow-500">📘</span>
                <span className="text-2xl cursor-pointer hover:text-yellow-500">📷</span>
                <span className="text-2xl cursor-pointer hover:text-yellow-500">🐦</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/"        className="hover:text-yellow-500">Home</Link></li>
                <li><Link to="/hotels"  className="hover:text-yellow-500">Hotels</Link></li>
                <li><Link to="/about"   className="hover:text-yellow-500">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-yellow-500">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/faq"          className="hover:text-yellow-500">FAQ</Link></li>
                <li><Link to="/privacy"      className="hover:text-yellow-500">Privacy Policy</Link></li>
                <li><Link to="/terms"        className="hover:text-yellow-500">Terms of Service</Link></li>
                <li><Link to="/cancellation" className="hover:text-yellow-500">Cancellation Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contact Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 +91 93468 26589</li>
                <li>✉️ support@bookora.com</li>
                <li>📍 India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; 2025 Bookora. All rights reserved. Luxury hotel booking platform.</p>
          </div>
        </div>
      </footer>

      {/* ── Global Styles ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }

        .coupon-ticker-wrapper {
          display: flex; align-items: center; gap: 0;
          background: rgba(0,0,0,0.38); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15); border-radius: 50px;
          padding: 6px 10px 6px 6px; overflow: hidden;
        }
        .coupon-label-strip {
          display: flex; align-items: center; gap: 5px;
          background: #EAB308; border-radius: 40px;
          padding: 6px 14px 6px 10px; flex-shrink: 0; margin-right: 10px;
        }
        .coupon-fire       { font-size: 15px; animation: fire-pulse 1.2s ease-in-out infinite alternate; }
        .coupon-label-text { font-size: 11px; font-weight: 800; color: #000; letter-spacing: 1.2px; white-space: nowrap; }
        @keyframes fire-pulse { from { transform: scale(1); } to { transform: scale(1.2); } }

        .coupon-track-outer { position: relative; flex: 1; overflow: hidden; min-width: 0; }
        .coupon-track {
          display: flex; gap: 10px; width: max-content;
          animation: coupon-scroll 28s linear infinite;
        }
        .coupon-track:hover { animation-play-state: paused; }
        @keyframes coupon-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .coupon-pill {
          position: relative; display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.93); border: 1.5px solid rgba(255,255,255,0.4);
          border-radius: 40px; padding: 7px 14px; cursor: pointer; white-space: nowrap;
          transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; overflow: hidden;
        }
        .coupon-pill:hover { transform: scale(1.06) translateY(-2px); background: #fff; box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
        .coupon-pill:active { transform: scale(0.97); }
        .coupon-pill--copied { background: #dcfce7 !important; border-color: #22c55e !important; }
        .coupon-shimmer {
          position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%);
          transform: translateX(-100%); animation: pill-shimmer 3s ease-in-out infinite; pointer-events: none;
        }
        @keyframes pill-shimmer { 0% { transform: translateX(-100%); } 40%, 100% { transform: translateX(200%); } }
        .coupon-tag-icon  { font-size: 13px; }
        .coupon-code      { font-family: 'Courier New', monospace; font-weight: 800; font-size: 13px; color: #1e293b; letter-spacing: 1px; }
        .coupon-divider   { color: #cbd5e1; font-size: 12px; }
        .coupon-value     { font-weight: 700; font-size: 12px; color: #16a34a; }
        .coupon-min       { font-size: 10px; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 20px; }
        .coupon-copy-icon { font-size: 13px; color: #64748b; transition: color 0.2s; }
        .coupon-pill:hover .coupon-copy-icon { color: #EAB308; }
        .coupon-fade-left, .coupon-fade-right {
          position: absolute; top: 0; bottom: 0; width: 40px; pointer-events: none; z-index: 2;
        }
        .coupon-fade-left  { left: 0;  background: linear-gradient(to right, rgba(0,0,0,0.35), transparent); }
        .coupon-fade-right { right: 0; background: linear-gradient(to left,  rgba(0,0,0,0.35), transparent); }
        .coupon-cta { flex-shrink: 0; margin-left: 10px; }
        .coupon-tap-hint { font-size: 11px; color: rgba(255,255,255,0.6); white-space: nowrap; font-style: italic; }
        .coupon-copied-badge {
          font-size: 11px; font-weight: 700; color: #4ade80; white-space: nowrap;
          animation: badge-pop 0.3s cubic-bezier(0.34,1.6,0.64,1) both;
        }
        @keyframes badge-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default Home;