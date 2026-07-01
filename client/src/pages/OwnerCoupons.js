// client/src/pages/OwnerCoupons.js
// COMPLETE UPDATED VERSION - With Hotel Assignment

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircleIcon,
  TrashIcon,
  TicketIcon,
  CalendarIcon,
  UsersIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  GiftIcon,
  FireIcon,
  ClockIcon,
  RocketLaunchIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartBarIcon,
  PencilIcon,
  CalculatorIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  BellAlertIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

function OwnerCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
    savings: 0
  });
  const [hotels, setHotels] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    couponType: "discount",
    discountType: "percentage",
    discountValue: 20,
    minBookingAmount: 0,
    maxDiscount: null,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: "",
    usageLimit: null,
    perUserLimit: 1,
    applicableHotels: "all",
    hotelIds: [],
    minimumNights: 1,
    advanceBookingDays: 0,
    applicableDays: [],
    applicableRoomTypes: [],
    firstTimeOnly: false,
    newUserOnly: false,
    autoApply: false,
    stackable: false,
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("coupons");
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Coupon types configuration
  const couponTypes = [
    { id: "discount", name: "Discount Coupon", icon: CalculatorIcon, color: "blue", description: "Percentage or fixed amount off" },
    { id: "buyOneGetOne", name: "Buy One Get One", icon: GiftIcon, color: "green", description: "Get a free night or room" },
    { id: "freeUpgrade", name: "Free Upgrade", icon: RocketLaunchIcon, color: "purple", description: "Complimentary room upgrade" },
    { id: "earlyBird", name: "Early Bird", icon: ClockIcon, color: "orange", description: "Book in advance special" },
    { id: "lastMinute", name: "Last Minute", icon: FireIcon, color: "red", description: "Last minute booking deals" },
    { id: "weekendSpecial", name: "Weekend Special", icon: CalendarIcon, color: "pink", description: "Weekend stay discounts" },
    { id: "groupBooking", name: "Group Booking", icon: UserGroupIcon, color: "indigo", description: "Discount for groups" },
    { id: "loyaltyReward", name: "Loyalty Reward", icon: SparklesIcon, color: "yellow", description: "For returning customers" }
  ];

  // Load owner's hotels
  const loadHotels = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/hotels/owner/my-hotels", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading hotels:", err);
    }
  };

  // Replace the loadCoupons function with:
const loadCoupons = async () => {
  try {
    const token = localStorage.getItem("token");
    // Use the new endpoint that returns ONLY owner's own coupons
    const res = await fetch("https://bookora-server-22ox.onrender.com/api/coupons/owner/my-coupons", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
      calculateStats(data);
    } else {
      setCoupons([]);
      calculateStats([]);
    }
  } catch (err) {
    console.error("Error loading coupons:", err);
    setCoupons([]);
  } finally {
    setLoading(false);
  }
};

  const calculateStats = (couponsList) => {
    const now = new Date();
    const active = couponsList.filter(c => c.isActive && new Date(c.validUntil) > now).length;
    const redeemed = couponsList.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const savings = couponsList.reduce((sum, c) => sum + ((c.usedCount || 0) * (c.discountValue || 0) * (c.discountType === "percentage" ? 100 : 1)), 0);
    
    setStats({
      total: couponsList.length,
      active: active,
      redeemed: redeemed,
      savings: savings
    });
  };

  useEffect(() => {
    if (user?.role !== "owner" && user?.role !== "admin") {
      navigate("/owner/dashboard");
    } else {
      loadHotels();
      loadCoupons();
    }
  }, [user]);

  const createCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discountValue || !newCoupon.validUntil) {
      setError("Please fill all required fields");
      return;
    }
    
    // Validate hotel selection for specific hotels
    if (newCoupon.applicableHotels === "specific" && newCoupon.hotelIds.length === 0) {
      setError("Please select at least one hotel for this coupon");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const couponData = {
        code: newCoupon.code.toUpperCase(),
        description: newCoupon.description || `${newCoupon.discountValue}% off`,
        discountType: newCoupon.discountType,
        discountValue: Number(newCoupon.discountValue),
        minBookingAmount: Number(newCoupon.minBookingAmount),
        maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : null,
        validUntil: newCoupon.validUntil,
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : null,
        perUserLimit: Number(newCoupon.perUserLimit),
        minimumNights: Number(newCoupon.minimumNights),
        advanceBookingDays: Number(newCoupon.advanceBookingDays),
        applicableHotelIds: newCoupon.applicableHotels === "specific" ? newCoupon.hotelIds : [],
        isGlobal: newCoupon.applicableHotels === "all",
        firstTimeOnly: newCoupon.firstTimeOnly,
        newUserOnly: newCoupon.newUserOnly,
        autoApply: newCoupon.autoApply,
        stackable: newCoupon.stackable,
        couponType: newCoupon.couponType
      };
      
      const response = await fetch("https://bookora-server-22ox.onrender.com/api/coupons/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(couponData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Coupon "${newCoupon.code.toUpperCase()}" created successfully!`);
        setShowModal(false);
        resetForm();
        loadCoupons();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.msg || data.error || "Failed to create coupon");
      }
    } catch (err) {
      console.error("Error creating coupon:", err);
      setError("Failed to create coupon. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"? This cannot be undone!`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://bookora-server-22ox.onrender.com/api/coupons/delete/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadCoupons();
        setSuccess(`Coupon "${code}" deleted!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to delete coupon");
      }
    } catch (err) {
      console.error("Error deleting coupon:", err);
      setError("Failed to delete coupon");
    }
  };

  const duplicateCoupon = (coupon) => {
    setNewCoupon({
      ...coupon,
      code: `${coupon.code}_COPY`,
      _id: undefined,
      usedCount: 0,
      createdAt: undefined,
      hotelIds: coupon.applicableHotelIds || [],
      applicableHotels: coupon.isGlobal ? "all" : "specific"
    });
    setEditingCoupon(null);
    setShowModal(true);
  };

  const editCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      description: coupon.description || "",
      couponType: coupon.couponType || "discount",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minBookingAmount: coupon.minBookingAmount,
      maxDiscount: coupon.maxDiscount,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : "",
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit || 1,
      applicableHotels: coupon.isGlobal ? "all" : "specific",
      hotelIds: coupon.applicableHotelIds || [],
      minimumNights: coupon.minimumNights || 1,
      advanceBookingDays: coupon.advanceBookingDays || 0,
      applicableDays: coupon.applicableDays || [],
      applicableRoomTypes: coupon.applicableRoomTypes || [],
      firstTimeOnly: coupon.firstTimeOnly || false,
      newUserOnly: coupon.newUserOnly || false,
      autoApply: coupon.autoApply || false,
      stackable: coupon.stackable || false,
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setNewCoupon({
      code: "",
      description: "",
      couponType: "discount",
      discountType: "percentage",
      discountValue: 20,
      minBookingAmount: 0,
      maxDiscount: null,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: "",
      usageLimit: null,
      perUserLimit: 1,
      applicableHotels: "all",
      hotelIds: [],
      minimumNights: 1,
      advanceBookingDays: 0,
      applicableDays: [],
      applicableRoomTypes: [],
      firstTimeOnly: false,
      newUserOnly: false,
      autoApply: false,
      stackable: false,
      isActive: true
    });
    setEditingCoupon(null);
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) return { color: "bg-gray-100 text-gray-500", text: "Inactive", icon: "🔴" };
    if (validFrom > now) return { color: "bg-blue-100 text-blue-700", text: "Scheduled", icon: "⏰" };
    if (validUntil < now) return { color: "bg-red-100 text-red-700", text: "Expired", icon: "❌" };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { color: "bg-orange-100 text-orange-700", text: "Used Up", icon: "📊" };
    return { color: "bg-green-100 text-green-700", text: "Active", icon: "✅" };
  };

  const getCouponTypeInfo = (typeId) => {
    return couponTypes.find(t => t.id === typeId) || couponTypes[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-pink-600 to-red-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/owner/dashboard" 
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
              >
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              
              <div className="h-8 w-px bg-white/30"></div>
              
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                    <TicketIcon className="h-6 w-6 text-black" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Promotions & Coupons
                  </h1>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  Create powerful promotions to attract more customers
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl font-semibold text-black hover:shadow-lg transition-all duration-300"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl flex items-center gap-3 shadow-sm"
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-xl flex items-center gap-3 shadow-sm"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span className="text-sm">{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Coupons</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Active Promotions</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Total Redeemed</p>
            <p className="text-2xl font-bold text-purple-600">{stats.redeemed}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Customer Savings</p>
            <p className="text-2xl font-bold text-yellow-600">₹{stats.savings.toLocaleString()}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("coupons")}
              className={`px-6 py-3 font-medium transition ${
                activeTab === "coupons"
                  ? "text-yellow-600 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TicketIcon className="h-4 w-4 inline mr-2" />
              My Coupons
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-3 font-medium transition ${
                activeTab === "analytics"
                  ? "text-yellow-600 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ChartBarIcon className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Coupons Grid */}
        {activeTab === "coupons" && (
          <>
            {coupons.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <TicketIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No coupons created yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first promotion to attract more customers</p>
                <button onClick={() => setShowModal(true)} className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition">
                  + Create Your First Coupon
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon, idx) => {
                  const status = getCouponStatus(coupon);
                  const typeInfo = getCouponTypeInfo(coupon.couponType);
                  const TypeIcon = typeInfo.icon;
                  const discountText = coupon.discountType === "percentage" 
                    ? `${coupon.discountValue}% OFF` 
                    : `₹${coupon.discountValue} OFF`;
                  
                  return (
                    <motion.div
                      key={coupon._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <div className={`bg-gradient-to-r from-${typeInfo.color}-500 to-${typeInfo.color}-600 p-4`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-5 w-5 text-white" />
                            <h3 className="text-lg font-bold text-white font-mono">{coupon.code}</h3>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color} flex items-center gap-1`}>
                            <span>{status.icon}</span>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm mt-1">{coupon.description || `${typeInfo.name} offer`}</p>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5 text-yellow-500" />
                            <span className="font-bold text-xl text-yellow-600">{discountText}</span>
                          </div>
                          {coupon.minBookingAmount > 0 && (
                            <span className="text-xs text-gray-500">Min ₹{coupon.minBookingAmount}</span>
                          )}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {coupon.maxDiscount && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">💰 Max Discount:</span>
                              <span>₹{coupon.maxDiscount}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Valid:
                            </span>
                            <span>{new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}</span>
                          </div>
                          {coupon.usageLimit && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">🎟️ Used:</span>
                              <span>{coupon.usedCount || 0} / {coupon.usageLimit}</span>
                            </div>
                          )}
                          
                          {/* Show applicable hotels */}
                          {!coupon.isGlobal && coupon.applicableHotelIds && coupon.applicableHotelIds.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-semibold text-gray-600 mb-1">🏨 Applies to:</p>
                              <div className="flex flex-wrap gap-1">
                                {coupon.applicableHotelIds.map((hotelId, i) => (
                                  <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    Hotel {i + 1}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {coupon.isGlobal && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                🌍 Applies to all your hotels
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code);
                              setSuccess(`✅ "${coupon.code}" copied to clipboard!`);
                              setTimeout(() => setSuccess(null), 2000);
                            }}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition flex items-center justify-center gap-1"
                          >
                            📋 Copy Code
                          </button>
                          <button
                            onClick={() => editCoupon(coupon)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => duplicateCoupon(coupon)}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon._id, coupon.code)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Coupon Performance</h2>
            <div className="space-y-4">
              {coupons.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No data available</p>
                </div>
              ) : (
                coupons.map(coupon => (
                  <div key={coupon._id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-semibold text-lg">{coupon.code}</p>
                        <p className="text-sm text-gray-500">{coupon.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{coupon.usedCount || 0} uses</p>
                        <p className="text-xs text-gray-400">
                          {coupon.usageLimit ? `${((coupon.usedCount || 0) / coupon.usageLimit * 100).toFixed(1)}% used` : 'Unlimited'}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2 transition-all"
                        style={{ width: `${coupon.usageLimit ? ((coupon.usedCount || 0) / coupon.usageLimit * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g., SUMMER20"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 uppercase font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Customers will enter this code at checkout</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of this offer"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              {/* Discount Settings */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Value *</label>
                  <input
                    type="number"
                    placeholder={newCoupon.discountType === "percentage" ? "20" : "500"}
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({...newCoupon, discountValue: parseInt(e.target.value)})}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Booking Amount</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newCoupon.minBookingAmount}
                    onChange={(e) => setNewCoupon({...newCoupon, minBookingAmount: parseInt(e.target.value)})}
                    className="w-full p-3 border rounded-xl"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum order value to apply coupon</p>
                </div>
              </div>

              {/* Max Discount */}
              <div>
                <label className="block text-sm font-medium mb-1">Maximum Discount Amount (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 1000"
                  value={newCoupon.maxDiscount || ""}
                  onChange={(e) => setNewCoupon({...newCoupon, maxDiscount: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full p-3 border rounded-xl"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum discount that can be applied (for percentage discounts)</p>
              </div>

              {/* Validity Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From *</label>
                  <input
                    type="date"
                    value={newCoupon.validFrom}
                    onChange={(e) => setNewCoupon({...newCoupon, validFrom: e.target.value})}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until *</label>
                  <input
                    type="date"
                    value={newCoupon.validUntil}
                    onChange={(e) => setNewCoupon({...newCoupon, validUntil: e.target.value})}
                    className="w-full p-3 border rounded-xl"
                    min={newCoupon.validFrom}
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={newCoupon.usageLimit || ""}
                    onChange={(e) => setNewCoupon({...newCoupon, usageLimit: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full p-3 border rounded-xl"
                  />
                  <p className="text-xs text-gray-400 mt-1">Maximum times this coupon can be used</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Per User Limit</label>
                  <input
                    type="number"
                    value={newCoupon.perUserLimit}
                    onChange={(e) => setNewCoupon({...newCoupon, perUserLimit: parseInt(e.target.value)})}
                    className="w-full p-3 border rounded-xl"
                  />
                  <p className="text-xs text-gray-400 mt-1">How many times per customer</p>
                </div>
              </div>

              {/* Hotel Selection - IMPORTANT for owner coupons */}
              <div>
                <label className="block text-sm font-medium mb-2">Applicable Hotels *</label>
                <select
                  value={newCoupon.applicableHotels}
                  onChange={(e) => setNewCoupon({...newCoupon, applicableHotels: e.target.value, hotelIds: []})}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="all">All My Hotels (Global for your hotels)</option>
                  <option value="specific">Select Specific Hotels</option>
                </select>
                
                {newCoupon.applicableHotels === "specific" && (
                  <div className="mt-3 border rounded-xl p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-3 text-gray-700">Select hotels where this coupon will be visible:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {hotels.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No hotels found. Please add hotels first.</p>
                      ) : (
                        hotels.map(hotel => (
                          <label key={hotel._id} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-yellow-50 transition border border-gray-200">
                            <input
                              type="checkbox"
                              checked={newCoupon.hotelIds.includes(hotel._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewCoupon({...newCoupon, hotelIds: [...newCoupon.hotelIds, hotel._id]});
                                } else {
                                  setNewCoupon({...newCoupon, hotelIds: newCoupon.hotelIds.filter(id => id !== hotel._id)});
                                }
                              }}
                              className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                <p className="font-medium text-gray-800">{hotel.hotelName}</p>
                              </div>
                              <p className="text-xs text-gray-500">{hotel.city}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {newCoupon.hotelIds.length === 0 && newCoupon.applicableHotels === "specific" && (
                      <p className="text-xs text-red-500 mt-3">⚠️ Please select at least one hotel</p>
                    )}
                  </div>
                )}
                
                {newCoupon.applicableHotels === "all" && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">✓ This coupon will be visible on ALL your hotels</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={createCoupon}
                  disabled={submitting || (newCoupon.applicableHotels === "specific" && newCoupon.hotelIds.length === 0)}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : (editingCoupon ? "Update Coupon" : "Create Coupon")}
                </button>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerCoupons;