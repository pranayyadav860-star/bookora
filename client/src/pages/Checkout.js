// client/src/pages/Checkout.js
// COMPLETELY FIXED - No duplicate bookings

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PaymentGateway from '../components/PaymentGateway';

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const booking = location.state?.booking;
  
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pay_at_hotel");
  const [showQR, setShowQR] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  
  // CRITICAL: Use refs to prevent duplicate submissions
  const hasSubmittedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const bookingCreatedRef = useRef(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplying, setCouponApplying] = useState(false);
  const [finalAmount, setFinalAmount] = useState(booking?.totalAmount || 0);
  
  // Guest Details Form
  const [guestDetails, setGuestDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialRequests: ""
  });
  
  const [errors, setErrors] = useState({});

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setGuestDetails(prev => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  // Update final amount when booking loads
  useEffect(() => {
    if (booking?.totalAmount) {
      setFinalAmount(booking.totalAmount);
    }
    // Reset submission flags when component mounts
    hasSubmittedRef.current = false;
    isSubmittingRef.current = false;
    bookingCreatedRef.current = false;
  }, [booking]);

  // Reset flags when navigating away
  useEffect(() => {
    return () => {
      hasSubmittedRef.current = false;
      isSubmittingRef.current = false;
      bookingCreatedRef.current = false;
    };
  }, []);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">No booking information found.</p>
          <Link to="/hotels" className="mt-4 inline-block bg-yellow-500 px-4 py-2 rounded">Go to Hotels</Link>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};
    if (!guestDetails.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!guestDetails.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(guestDetails.email)) newErrors.email = "Email is invalid";
    if (!guestDetails.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(guestDetails.phone)) newErrors.phone = "Phone number must be 10 digits";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const applyCoupon = async () => {
    if (!couponCode) {
      alert("Please enter a coupon code");
      return;
    }
    
    setCouponApplying(true);
    try {
      const response = await fetch("http://localhost:5000/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          amount: booking.totalAmount,
          hotelId: booking.hotelId
        })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setCouponApplied(data.coupon);
        setCouponDiscount(data.coupon.discountAmount);
        setFinalAmount(booking.totalAmount - data.coupon.discountAmount);
        alert(`✅ Coupon applied! You saved ₹${data.coupon.discountAmount}`);
      } else {
        alert(data.msg || "Invalid coupon code");
        setCouponApplied(null);
        setCouponDiscount(0);
        setFinalAmount(booking.totalAmount);
      }
    } catch (err) {
      console.error("Apply coupon error:", err);
      alert("Error applying coupon. Please try again.");
    } finally {
      setCouponApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponDiscount(0);
    setFinalAmount(booking.totalAmount);
    setCouponCode("");
  };

  // MAIN BOOKING CREATION FUNCTION - With duplicate prevention
  const createBooking = async (paymentData = null) => {
    // CRITICAL: Check if already submitted or creating
    if (hasSubmittedRef.current) {
      console.log("⚠️ Booking already submitted, skipping duplicate");
      return null;
    }
    
    if (isSubmittingRef.current) {
      console.log("⚠️ Booking creation already in progress, skipping duplicate");
      return null;
    }
    
    if (bookingCreatedRef.current) {
      console.log("⚠️ Booking already created, skipping duplicate");
      return null;
    }
    
    // Mark as submitting immediately
    isSubmittingRef.current = true;
    
    const bookingId = `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const bookingData = {
      bookingId: bookingId,
      hotelId: booking.hotelId,
      hotelName: booking.hotelName,
      city: booking.hotelCity,
      roomType: booking.roomType,
      roomPrice: booking.roomPrice,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      nights: booking.nights || 1,
      roomTotal: booking.roomTotal || booking.roomPrice * (booking.nights || 1),
      breakfastCost: booking.breakfastCost || 0,
      tax: booking.tax || 0,
      amount: finalAmount,
      originalAmount: booking.totalAmount,
      discountAmount: couponDiscount,
      couponCode: couponApplied?.code,
      paymentMethod: paymentData ? "Online Payment" : "Pay at Hotel",
      paymentStatus: paymentData ? "Paid" : "Pending",
      status: "Confirmed",
      userEmail: guestDetails.email,
      userName: guestDetails.fullName,
      userPhone: guestDetails.phone,
      specialRequests: guestDetails.specialRequests,
      upiId: paymentMethod === "upi" ? upiId : "",
      guestName: guestDetails.fullName,
      guestEmail: guestDetails.email,
      guestPhone: guestDetails.phone,
      totalAmount: finalAmount,
      paymentId: paymentData?.paymentId || null,
      orderId: paymentData?.orderId || null
    };
    
    try {
      console.log("📝 Creating booking...", bookingId);
      
      const response = await fetch("http://localhost:5000/api/bookings/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Mark as successfully created
        bookingCreatedRef.current = true;
        hasSubmittedRef.current = true;
        
        const pointsCalc = Math.floor(finalAmount / 100);
        setPointsEarned(pointsCalc);
        
        console.log("✅ Booking created successfully:", bookingId);
        
        return { success: true, bookingId, pointsCalc };
      } else {
        throw new Error(result.msg || "Booking failed");
      }
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      throw error;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Payment Success Handler
  const handlePaymentSuccess = async (paymentData) => {
    console.log("💰 Payment success callback received", paymentData);
    
    // Prevent duplicate processing
    if (hasSubmittedRef.current || bookingCreatedRef.current) {
      console.log("⚠️ Booking already created, ignoring duplicate payment success");
      return;
    }
    
    if (isSubmittingRef.current) {
      console.log("⚠️ Already submitting, ignoring duplicate");
      return;
    }
    
    setProcessing(true);
    
    try {
      const result = await createBooking(paymentData);
      
      if (result && result.success) {
        alert(`✅ Booking confirmed successfully!\n\nBooking ID: ${result.bookingId}\n⭐ Loyalty Points Earned: ${result.pointsCalc} points\n${couponApplied ? `Coupon saved: ₹${couponDiscount}\n` : ''}Confirmation sent to ${guestDetails.email}`);
        navigate("/mybookings");
      } else {
        alert("❌ Booking failed. Please contact support.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong! Please try again.");
    } finally {
      setProcessing(false);
      setShowPaymentGateway(false);
    }
  };

  const handlePaymentError = (error) => {
    console.log("Payment error:", error);
    alert(`Payment failed: ${error}. Please try again or choose another payment method.`);
    setProcessing(false);
    setShowPaymentGateway(false);
  };

  const handleConfirmBooking = async () => {
    console.log("🔘 Confirm booking clicked", { paymentMethod });
    
    // Prevent duplicate clicks
    if (hasSubmittedRef.current || bookingCreatedRef.current) {
      console.log("⚠️ Booking already submitted, ignoring click");
      return;
    }
    
    if (isSubmittingRef.current) {
      console.log("⚠️ Already submitting, ignoring click");
      return;
    }
    
    if (!validateForm()) return;
    
    // If payment method is online, show payment gateway
    if (paymentMethod === "card" || paymentMethod === "upi" || paymentMethod === "netbanking") {
      setShowPaymentGateway(true);
      return;
    }
    
    // Pay at Hotel - direct booking
    setProcessing(true);
    
    try {
      const result = await createBooking();
      
      if (result && result.success) {
        alert(`✅ Booking confirmed successfully!\n\nBooking ID: ${result.bookingId}\n⭐ Loyalty Points Earned: ${result.pointsCalc} points\n${couponApplied ? `Coupon saved: ₹${couponDiscount}\n` : ''}Confirmation sent to ${guestDetails.email}\n💳 Pay at hotel during check-in.`);
        navigate("/mybookings");
      } else {
        alert("❌ Booking failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong! Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const upiApps = [
    { name: "Google Pay", icon: "https://www.gstatic.com/pay/plus_logo.png" },
    { name: "PhonePe", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8kqQ9Q_8qQ_8qQ_8qQ_8qQ_8qQ" },
    { name: "Paytm", icon: "https://www.paytm.com/images/paytm_logo.png" }
  ];

  const potentialPoints = Math.floor(finalAmount / 100);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        
        {showPaymentGateway ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Complete Payment</h2>
                <button onClick={() => setShowPaymentGateway(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <PaymentGateway
                amount={finalAmount}
                bookingData={{
                  hotelId: booking.hotelId,
                  hotelName: booking.hotelName,
                  hotelCity: booking.hotelCity,
                  roomType: booking.roomType,
                  roomPrice: booking.roomPrice,
                  checkIn: booking.checkIn,
                  checkOut: booking.checkOut,
                  guests: booking.guests,
                  nights: booking.nights,
                  amount: finalAmount,
                  originalAmount: booking.totalAmount,
                  discountAmount: couponDiscount,
                  couponCode: couponApplied?.code,
                  userName: guestDetails.fullName,
                  userEmail: guestDetails.email,
                  userPhone: guestDetails.phone,
                  specialRequests: guestDetails.specialRequests,
                }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        ) : null}
        
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center text-sm">1</span>
                Guest Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={guestDetails.fullName}
                    onChange={(e) => setGuestDetails({...guestDetails, fullName: e.target.value})}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={guestDetails.email}
                    onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={guestDetails.phone}
                    onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Special Requests (Optional)</label>
                  <textarea
                    rows="3"
                    value={guestDetails.specialRequests}
                    onChange={(e) => setGuestDetails({...guestDetails, specialRequests: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500"
                    placeholder="Any special requests? (e.g., early check-in, extra bed, etc.)"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center text-sm">2</span>
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="pay_at_hotel" checked={paymentMethod === "pay_at_hotel"} onChange={() => setPaymentMethod("pay_at_hotel")} className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <span className="font-semibold">🏨 Pay at Hotel</span>
                    <p className="text-xs text-gray-500">Pay directly at the hotel during check-in</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="upi" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <span className="font-semibold">📱 UPI</span>
                    <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </label>
                
                {paymentMethod === "upi" && (
                  <div className="ml-8 pl-4 border-l-2 border-yellow-500 space-y-3">
                    <input type="text" placeholder="Enter UPI ID (e.g., name@okhdfcbank)" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full p-3 border rounded-xl" />
                    <button onClick={() => setShowQR(!showQR)} className="text-yellow-600 text-sm font-semibold hover:underline">{showQR ? "Hide QR Code" : "Show QR Code to Pay"}</button>
                    {showQR && (
                      <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <p className="text-sm font-semibold mb-2">Scan QR Code to Pay</p>
                        <div className="flex justify-center gap-4 mb-3">
                          {upiApps.map((app, idx) => <img key={idx} src={app.icon} alt={app.name} className="h-12 w-12 object-contain" />)}
                        </div>
                        <div className="bg-white p-4 rounded-lg inline-block">
                          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                            <span className="text-gray-400 text-center text-xs">UPI QR Code<br/>{upiId || "Enter UPI ID above"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <span className="font-semibold">💳 Credit/Debit Card</span>
                    <p className="text-xs text-gray-500">Visa, MasterCard, RuPay, Amex</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="netbanking" checked={paymentMethod === "netbanking"} onChange={() => setPaymentMethod("netbanking")} className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <span className="font-semibold">🏦 Net Banking</span>
                    <p className="text-xs text-gray-500">All major banks supported</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center text-sm">3</span>
                Booking Summary
              </h2>
              
              {booking.hotelImage && <img src={booking.hotelImage} alt={booking.hotelName} className="w-full h-40 object-cover rounded-xl mb-4" />}
              
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">Hotel:</span><span className="font-semibold">{booking.hotelName}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Room Type:</span><span>{booking.roomType}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Check-in:</span><span>{new Date(booking.checkIn).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Check-out:</span><span>{new Date(booking.checkOut).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Guests:</span><span>{booking.guests} adult(s)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Nights:</span><span>{booking.nights || 1}</span></div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Room charges</span><span>₹{booking.roomTotal || booking.roomPrice * (booking.nights || 1)}</span></div>
                  {booking.breakfastCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Breakfast</span><span>₹{booking.breakfastCost}</span></div>}
                  {booking.tax > 0 && <div className="flex justify-between"><span className="text-gray-600">Taxes & Fees</span><span>₹{Math.round(booking.tax)}</span></div>}
                  {couponApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- ₹{couponDiscount}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount</span>
                      <span className="text-yellow-600">₹{finalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="text-sm font-semibold text-purple-700">Loyalty Points</p>
                      <p className="text-xs text-gray-600">You'll earn {potentialPoints} points on this booking</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">+{potentialPoints}</p>
                    <p className="text-xs text-gray-500">100 points = ₹1</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium mb-2">🎫 Have a coupon code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={couponApplied}
                    className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
                  />
                  {!couponApplied ? (
                    <button
                      onClick={applyCoupon}
                      disabled={couponApplying}
                      className="px-4 py-3 bg-yellow-500 text-black rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-50"
                    >
                      {couponApplying ? "Applying..." : "Apply"}
                    </button>
                  ) : (
                    <button
                      onClick={removeCoupon}
                      className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {couponApplied && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                    ✅ Coupon applied! You saved ₹{couponDiscount}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleConfirmBooking}
                disabled={processing || isSubmittingRef.current || hasSubmittedRef.current}
                className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : (paymentMethod === "pay_at_hotel" ? "Confirm Booking" : "Proceed to Pay")}
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-3">✓ Free cancellation up to 7 days before check-in<br/>⭐ Earn loyalty points on every booking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;