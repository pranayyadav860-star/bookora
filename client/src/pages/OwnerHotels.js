// client/src/pages/OwnerHotels.js
// PREMIUM VERSION - Same as AdminHotels with all tabs and features

import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingOfficeIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  MapPinIcon,
  WifiIcon,
  CurrencyRupeeIcon,
  HomeIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function OwnerHotels() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "owner" && user.role !== "admin"))) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Complete room type structure
  const emptyRoom = {
    name: "",
    price: "",
    guests: "",
    beds: "",
    available: true,
    breakfast: false,
    refundable: true,
    size: "",
    view: "",
    images: [],
    amenities: []
  };

  // Complete hotel form with all features
  const emptyForm = {
    hotelName: "",
    city: "",
    address: "",
    description: "",
    highlights: [],
    price: "",
    rating: 4,
    category: "",
    distanceToCity: "",
    distanceToPalace: "",
    distanceToAirport: "",
    distanceToBusStand: "",
    distanceToRailway: "",
    nearbyAttractions: [],
    rooms: "",
    roomTypes: [emptyRoom],
    images: [],
    popularFacilities: [],
    roomFeatures: [],
    servicesAndConveniences: [],
    gettingAround: [],
    roomAmenities: [],
    languagesSpoken: [],
    checkinFrom: "12:00 PM",
    checkoutUntil: "11:00 AM",
    checkinRules: [],
    childPolicies: {
      infant: "Infant 1–1 year(s): Stay free using existing bedding. Cot may cost extra and depends on availability.",
      children: "Children 2–8 year(s): Stay free using existing bedding.",
      adultAge: "Guests 9 years and older are considered adults.",
      extraBeds: "Extra beds depend on room chosen.",
      groupPolicy: "If booking more than 5 rooms, different policies may apply.",
      minGuestAge: 1
    },
    transport: [],
    nearbyPlaces: [],
    cancellationPolicy: "Free cancellation up to 7 days before check-in",
    paymentMethods: ["Cash", "Card", "UPI"],
    taxInfo: "Changes in tax structure due to government policies may revise taxes and will be charged additionally during checkout.",
    contactEmail: "",
    contactPhone: "",
    website: "",
    mapLocation: { lat: "", lng: "" }
  };

  const [form, setForm] = useState(emptyForm);
  const [hotels, setHotels] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [carouselIndices, setCarouselIndices] = useState({});
  const [imageCarouselOpen, setImageCarouselOpen] = useState(false);
  const [carouselImages, setCarouselImages] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Load ONLY owner's hotels
  const loadHotels = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/hotels/owner/my-hotels", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      const data = await res.json();
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading hotels:", err);
      setError("Failed to load hotels");
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (user && (user.role === "owner" || user.role === "admin")) {
      loadHotels();
    }
  }, [user, loadHotels]);

  // Handle carousel for individual hotel card
  const handlePrevImage = (hotelId, images, currentIndex) => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCarouselIndices(prev => ({ ...prev, [hotelId]: newIndex }));
  };

  const handleNextImage = (hotelId, images, currentIndex) => {
    const newIndex = (currentIndex + 1) % images.length;
    setCarouselIndices(prev => ({ ...prev, [hotelId]: newIndex }));
  };

  const openImageCarousel = (images, startIndex = 0) => {
    setCarouselImages(images);
    setCarouselIndex(startIndex);
    setImageCarouselOpen(true);
  };

  const nextImage = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      reader.readAsDataURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const max = 1600;
        if (width > max) {
          height = (height * max) / width;
          width = max;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          0.75
        );
      };
    });

  const deleteImageFromCloudinary = async (imageUrl) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/hotels/delete-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl })
      });
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  };

  const removeImage = async (indexToRemove) => {
    const imageToDelete = form.images[indexToRemove];
    if (imageToDelete) {
      await deleteImageFromCloudinary(imageToDelete);
    }
    setForm({
      ...form,
      images: form.images.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const removeRoomImage = async (roomIndex, imageIndex) => {
    const imageToDelete = form.roomTypes[roomIndex].images[imageIndex];
    if (imageToDelete && imageToDelete.includes("cloudinary")) {
      await deleteImageFromCloudinary(imageToDelete);
    }
    const updated = [...form.roomTypes];
    updated[roomIndex].images = updated[roomIndex].images.filter((_, idx) => idx !== imageIndex);
    setForm({ ...form, roomTypes: updated });
  };

  const uploadHotelImages = async (e) => {
    const files = Array.from(e.target.files);
    const fd = new FormData();
    setUploading(true);
    for (const file of files) {
      const small = await compressImage(file);
      fd.append("images", small);
    }
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/hotels/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: fd
    });
    const data = await res.json();
    setForm({ ...form, images: [...form.images, ...data] });
    setUploading(false);
  };

  const uploadRoomImages = async (e, index) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const fd = new FormData();
    setUploading(true);
    
    for (const file of files) {
      const small = await compressImage(file);
      fd.append("images", small);
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/hotels/upload-room", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: fd
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const updated = [...form.roomTypes];
        updated[index].images = [...(updated[index].images || []), ...data];
        setForm({ ...form, roomTypes: updated });
        setSuccess("Room images uploaded successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to upload room images");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error uploading images");
    } finally {
      setUploading(false);
    }
  };

  const roomChange = (index, field, value) => {
    const updated = [...form.roomTypes];
    updated[index][field] = value;
    setForm({ ...form, roomTypes: updated });
  };

  const addRoom = () => {
    setForm({ ...form, roomTypes: [...form.roomTypes, { ...emptyRoom }] });
  };

  const removeRoom = (index) => {
    setForm({
      ...form,
      roomTypes: form.roomTypes.filter((_, i) => i !== index)
    });
  };

  const toggleArrayItem = (field, value) => {
    const arr = form[field] || [];
    if (arr.includes(value)) {
      setForm({ ...form, [field]: arr.filter(x => x !== value) });
    } else {
      setForm({ ...form, [field]: [...arr, value] });
    }
  };

  const saveHotel = async () => {
    if (!form.hotelName.trim()) {
      setError("Hotel name is required");
      return;
    }
    if (!form.city.trim()) {
      setError("City is required");
      return;
    }
    if (!form.price) {
      setError("Price is required");
      return;
    }

    setError(null);
    const url = editId
      ? `http://localhost:5000/api/hotels/update/${editId}`
      : "http://localhost:5000/api/hotels/add";
    const method = editId ? "PUT" : "POST";

    const token = localStorage.getItem("token");
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      setSuccess(editId ? "Hotel updated successfully! ✅" : "Hotel added successfully! ✅");
      resetForm();
      loadHotels();
      setShowForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      const errorData = await res.json();
      setError(errorData.msg || "Failed to save hotel");
    }
  };

  const editHotel = (hotel) => {
    setEditId(hotel._id);
    setForm(hotel);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHotel = async (id) => {
    if (!window.confirm("Delete this hotel? This cannot be undone!")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/hotels/delete/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    loadHotels();
    setSuccess("Hotel deleted successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(false);
    setError(null);
    setActiveTab("basic");
  };

  const highlightOptions = [
    "✨ Prime Location in City Center", "🛏️ Spacious & Comfortable Rooms", "📶 Free High-Speed Wi-Fi",
    "🚗 Free Parking Facility", "🕒 24/7 Front Desk Support", "🧹 Daily Housekeeping Service",
    "❄️ Air Conditioned Rooms", "📺 Smart TV / Entertainment Access", "🍽️ In-House Restaurant / Room Service",
    "🔒 Safe & Secure Environment", "👨‍👩‍👧‍👦 Family Friendly Stay", "💼 Ideal for Business Travelers",
    "💑 Perfect for Couples & Vacations", "🚉 Easy Access to Transport Hubs", "🌟 Affordable Luxury Experience"
  ];

  const popularFacilitiesOptions = [
    "Free WiFi", "Outdoor Pool", "Indoor Pool", "Spa", "Fitness Center", "Restaurant",
    "Bar", "Parking", "Airport Shuttle", "Business Center", "Meeting Rooms"
  ];

  const roomFeaturesOptions = [
    "Air Conditioning", "Flat-screen TV", "Mini Bar", "In-room Safe", "Work Desk",
    "Balcony", "City View", "Private Bathroom", "Hair Dryer", "Free Toiletries"
  ];

  const servicesOptions = [
    "24-hour Front Desk", "Express Check-in/out", "Luggage Storage", "Concierge Service",
    "Daily Housekeeping", "Laundry Service", "Currency Exchange"
  ];

  const transportOptions = [
    "Airport Shuttle", "Car Rental", "Free Parking", "Taxi Service", "Bicycle Rental"
  ];

  const roomAmenitiesOptions = [
    "Desk", "Sitting Area", "Wardrobe", "Socket Near Bed", "Smoke Alarm", "First Aid Kit"
  ];

  const languagesOptions = ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Kannada"];
  const checkinRulesOptions = ["Check-in 12:00 PM", "Check-out 11:00 AM", "No Smoking", "ID Required"];
  const nearbyAttractionsOptions = ["Beaches", "Historical Places", "Shopping Malls", "Restaurants", "Parks", "Temples"];
  const categories = ["Luxury", "Budget", "Business", "Resort", "Boutique", "Family"];

  const filtered = hotels.filter((h) =>
    `${h.hotelName} ${h.city}`.toLowerCase().includes(search.toLowerCase())
  );

  const renderCheckboxGroup = (title, field, options, icon = null, columns = "md:grid-cols-3") => (
    <div className="border rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white">
      <label className="font-bold text-gray-800 mb-4 block flex items-center gap-2">
        {icon && <span className="text-yellow-500">{icon}</span>}
        {title}
      </label>
      <div className={`grid grid-cols-1 ${columns} gap-3 max-h-60 overflow-y-auto p-2`}>
        {options.map((item, idx) => (
          <label key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-yellow-50 p-2 rounded-lg transition">
            <input
              type="checkbox"
              checked={form[field]?.includes(item)}
              onChange={() => toggleArrayItem(field, item)}
              className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">Select all that apply</p>
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "owner" && user.role !== "admin")) return null;

  const tabs = [
    { id: "basic", name: "Basic Info", icon: BuildingOfficeIcon },
    { id: "location", name: "Location & Map", icon: MapPinIcon },
    { id: "rooms", name: "Rooms", icon: HomeIcon },
    { id: "highlights", name: "Highlights", icon: SparklesIcon },
    { id: "facilities", name: "Facilities", icon: WifiIcon },
    { id: "services", name: "Services", icon: DevicePhoneMobileIcon },
    { id: "policies", name: "Policies", icon: ShieldCheckIcon },
    { id: "media", name: "Media", icon: PhotoIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link to="/owner/dashboard" className="bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/30 transition">
                <ArrowLeftIcon className="h-4 w-4" />
                Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">My Hotels</h1>
                <p className="text-white/90 text-sm mt-1">Manage your properties with complete details</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Add New Hotel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl flex items-center gap-3 shadow-sm">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-xl flex items-center gap-3 shadow-sm">
            <CheckCircleIcon className="h-5 w-5" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">My Total Hotels</p><p className="text-3xl font-bold text-gray-900">{hotels.length}</p></div>
              <BuildingOfficeIcon className="h-10 w-10 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">My Total Rooms</p><p className="text-3xl font-bold text-gray-900">{hotels.reduce((sum, h) => sum + (h.roomTypes?.length || 0), 0)}</p></div>
              <HomeIcon className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Avg. Price</p><p className="text-3xl font-bold text-green-600">₹{Math.round(hotels.reduce((sum, h) => sum + (Number(h.price) || 0), 0) / (hotels.length || 1)).toLocaleString()}</p></div>
              <CurrencyRupeeIcon className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Cities</p><p className="text-3xl font-bold text-gray-900">{[...new Set(hotels.map(h => h.city).filter(Boolean))].length}</p></div>
              <MapPinIcon className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-8 border border-gray-100">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              placeholder="Search your hotels by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Hotel Cards Grid with Individual Image Carousels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((hotel) => {
            const currentImageIndex = carouselIndices[hotel._id] || 0;
            return (
              <div key={hotel._id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                <div className="relative h-56 overflow-hidden bg-gray-900">
                  {hotel.images && hotel.images.length > 0 ? (
                    <>
                      <img
                        src={hotel.images[currentImageIndex]}
                        alt={hotel.hotelName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {hotel.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePrevImage(hotel._id, hotel.images, currentImageIndex);
                            }}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleNextImage(hotel._id, hotel.images, currentImageIndex);
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                            {hotel.images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCarouselIndices(prev => ({ ...prev, [hotel._id]: idx }));
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition ${
                                  currentImageIndex === idx ? "bg-yellow-500 w-3" : "bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-12 w-12 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-sm flex items-center gap-1">
                    <StarIcon className="h-3 w-3 text-yellow-400" />
                    {hotel.rating || 4}
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{hotel.hotelName}</h3>
                  <p className="text-gray-500 text-sm mb-2 flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {hotel.city}
                  </p>
                  <p className="text-yellow-600 font-bold text-2xl mb-4">₹{hotel.price}<span className="text-sm text-gray-400">/night</span></p>
                  {hotel.highlights && hotel.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {hotel.highlights.slice(0, 2).map((h, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{h.substring(0, 20)}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => editHotel(hotel)} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button onClick={() => deleteHotel(hotel._id)} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <BuildingOfficeIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl">No hotels found</p>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-6 text-yellow-600 font-semibold hover:underline flex items-center gap-2 mx-auto">
              <PlusCircleIcon className="h-5 w-5" />
              Add your first hotel
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal - Same as AdminHotels */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {editId ? "Edit Hotel" : "Create New Hotel"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="border-b border-gray-200 px-6 overflow-x-auto">
                <div className="flex gap-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-b-2 border-yellow-500 text-yellow-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* TAB 1: BASIC INFO */}
                {activeTab === "basic" && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <input placeholder="Hotel Name *" value={form.hotelName} onChange={(e) => setForm({ ...form, hotelName: e.target.value })} className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500" />
                      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-gray-300 p-3 rounded-xl">
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <input placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-gray-300 p-3 rounded-xl" />
                      <input placeholder="Price per night *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-gray-300 p-3 rounded-xl" />
                      <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className="border border-gray-300 p-3 rounded-xl">
                        {[1,2,3,4,5].map(r => <option key={r}>{r} Star{r !== 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                    <textarea placeholder="Full Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 p-3 rounded-xl" rows="2" />
                    <textarea placeholder="Hotel Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 p-3 rounded-xl" rows="4" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <input placeholder="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="border border-gray-300 p-3 rounded-xl" />
                      <input placeholder="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="border border-gray-300 p-3 rounded-xl" />
                    </div>
                  </div>
                )}

                {/* TAB 2: LOCATION & MAP */}
                {activeTab === "location" && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <input placeholder="Distance to City Center (meters)" value={form.distanceToCity} onChange={(e) => setForm({ ...form, distanceToCity: e.target.value })} className="border border-gray-300 p-3 rounded-xl" />
                      <input placeholder="Distance to Main Attraction (meters)" value={form.distanceToPalace} onChange={(e) => setForm({ ...form, distanceToPalace: e.target.value })} className="border border-gray-300 p-3 rounded-xl" />
                    </div>
                    {renderCheckboxGroup("Nearby Attractions", "nearbyAttractions", nearbyAttractionsOptions, "📍", "md:grid-cols-2")}
                    <div className="border rounded-2xl p-6">
                      <label className="font-bold text-gray-700 mb-3 block flex items-center gap-2">
                        <MapPinIcon className="h-5 w-5 text-yellow-500" />
                        Google Maps Location
                      </label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input placeholder="Latitude" value={form.mapLocation.lat} onChange={(e) => setForm({ ...form, mapLocation: { ...form.mapLocation, lat: e.target.value } })} className="border p-3 rounded-xl" />
                        <input placeholder="Longitude" value={form.mapLocation.lng} onChange={(e) => setForm({ ...form, mapLocation: { ...form.mapLocation, lng: e.target.value } })} className="border p-3 rounded-xl" />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ROOMS */}
                {activeTab === "rooms" && (
                  <div className="space-y-6">
                    {form.roomTypes.map((room, index) => (
                      <div key={index} className="border rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <HomeIcon className="h-5 w-5 text-yellow-500" />
                            Room {index + 1}
                          </h3>
                          {index > 0 && <button onClick={() => removeRoom(index)} className="text-red-500 text-sm hover:underline">Remove</button>}
                        </div>
                        <div className="grid md:grid-cols-3 gap-3 mb-3">
                          <input placeholder="Room Name" value={room.name} onChange={(e) => roomChange(index, "name", e.target.value)} className="border p-3 rounded-xl" />
                          <input placeholder="Price" type="number" value={room.price} onChange={(e) => roomChange(index, "price", e.target.value)} className="border p-3 rounded-xl" />
                          <input placeholder="Room Size (sq ft)" value={room.size} onChange={(e) => roomChange(index, "size", e.target.value)} className="border p-3 rounded-xl" />
                        </div>
                        <div className="grid md:grid-cols-3 gap-3 mb-3">
                          <input placeholder="Max Guests" type="number" value={room.guests} onChange={(e) => roomChange(index, "guests", e.target.value)} className="border p-3 rounded-xl" />
                          <input placeholder="Beds" type="number" value={room.beds} onChange={(e) => roomChange(index, "beds", e.target.value)} className="border p-3 rounded-xl" />
                          <input placeholder="View" value={room.view} onChange={(e) => roomChange(index, "view", e.target.value)} className="border p-3 rounded-xl" />
                        </div>
                        <div className="flex gap-4 mb-3 flex-wrap">
                          <label className="flex items-center gap-2"><input type="checkbox" checked={room.breakfast} onChange={(e) => roomChange(index, "breakfast", e.target.checked)} /> Breakfast Included</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={room.refundable} onChange={(e) => roomChange(index, "refundable", e.target.checked)} /> Free Cancellation</label>
                        </div>
                        
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-700">Room Images</label>
                          <input type="file" multiple accept="image/*" onChange={(e) => uploadRoomImages(e, index)} className="mt-1 w-full p-2 border rounded-lg" />
                          {uploading && <p className="text-yellow-600 text-sm mt-1">Uploading images...</p>}
                          
                          {room.images && room.images.length > 0 && (
                            <div className="mt-3">
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {room.images.map((img, imgIdx) => (
                                  <div key={imgIdx} className="relative group flex-shrink-0">
                                    <img 
                                      src={img} 
                                      alt={`Room ${index + 1} - ${imgIdx + 1}`} 
                                      className="h-20 w-20 object-cover rounded-lg border-2 border-gray-200 hover:border-yellow-500 transition cursor-pointer"
                                      onClick={() => openImageCarousel(room.images, imgIdx)}
                                    />
                                    <button
                                      onClick={() => removeRoomImage(index, imgIdx)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={addRoom} className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                      + Add Another Room Type
                    </button>
                  </div>
                )}

                {activeTab === "highlights" && renderCheckboxGroup("Property Highlights ✨", "highlights", highlightOptions, "🌟", "md:grid-cols-2")}
                {activeTab === "facilities" && (
                  <>
                    {renderCheckboxGroup("Popular Facilities 🏨", "popularFacilities", popularFacilitiesOptions, "⭐", "md:grid-cols-2")}
                    {renderCheckboxGroup("Room Features 🛏️", "roomFeatures", roomFeaturesOptions, "🛋️", "md:grid-cols-2")}
                    {renderCheckboxGroup("Room Amenities 🚿", "roomAmenities", roomAmenitiesOptions, "🧴", "md:grid-cols-2")}
                    {renderCheckboxGroup("Languages Spoken 🗣️", "languagesSpoken", languagesOptions, "🌍", "md:grid-cols-3")}
                  </>
                )}
                {activeTab === "services" && (
                  <>
                    {renderCheckboxGroup("Services & Conveniences 🛎️", "servicesAndConveniences", servicesOptions, "🛜", "md:grid-cols-2")}
                    {renderCheckboxGroup("Transport Options 🚗", "gettingAround", transportOptions, "🚕", "md:grid-cols-2")}
                    {renderCheckboxGroup("Check-in Rules ⏰", "checkinRules", checkinRulesOptions, "🕐", "md:grid-cols-2")}
                  </>
                )}
                {activeTab === "policies" && (
                  <div className="space-y-6">
                    <div className="border rounded-2xl p-6">
                      <label className="font-bold text-gray-700 mb-3 block flex items-center gap-2"><ClockIcon className="h-5 w-5 text-yellow-500" />Check-in / Check-out Times</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><label className="text-sm text-gray-500">Check-in From</label><input value={form.checkinFrom} onChange={(e) => setForm({ ...form, checkinFrom: e.target.value })} className="w-full border p-3 rounded-xl mt-1" /></div>
                        <div><label className="text-sm text-gray-500">Check-out Until</label><input value={form.checkoutUntil} onChange={(e) => setForm({ ...form, checkoutUntil: e.target.value })} className="w-full border p-3 rounded-xl mt-1" /></div>
                      </div>
                    </div>
                    <div className="border rounded-2xl p-6">
                      <label className="font-bold text-gray-700 mb-3 block">Child and Extra Bed Policies</label>
                      <textarea value={form.childPolicies?.infant} onChange={(e) => setForm({ ...form, childPolicies: { ...form.childPolicies, infant: e.target.value } })} className="w-full border p-3 rounded-xl" rows="2" />
                      <textarea value={form.childPolicies?.children} onChange={(e) => setForm({ ...form, childPolicies: { ...form.childPolicies, children: e.target.value } })} className="w-full border p-3 rounded-xl mt-2" rows="2" />
                    </div>
                    <div className="border rounded-2xl p-6">
                      <label className="font-bold text-gray-700 mb-3 block">Cancellation Policy</label>
                      <textarea value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} className="w-full border p-3 rounded-xl" rows="2" />
                    </div>
                  </div>
                )}
                {activeTab === "media" && (
                  <div className="border rounded-2xl p-6">
                    <label className="font-bold text-gray-700 mb-3 block flex items-center gap-2"><PhotoIcon className="h-5 w-5 text-yellow-500" />Hotel Photos</label>
                    <div className="flex gap-3 mb-3 flex-wrap">
                      {form.images?.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt="" className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200 hover:border-yellow-500 transition cursor-pointer" 
                            onClick={() => openImageCarousel(form.images, idx)} />
                          <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:red-600 transition opacity-0 group-hover:opacity-100">✕</button>
                        </div>
                      ))}
                    </div>
                    <input type="file" multiple accept="image/*" onChange={uploadHotelImages} className="w-full" />
                    {uploading && <p className="text-yellow-600 mt-2">Uploading images...</p>}
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white py-4">
                  <button onClick={saveHotel} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300 text-lg">
                    {editId ? "Update Hotel" : "Add Hotel"}
                  </button>
                  <button onClick={resetForm} className="px-8 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Carousel Modal */}
      {imageCarouselOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl mx-4">
            <button
              onClick={() => setImageCarouselOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-yellow-400 transition text-2xl"
            >
              ✕ Close
            </button>
            
            <div className="relative">
              <img
                src={carouselImages[carouselIndex]}
                alt="Preview"
                className="w-full h-[70vh] object-contain"
              />
              
              {carouselImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            
            <div className="text-center text-white mt-4">
              <p>{carouselIndex + 1} of {carouselImages.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerHotels;