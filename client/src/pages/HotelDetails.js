// client/src/pages/HotelDetails.js
// ULTRA MODERN UI - AI tools repositioned, floating negotiator, premium design

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PriceNegotiator from '../components/PriceNegotiator';
import ItineraryPlanner from '../components/ItineraryPlanner';
import WeatherWidget from '../components/WeatherWidget';
import UserNegotiationBot from '../components/UserNegotiationBot';
import ReviewSection from '../components/ReviewSection';
import {
  StarIcon,
  MapPinIcon,
  WifiIcon,
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparklesIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon,
  HeartIcon as HeartOutline,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  CurrencyRupeeIcon,
  SunIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

function HotelDetails() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [includeBreakfast, setIncludeBreakfast] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [showRoomGallery, setShowRoomGallery] = useState(false);
  const [currentRoomImageIndex, setCurrentRoomImageIndex] = useState(0);
  const [selectedRoomForGallery, setSelectedRoomForGallery] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Coupon States
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  
  // AI Tool modals
  const [showPriceNegotiator, setShowPriceNegotiator] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const BREAKFAST_PRICE_PER_GUEST = 100;

  const calculateGST = (roomPricePerNight) => {
    if (roomPricePerNight <= 1000) return { rate: 0, name: "Nil" };
    else if (roomPricePerNight <= 7500) return { rate: 12, name: "12% GST" };
    else return { rate: 18, name: "18% GST" };
  };

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(dayAfter.toISOString().split('T')[0]);
  }, []);

  // Fetch hotel data
  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/hotels/${id}`);
        if (!res.ok) { setError("Hotel not found"); return; }
        const data = await res.json();
        setHotel(data);
        if (data.roomTypes && data.roomTypes.length > 0) setSelectedRoom(data.roomTypes[0]);
        loadHotelCoupons(data);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load hotel details");
      } finally { setLoading(false); }
    };
    if (id) fetchHotel();
  }, [id]);

  const loadHotelCoupons = async (hotelData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/coupons/hotel/${hotelData._id}`);
      if (response.ok) {
        const hotelCoupons = await response.json();
        setCoupons(hotelCoupons);
      } else {
        setCoupons([]);
      }
    } catch (error) {
      console.error("Error loading coupons:", error);
      setCoupons([]);
    }
  };

  // Wishlist
  useEffect(() => {
    if (user && id) checkWishlistStatus();
  }, [user, id]);

  const checkWishlistStatus = async () => {
    if (!user || !id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:5000/api/wishlist/check/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setIsInWishlist(data.inWishlist);
    } catch (error) { console.error('Error:', error); }
  };

  const addToWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setWishlistLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/wishlist/add/${id}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) { setIsInWishlist(true); showToast('✓ Added to wishlist!', 'success'); }
      else if (response.status === 400) { showToast('Hotel already in your wishlist', 'info'); setIsInWishlist(true); }
      else { throw new Error('Failed to add'); }
    } catch (error) { showToast('Failed to add to wishlist', 'error'); }
    finally { setWishlistLoading(false); }
  };

  const removeFromWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setWishlistLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/wishlist/remove/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) { setIsInWishlist(false); showToast('✓ Removed from wishlist', 'success'); }
    } catch (error) { showToast('Failed to remove from wishlist', 'error'); }
    finally { setWishlistLoading(false); }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Image carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (!hotel?.images || hotel.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, hotel?.images]);

  const nextImage = () => {
    setIsAutoPlaying(false);
    if (hotel?.images?.length > 0) setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevImage = () => {
    setIsAutoPlaying(false);
    if (hotel?.images?.length > 0) setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleImageError = (index) => { setImageErrors(prev => ({ ...prev, [index]: true })); };

  // Calculations
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  };

  const calculateBreakfastCost = () => {
    if (!includeBreakfast) return 0;
    return guests * BREAKFAST_PRICE_PER_GUEST * calculateNights();
  };

  const calculateRoomTotal = () => {
    if (!selectedRoom) return 0;
    return selectedRoom.price * calculateNights();
  };

  const calculateTax = () => {
    if (!selectedRoom) return 0;
    const subtotal = calculateRoomTotal() + calculateBreakfastCost();
    const gstInfo = calculateGST(selectedRoom.price);
    return subtotal * (gstInfo.rate / 100);
  };

  const getGSTInfo = () => {
    if (!selectedRoom) return { rate: 0, name: "0% GST" };
    return calculateGST(selectedRoom.price);
  };

  const calculateGrandTotal = () => {
    return calculateRoomTotal() + calculateBreakfastCost() + calculateTax();
  };

  const handleBooking = () => {
    if (!user) { navigate("/login"); return; }
    if (!selectedRoom) { alert("Please select a room type"); return; }
    const nights = calculateNights();
    if (nights <= 0) { alert("Check-out date must be after check-in date"); return; }
    const gstInfo = getGSTInfo();
    const bookingData = {
      hotelId: hotel._id, hotelName: hotel.hotelName, hotelCity: hotel.city,
      roomType: selectedRoom.name, roomPrice: selectedRoom.price,
      checkIn, checkOut, guests, nights,
      roomTotal: calculateRoomTotal(), breakfastCost: calculateBreakfastCost(),
      tax: calculateTax(), taxRate: gstInfo.rate, taxName: gstInfo.name,
      totalAmount: calculateGrandTotal() - couponDiscount,
      originalAmount: calculateGrandTotal(),
      discountAmount: couponDiscount,
      couponCode: appliedCoupon?.code,
      includeBreakfast, hotelImage: hotel.images?.[0]
    };
    navigate("/checkout", { state: { booking: bookingData } });
  };

  // Room gallery modal
  const openRoomGallery = (room) => {
    setSelectedRoomForGallery(room);
    setCurrentRoomImageIndex(0);
    setShowRoomGallery(true);
  };

  const prevRoomImage = () => {
    if (selectedRoomForGallery && selectedRoomForGallery.images) {
      setCurrentRoomImageIndex((prev) => (prev - 1 + selectedRoomForGallery.images.length) % selectedRoomForGallery.images.length);
    }
  };

  const nextRoomImage = () => {
    if (selectedRoomForGallery && selectedRoomForGallery.images) {
      setCurrentRoomImageIndex((prev) => (prev + 1) % selectedRoomForGallery.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading luxury experience...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">{error || "Hotel not found"}</h2>
          <Link to="/hotels" className="mt-4 inline-block bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold">Back to Hotels</Link>
        </div>
      </div>
    );
  }

  const nights = calculateNights();
  const roomTotal = calculateRoomTotal();
  const breakfastCost = calculateBreakfastCost();
  const tax = calculateTax();
  const grandTotal = calculateGrandTotal();
  const finalTotal = grandTotal - couponDiscount;
  const gstInfo = getGSTInfo();
  
  const validImages = (hotel.images || []).filter((_, idx) => !imageErrors[idx]);
  const allImages = validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1566073771259-6a8506099945"];
  const currentImage = allImages[currentImageIndex % allImages.length];

  const allFacilities = [...(hotel.popularFacilities || []), ...(hotel.servicesAndConveniences || []), ...(hotel.roomAmenities || [])];
  const uniqueFacilities = [...new Set(allFacilities)];
  const displayedFacilities = showAllFacilities ? uniqueFacilities : uniqueFacilities.slice(0, 12);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Premium Carousel */}
      <div className="relative h-[500px] md:h-[650px] bg-black overflow-hidden">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
          <img 
            key={currentImageIndex} 
            src={currentImage} 
            alt={`${hotel.hotelName} - View ${currentImageIndex + 1}`} 
            className="w-full h-full object-cover transition-all duration-1000 ease-in-out transform scale-105" 
            onError={() => handleImageError(currentImageIndex)} 
          />
        </div>
        {allImages.length > 1 && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm">
              {isAutoPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
            </button>
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm z-20 flex items-center gap-2">
          <ArrowPathIcon className="h-3 w-3" /> {currentImageIndex + 1} / {allImages.length}
        </div>
        {allImages.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-20 hover:scale-110"><ChevronLeftIcon className="h-6 w-6" /></button>
            <button onClick={nextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-20 hover:scale-110"><ChevronRightIcon className="h-6 w-6" /></button>
          </>
        )}
        {allImages.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 z-20">
            <div className="flex justify-center gap-2 px-4 overflow-x-auto pb-2 max-w-full mx-auto">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => { setIsAutoPlaying(false); setCurrentImageIndex(idx); setTimeout(() => setIsAutoPlaying(true), 10000); }} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${currentImageIndex === idx ? "border-yellow-500 ring-2 ring-yellow-500/50 scale-105" : "border-white/30 hover:border-yellow-400"}`}>
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945"; }} />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex text-yellow-400">{"★".repeat(Math.floor(hotel.rating))}{"☆".repeat(5 - Math.floor(hotel.rating))}</div>
              <span className="text-sm">{hotel.rating} / 5</span>
              <span className="text-gray-300">• {hotel.reviews?.length || 0} reviews</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">{hotel.hotelName}</h1>
            <p className="text-gray-200 mt-2 flex items-center gap-1"><MapPinIcon className="h-5 w-5" /> {hotel.city}, {hotel.address || "India"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap justify-around gap-4">
              <div className="text-center"><div className="text-yellow-500 text-2xl mb-1">🏨</div><p className="text-sm font-semibold">{hotel.roomTypes?.length || 0} Room Types</p></div>
              <div className="text-center"><div className="text-yellow-500 text-2xl mb-1">🛎️</div><p className="text-sm font-semibold">24/7 Service</p></div>
              <div className="text-center"><div className="text-yellow-500 text-2xl mb-1">✅</div><p className="text-sm font-semibold">Free Cancellation</p></div>
              <div className="text-center"><div className="text-yellow-500 text-2xl mb-1">💳</div><p className="text-sm font-semibold">Secure Booking</p></div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm"><h2 className="text-2xl font-bold mb-4">About This Hotel</h2><p className="text-gray-600 leading-relaxed">{hotel.description || "Experience luxury and comfort at this beautiful property."}</p></div>

            {/* Highlights */}
            {hotel.highlights && hotel.highlights.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-yellow-500" /> Property Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{hotel.highlights.map((highlight, idx) => (<div key={idx} className="flex items-center gap-2 text-gray-600"><CheckCircleIcon className="h-4 w-4 text-green-500" /><span className="text-sm">{highlight}</span></div>))}</div>
              </div>
            )}

            {/* Room Types */}
            {hotel.roomTypes && hotel.roomTypes.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><HomeIcon className="h-6 w-6 text-yellow-500" /> Room Types</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {hotel.roomTypes.map((room, idx) => (
                    <div key={idx} className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${selectedRoom?.name === room.name ? "border-yellow-500 ring-2 ring-yellow-500 shadow-lg" : "border-gray-200 hover:border-yellow-300 hover:shadow-md"}`} onClick={() => setSelectedRoom(room)}>
                      {room.images && room.images.length > 0 && (
                        <div className="relative h-48 overflow-hidden group">
                          <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945"; }} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <button onClick={(e) => { e.stopPropagation(); openRoomGallery(room); }} className="bg-white/90 text-black px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1">📷 View All ({room.images.length}) Photos</button>
                          </div>
                          {room.images.length > 1 && <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{room.images.length} photos</div>}
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg">{room.name}</h3><div className="text-right"><p className="text-yellow-600 font-bold text-xl">₹{room.price}</p><p className="text-xs text-gray-400">/night</p></div></div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500"><span>👥 {room.guests} guests</span><span>🛏️ {room.beds} beds</span>{room.size && <span>📏 {room.size} sq ft</span>}{room.view && <span>👁️ {room.view} view</span>}{room.breakfast && <span>🍳 Breakfast</span>}{room.refundable && <span>🔄 Free cancellation</span>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities */}
            {uniqueFacilities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><WifiIcon className="h-6 w-6 text-yellow-500" /> Facilities & Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{displayedFacilities.map((facility, idx) => (<div key={idx} className="flex items-center gap-2 text-gray-600"><CheckCircleIcon className="h-4 w-4 text-green-500" /><span className="text-sm">{facility}</span></div>))}</div>
                {uniqueFacilities.length > 12 && (<button onClick={() => setShowAllFacilities(!showAllFacilities)} className="mt-4 text-yellow-600 text-sm font-medium hover:underline">{showAllFacilities ? "Show Less ↑" : `View All ${uniqueFacilities.length} Facilities ↓`}</button>)}
              </div>
            )}

            {/* Nearby Attractions */}
            {hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><MapPinIcon className="h-6 w-6 text-yellow-500" /> Nearby Attractions</h2>
                <div className="flex flex-wrap gap-2">{hotel.nearbyAttractions.map((attraction, idx) => (<span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{attraction}</span>))}</div>
              </div>
            )}

            {/* Guest Reviews */}
      <ReviewSection hotelId={id} hotelOwnerId={hotel?.ownerId} />
          </div>

          {/* RIGHT COLUMN - Booking Card with integrated Weather & Price Negotiator */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Main Booking Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 booking-card relative">
                <button onClick={isInWishlist ? removeFromWishlist : addToWishlist} disabled={wishlistLoading} className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-10 ${isInWishlist ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500'} ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`} title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
                  {isInWishlist ? <HeartSolid className="h-5 w-5" /> : <HeartOutline className="h-5 w-5" />}
                </button>

                <div className="text-center mb-4"><p className="text-3xl font-bold text-yellow-600">₹{selectedRoom?.price || hotel.price}</p><p className="text-gray-500">per night</p></div>
                
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Select Room Type</label>
                    <select value={selectedRoom?.name || ""} onChange={(e) => { const room = hotel.roomTypes.find(r => r.name === e.target.value); setSelectedRoom(room); }} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500">
                      {hotel.roomTypes.map((room, idx) => (<option key={idx} value={room.name}>{room.name} - ₹{room.price}/night (Max {room.guests} guests)</option>))}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Check-in Date</label><input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500" min={new Date().toISOString().split('T')[0]} /></div>
                  <div><label className="block text-sm font-medium mb-1">Check-out Date</label><input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500" min={checkIn} /></div>
                  <div><label className="block text-sm font-medium mb-1">Number of Guests</label><input type="number" min="1" max={selectedRoom?.guests || 10} value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500" /></div>

                  <div className="border rounded-xl p-4 bg-gray-50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={includeBreakfast} onChange={(e) => setIncludeBreakfast(e.target.checked)} className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500" />
                      <div className="flex-1"><span className="font-semibold">Include Breakfast</span><p className="text-xs text-gray-500">₹{BREAKFAST_PRICE_PER_GUEST} per person per day</p></div>
                      <span className="text-yellow-600 font-bold">+₹{includeBreakfast ? breakfastCost : 0}</span>
                    </label>
                  </div>
                </div>

                {/* Price Breakdown */}
                {selectedRoom && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Room charges ({calculateNights()} nights)</span><span>₹{roomTotal}</span></div>
                      {includeBreakfast && breakfastCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Breakfast</span><span>₹{breakfastCost}</span></div>}
                      {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount ({appliedCoupon?.code})</span><span>-₹{couponDiscount}</span></div>}
                      <div className="flex justify-between items-center group relative"><span className="text-gray-600 flex items-center gap-1">{gstInfo.name}<InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" /><span className="hidden group-hover:block absolute bg-gray-800 text-white text-xs rounded p-1 -top-8 left-0 whitespace-nowrap">Govt. GST rates: ≤₹1000 → 0%, ₹1001-7500 → 12%, &gt;₹7500 → 18%</span></span><span>₹{Math.round(tax)}</span></div>
                      <div className="border-t pt-2 mt-2"><div className="flex justify-between font-bold text-lg"><span>Total Amount</span><span className="text-yellow-600">₹{Math.round(finalTotal)}</span></div><p className="text-xs text-gray-400 mt-1">*Includes all taxes</p></div>
                      {couponDiscount > 0 && <p className="text-xs text-green-600 mt-1">You saved ₹{couponDiscount} with coupon code!</p>}
                    </div>
                  </div>
                )}
                
                <button onClick={handleBooking} className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105">Book Now</button>
                <p className="text-xs text-gray-400 text-center mt-3">✓ Free cancellation up to 7 days before check-in</p>

                {/* Coupon Section (compact, with modal trigger) */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TicketIcon className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-700">Available Offers</span>
                    </div>
                    {coupons.length > 0 && (
                      <button onClick={() => setShowCouponModal(true)} className="text-xs text-yellow-600 hover:text-yellow-700 font-medium">
                        View All ({coupons.length})
                      </button>
                    )}
                  </div>
                  {coupons.length > 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-700">💡 {coupons.length} special offer(s) available. Click "View Offers" to copy codes.</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500">No active offers at the moment</p>
                    </div>
                  )}
                </div>

                {/* Price Negotiator Button (opens modal) */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowPriceNegotiator(true)}
                    className="w-full bg-purple-50 border border-purple-200 text-purple-700 py-2 rounded-xl font-medium hover:bg-purple-100 transition flex items-center justify-center gap-2"
                  >
                    <CurrencyRupeeIcon className="h-4 w-4" />
                    Negotiate Price
                  </button>
                </div>

                {/* Weather Widget (compact) */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <SunIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Current Weather in {hotel.city}</span>
                  </div>
                  <WeatherWidget city={hotel.city} compact />
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
                <h3 className="font-semibold mb-2">Have questions?</h3>
                <p className="text-sm text-gray-500 mb-3">Contact the property directly</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-200 transition"><PhoneIcon className="h-4 w-4" /> Call</button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-200 transition"><EnvelopeIcon className="h-4 w-4" /> Email</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Itinerary Planner Section (now a full-width call-to-action) */}
        {hotel && (
          <div className="mt-12 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-green-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">🗺️</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Plan Your Perfect Trip</h3>
                    <p className="text-gray-600 text-sm">Get a personalized day-by-day itinerary with attractions, budget, and local tips.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowItineraryModal(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <SparklesIcon className="h-5 w-5" />
                  Plan My Trip
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center"><Link to="/hotels" className="text-yellow-600 hover:underline inline-flex items-center gap-1">← Back to all hotels</Link></div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Coupon Modal - Copy Code Only */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TicketIcon className="h-6 w-6 text-white" />
                  <h3 className="text-xl font-bold text-white">Available Offers</h3>
                </div>
                <button onClick={() => setShowCouponModal(false)} className="text-white hover:text-gray-200 transition">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">Copy code and apply at checkout</p>
            </div>
            
            <div className="p-5">
              {coupons.length === 0 ? (
                <div className="text-center py-8">
                  <TicketIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No active offers at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon, idx) => (
                    <div key={coupon._id} className="border-2 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 text-sm font-bold">🎁</span>
                            </div>
                            <span className="font-bold text-lg font-mono text-gray-800">{coupon.code}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {coupon.discountType === "percentage" 
                              ? `${coupon.discountValue}% OFF` 
                              : `₹${coupon.discountValue} OFF`}
                          </p>
                          {coupon.description && <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {coupon.minBookingAmount > 0 && <span className="text-xs text-gray-500">Min. spend ₹{coupon.minBookingAmount}</span>}
                            {coupon.maxDiscount && <span className="text-xs text-gray-500">Max discount ₹{coupon.maxDiscount}</span>}
                            {coupon.validUntil && <span className="text-xs text-gray-500">Valid till: {new Date(coupon.validUntil).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            showToast(`✓ "${coupon.code}" copied to clipboard!`, 'success');
                          }}
                          className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-gray-500">💡 Copy the coupon code and apply it at checkout to get discount</p>
              </div>
              
              <button onClick={() => setShowCouponModal(false)} className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Negotiator Modal */}
      {showPriceNegotiator && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">💰 Negotiate Price</h3>
              <button onClick={() => setShowPriceNegotiator(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-5">
              <PriceNegotiator 
                hotelId={hotel._id} 
                hotelPrice={selectedRoom?.price || hotel.price}
                onClose={() => setShowPriceNegotiator(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Planner Modal */}
      {showItineraryModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">🗺️ AI Travel Itinerary</h3>
              <button onClick={() => setShowItineraryModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-5">
              <ItineraryPlanner hotel={hotel} />
            </div>
          </div>
        </div>
      )}

      {/* Room Gallery Modal */}
      {showRoomGallery && selectedRoomForGallery && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl mx-4">
            <div className="absolute -top-16 left-0 right-0 flex justify-between items-center">
              <button onClick={() => { setShowRoomGallery(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-white hover:text-yellow-400 transition flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full"><ChevronLeftIcon className="h-5 w-5" /><span>Back to Hotel</span></button>
              <button onClick={() => setShowRoomGallery(false)} className="text-white hover:text-yellow-400 transition flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full"><span>Close</span><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="text-center text-white mb-4"><h3 className="text-2xl font-bold">{selectedRoomForGallery.name}</h3><p className="text-yellow-400">₹{selectedRoomForGallery.price} / night</p></div>
            <div className="relative">
              <img src={selectedRoomForGallery.images[currentRoomImageIndex]} alt={`${selectedRoomForGallery.name} - ${currentRoomImageIndex + 1}`} className="w-full h-[55vh] object-contain" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945"; }} />
              {selectedRoomForGallery.images.length > 1 && (<><button onClick={prevRoomImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition hover:scale-110"><ChevronLeftIcon className="h-6 w-6" /></button><button onClick={nextRoomImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition hover:scale-110"><ChevronRightIcon className="h-6 w-6" /></button></>)}
            </div>
            <div className="text-center text-white/70 text-sm mt-3">{currentRoomImageIndex + 1} of {selectedRoomForGallery.images.length} photos</div>
            {selectedRoomForGallery.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2 max-w-full">
                {selectedRoomForGallery.images.map((img, idx) => (<button key={idx} onClick={() => setCurrentRoomImageIndex(idx)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${currentRoomImageIndex === idx ? "border-yellow-500 ring-2 ring-yellow-500/50" : "border-transparent hover:border-yellow-400"}`}><img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945"; }} /></button>))}
              </div>
            )}
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => setShowRoomGallery(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">Back to Hotel</button>
              <button onClick={() => { setShowRoomGallery(false); setTimeout(() => { const bookingCard = document.querySelector('.booking-card'); if (bookingCard) bookingCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold transition">Book This Room</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Negotiation Bot (Chat Bubble) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowNegotiationModal(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
        </button>
      </div>

      {/* Negotiation Modal */}
      {showNegotiationModal && hotel && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">💬 Negotiate with Hotel</h3>
              <button onClick={() => setShowNegotiationModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-5">
              <UserNegotiationBot
                hotelId={hotel._id}
                hotelName={hotel.hotelName}
                currentPrice={selectedRoom?.price || hotel.price}
                roomType={selectedRoom?.name}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                onNegotiationSuccess={(offer) => { 
                  setShowNegotiationModal(false);
                  navigate('/checkout', { state: { negotiatedOffer: offer } }); 
                }}
                onClose={() => setShowNegotiationModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default HotelDetails;