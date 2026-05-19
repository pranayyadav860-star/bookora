// client/src/pages/AdminCoupons.js
// ADMIN VERSION - Separate sections for Global and Owner Coupons

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircleIcon,
  TrashIcon,
  TicketIcon,
  CalendarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  GiftIcon,
  FireIcon,
  ClockIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  ChartBarIcon,
  PencilIcon,
  CalculatorIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

function AdminCoupons() {
  const [globalCoupons, setGlobalCoupons] = useState([]);
  const [ownerCoupons, setOwnerCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showOwnerCouponModal, setShowOwnerCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [owners, setOwners] = useState([]);
  const [stats, setStats] = useState({
    globalTotal: 0,
    globalActive: 0,
    ownerTotal: 0,
    ownerActive: 0,
    totalRedeemed: 0,
    totalSavings: 0
  });
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 20,
    minBookingAmount: 0,
    maxDiscount: null,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: "",
    usageLimit: null,
    perUserLimit: 1,
    firstTimeOnly: false,
    newUserOnly: false,
    autoApply: false,
    stackable: false,
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("global");
  const [viewOwnerDetails, setViewOwnerDetails] = useState(null);
  
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

  // Load all coupons (Admin sees all)
  const loadCoupons = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/coupons/all", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Separate global and owner coupons
        const global = data.filter(c => c.isGlobal === true);
        const owner = data.filter(c => c.isGlobal === false);
        setGlobalCoupons(global);
        setOwnerCoupons(owner);
        calculateStats(global, owner);
      } else {
        setGlobalCoupons([]);
        setOwnerCoupons([]);
        calculateStats([], []);
      }
    } catch (err) {
      console.error("Error loading coupons:", err);
      setGlobalCoupons([]);
      setOwnerCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  // Load owners list
  const loadOwners = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/owners", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOwners(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading owners:", err);
    }
  };

  const calculateStats = (global, owner) => {
    const now = new Date();
    const globalActive = global.filter(c => c.isActive && new Date(c.validUntil) > now).length;
    const ownerActive = owner.filter(c => c.isActive && new Date(c.validUntil) > now).length;
    const totalRedeemed = [...global, ...owner].reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const totalSavings = [...global, ...owner].reduce((sum, c) => sum + ((c.usedCount || 0) * (c.discountValue || 0) * (c.discountType === "percentage" ? 100 : 1)), 0);
    
    setStats({
      globalTotal: global.length,
      globalActive: globalActive,
      ownerTotal: owner.length,
      ownerActive: ownerActive,
      totalRedeemed: totalRedeemed,
      totalSavings: totalSavings
    });
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/admin/dashboard");
    } else {
      loadCoupons();
      loadOwners();
    }
  }, [user]);

  const createGlobalCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discountValue || !newCoupon.validUntil) {
      setError("Please fill all required fields");
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
        firstTimeOnly: newCoupon.firstTimeOnly,
        newUserOnly: newCoupon.newUserOnly,
        autoApply: newCoupon.autoApply,
        stackable: newCoupon.stackable,
        isGlobal: true,
        applicableHotelIds: []
      };
      
      const response = await fetch("http://localhost:5000/api/coupons/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(couponData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Global coupon "${newCoupon.code.toUpperCase()}" created successfully!`);
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

  const deleteCoupon = async (id, code, isGlobal) => {
    if (!window.confirm(`Delete coupon "${code}"? This cannot be undone!`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/coupons/delete/${id}`, {
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

  const duplicateCoupon = (coupon, isGlobal) => {
    setNewCoupon({
      code: `${coupon.code}_COPY`,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minBookingAmount: coupon.minBookingAmount,
      maxDiscount: coupon.maxDiscount,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: "",
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit || 1,
      firstTimeOnly: coupon.firstTimeOnly || false,
      newUserOnly: coupon.newUserOnly || false,
      autoApply: coupon.autoApply || false,
      stackable: coupon.stackable || false,
      isActive: true
    });
    setEditingCoupon(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setNewCoupon({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 20,
      minBookingAmount: 0,
      maxDiscount: null,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: "",
      usageLimit: null,
      perUserLimit: 1,
      firstTimeOnly: false,
      newUserOnly: false,
      autoApply: false,
      stackable: false,
      isActive: true
    });
    setEditingCoupon(null);
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/coupons/toggle/${coupon._id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadCoupons();
        setSuccess(`Coupon "${coupon.code}" ${coupon.isActive ? "deactivated" : "activated"}!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error toggling coupon:", err);
    }
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
          <p className="text-gray-600 font-medium">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/dashboard" 
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
              >
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              
              <div className="h-8 w-px bg-white/30"></div>
              
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                    <TicketIcon className="h-6 w-6 text-black" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Coupons Management
                  </h1>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  Manage global coupons and owner-created coupons
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl font-semibold text-black hover:shadow-lg transition-all duration-300"
            >
              <GlobeAltIcon className="h-5 w-5" />
              Create Global Coupon
            </button>
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
            <p className="text-gray-500 text-sm">Global Coupons</p>
            <p className="text-2xl font-bold text-gray-900">{stats.globalTotal}</p>
            <p className="text-xs text-green-600 mt-1">{stats.globalActive} active</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Owner Coupons</p>
            <p className="text-2xl font-bold text-gray-900">{stats.ownerTotal}</p>
            <p className="text-xs text-green-600 mt-1">{stats.ownerActive} active</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Total Redeemed</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalRedeemed}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Customer Savings</p>
            <p className="text-2xl font-bold text-yellow-600">₹{stats.totalSavings.toLocaleString()}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("global")}
              className={`px-6 py-3 font-medium transition ${
                activeTab === "global"
                  ? "text-yellow-600 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <GlobeAltIcon className="h-4 w-4 inline mr-2" />
              Global Coupons (Admin)
            </button>
            <button
              onClick={() => setActiveTab("owner")}
              className={`px-6 py-3 font-medium transition ${
                activeTab === "owner"
                  ? "text-yellow-600 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BuildingOfficeIcon className="h-4 w-4 inline mr-2" />
              Owner Coupons
            </button>
          </div>
        </div>

        {/* Global Coupons Section */}
        {activeTab === "global" && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Global Coupons (Platform-wide)</h2>
                <p className="text-sm text-gray-500">These coupons are visible on ALL hotels across the platform</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm hover:shadow-lg transition"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Global Coupon
              </button>
            </div>

            {globalCoupons.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <GlobeAltIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No global coupons created yet</p>
                <button onClick={() => setShowModal(true)} className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition">
                  + Create Your First Global Coupon
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {globalCoupons.map((coupon, idx) => {
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
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100"
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <GlobeAltIcon className="h-5 w-5 text-white" />
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
                          
                          <div className="mt-2 pt-2 border-t">
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              <GlobeAltIcon className="h-3 w-3" />
                              Global - All Hotels
                            </span>
                          </div>
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
                            onClick={() => toggleCouponStatus(coupon)}
                            className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition"
                            title={coupon.isActive ? "Deactivate" : "Activate"}
                          >
                            {coupon.isActive ? "🔴" : "🟢"}
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon._id, coupon.code, true)}
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

        {/* Owner Coupons Section */}
        {activeTab === "owner" && (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Owner-Created Coupons</h2>
              <p className="text-sm text-gray-500">Coupons created by hotel owners for their specific properties</p>
            </div>

            {ownerCoupons.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No owner coupons created yet</p>
                <p className="text-sm text-gray-400 mt-1">Owners can create coupons from their dashboard</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownerCoupons.map((coupon, idx) => {
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
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100"
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="h-5 w-5 text-white" />
                            <h3 className="text-lg font-bold text-white font-mono">{coupon.code}</h3>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color} flex items-center gap-1`}>
                            <span>{status.icon}</span>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm mt-1">{coupon.description || `${typeInfo.name} offer`}</p>
                        <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          Owner: {coupon.ownerEmail || 'Unknown'}
                        </p>
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
                          
                          <div className="mt-2 pt-2 border-t">
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              <BuildingOfficeIcon className="h-3 w-3" />
                              Owner Specific - Selected Hotels
                            </span>
                          </div>
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
                            onClick={() => toggleCouponStatus(coupon)}
                            className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition"
                            title={coupon.isActive ? "Deactivate" : "Activate"}
                          >
                            {coupon.isActive ? "🔴" : "🟢"}
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon._id, coupon.code, false)}
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
      </div>

      {/* Create Global Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create Global Coupon</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-700">This coupon will be available on <strong>ALL HOTELS</strong> across the platform</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g., GLOBAL20"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
                    className="w-full p-3 border rounded-xl"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Value *</label>
                  <input
                    type="number"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({...newCoupon, discountValue: parseInt(e.target.value)})}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Booking Amount</label>
                  <input
                    type="number"
                    value={newCoupon.minBookingAmount}
                    onChange={(e) => setNewCoupon({...newCoupon, minBookingAmount: parseInt(e.target.value)})}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Maximum Discount Amount</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={newCoupon.maxDiscount || ""}
                  onChange={(e) => setNewCoupon({...newCoupon, maxDiscount: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full p-3 border rounded-xl"
                />
              </div>

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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={newCoupon.usageLimit || ""}
                    onChange={(e) => setNewCoupon({...newCoupon, usageLimit: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Per User Limit</label>
                  <input
                    type="number"
                    value={newCoupon.perUserLimit}
                    onChange={(e) => setNewCoupon({...newCoupon, perUserLimit: parseInt(e.target.value)})}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <label className="block text-sm font-semibold mb-3">Restrictions</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newCoupon.firstTimeOnly} onChange={(e) => setNewCoupon({...newCoupon, firstTimeOnly: e.target.checked})} className="w-4 h-4 text-yellow-500 rounded" />
                    <span className="text-sm">First-time customers only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newCoupon.newUserOnly} onChange={(e) => setNewCoupon({...newCoupon, newUserOnly: e.target.checked})} className="w-4 h-4 text-yellow-500 rounded" />
                    <span className="text-sm">New user only</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={createGlobalCoupon}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Global Coupon"}
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

export default AdminCoupons;