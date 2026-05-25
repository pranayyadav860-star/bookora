// client/src/Offers.js
// Offers Page - All Active Coupons with Premium 3D Effects

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Offers() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/coupons/active");
        const data = await response.json();
        setCoupons(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  // Mouse move handler for 3D tilt effect
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
      cardRef.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
  };

  // Get coupon icon based on discount type
  const getCouponIcon = (index, discountType) => {
    if (discountType === "percentage") {
      const icons = ["🏆", "🎉", "💎", "✨", "🎁", "🔥", "⭐", "💰"];
      return icons[index % icons.length];
    }
    return "💵";
  };

  // Get badge text
  const getBadgeText = (index) => {
    const badges = ["🔥 BEST DEAL", "⭐ POPULAR", "💎 PREMIUM", "✨ LIMITED", "🎁 EXCLUSIVE", "🚀 HOT OFFER", "🏷️ SAVE BIG", "⚡ FLASH SALE"];
    return badges[index % badges.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-100 px-5 py-2 rounded-full mb-5 shadow-md">
            <span className="text-yellow-700 text-sm font-semibold tracking-wide">
              🎁 LIMITED TIME OFFERS 🎁
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mt-2">
            Exclusive Coupons & Deals
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
            Grab these amazing discounts before they expire. Click any coupon to copy the code and save on your next booking!
          </p>
        </div>

        {/* Coupons Grid */}
        {coupons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {coupons.map((coupon, idx) => {
              let cardRef = null;
              return (
                <div
                  key={coupon._id || idx}
                  ref={(el) => (cardRef = el)}
                  onClick={() => copyCouponCode(coupon.code)}
                  onMouseMove={(e) => handleMouseMove(e, cardRef)}
                  onMouseLeave={() => handleMouseLeave(cardRef)}
                  className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-2xl cursor-pointer transition-all duration-300 overflow-hidden group"
                  style={{
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Animated Background Gradient on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Glowing Pulse Ring */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Badge */}
                    <div className="absolute -top-3 -right-3">
                      <div
                        className={`${
                          idx === 0
                            ? "bg-red-500 animate-pulse"
                            : idx === 1
                            ? "bg-purple-500"
                            : "bg-blue-500"
                        } text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-bold tracking-wide`}
                      >
                        {getBadgeText(idx)}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="text-6xl mb-5 text-center transform group-hover:scale-110 transition-transform duration-300">
                      {getCouponIcon(idx, coupon.discountType)}
                    </div>

                    {/* Coupon Code */}
                    <div className="text-center mb-4">
                      <div className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 px-5 py-2 rounded-xl shadow-inner">
                        <p className="font-mono font-bold text-gray-800 text-xl tracking-wider">
                          {coupon.code}
                        </p>
                      </div>
                    </div>

                    {/* Discount Value */}
                    <p className="text-center">
                      <span className="text-4xl font-extrabold text-green-600">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`}
                      </span>
                    </p>

                    {/* Description */}
                    {coupon.description && (
                      <p className="text-sm text-gray-600 text-center mt-3 line-clamp-2 px-2">
                        {coupon.description}
                      </p>
                    )}

                    {/* Min Booking Amount */}
                    {coupon.minBookingAmount > 0 && (
                      <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                        🛒 Min. Booking ₹{coupon.minBookingAmount.toLocaleString()}
                      </p>
                    )}

                    {/* Valid Till */}
                    {coupon.validTill && (
                      <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
                        ⏰ Valid till: {new Date(coupon.validTill).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}

                    {/* Copy Button */}
                    <div className="mt-6">
                      {copiedCoupon === coupon.code ? (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl text-center font-semibold text-sm animate-pulse shadow-lg">
                          ✅ Copied! Apply at Checkout
                        </div>
                      ) : (
                        <div className="group/btn relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl text-center font-semibold text-sm transition-all duration-300 hover:shadow-xl">
                          <span className="relative z-10">🎯 Click to Copy Code</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 transform translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sparkle Effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"
                      style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                      className="absolute top-1/3 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                    <div
                      className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-orange-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"
                      style={{ animationDelay: "0.6s" }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Active Offers</h3>
            <p className="text-gray-600 mb-6">Check back soon for exciting discounts and deals!</p>
            <Link
              to="/hotels"
              className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Browse Hotels
            </Link>
          </div>
        )}

        {/* Call to Action Banner */}
        {coupons.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 text-center text-white shadow-xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Can't find what you're looking for?</h3>
            <p className="text-white/90 mb-4">We add new offers every week. Book now and save big!</p>
            <Link
              to="/hotels"
              className="inline-block bg-white text-yellow-600 px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
            >
              Explore Hotels →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Offers;