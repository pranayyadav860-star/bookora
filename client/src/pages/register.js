// client/src/pages/register.js - Version 4 (3D Animated)
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle,
  FiCheckCircle, FiPhone, FiGift, FiShield, FiHeart,
  FiGlobe, FiTrendingUp, FiArrowRight, FiStar
} from "react-icons/fi";
import { FaGoogle, FaFacebook, FaApple, FaMicrosoft } from "react-icons/fa";

const DESTINATIONS = [
  { city: "Goa", tag: "from ₹2,499", emoji: "🏖️", from: "from-sky-400", to: "to-cyan-500" },
  { city: "Jaipur", tag: "from ₹1,899", emoji: "🏰", from: "from-rose-500", to: "to-orange-400" },
  { city: "Udaipur", tag: "from ₹3,199", emoji: "🛶", from: "from-indigo-400", to: "to-blue-600" },
  { city: "Munnar", tag: "from ₹2,799", emoji: "🍃", from: "from-emerald-400", to: "to-teal-600" },
  { city: "Manali", tag: "from ₹1,599", emoji: "🏔️", from: "from-slate-400", to: "to-indigo-500" },
  { city: "Varanasi", tag: "from ₹1,299", emoji: "🛕", from: "from-amber-400", to: "to-red-500" },
];

const SOCIAL_PROVIDERS = [
  { key: "google", Icon: FaGoogle },
  { key: "facebook", Icon: FaFacebook },
  { key: "apple", Icon: FaApple },
  { key: "microsoft", Icon: FaMicrosoft },
];

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState("email");
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [verificationToken, setVerificationToken] = useState(""); // NEW: store token after OTP verify

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- Purely visual: 3D tilt for the form card on mouse move ---
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (px - 0.5) * -8, y: (py - 0.5) * 8 });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  // Get referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Real-time validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name) validateName();
      if (formData.email && registrationMethod === "email") validateEmail();
      if (formData.phone && registrationMethod === "phone") validatePhone();
      if (formData.password) validatePassword();
      if (formData.confirmPassword) validateConfirmPassword();
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.name, formData.email, formData.phone, formData.password, formData.confirmPassword, registrationMethod]);

  const validateName = () => {
    if (!formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: "Full name is required" }));
    } else if (formData.name.length < 2) {
      setErrors(prev => ({ ...prev, name: "Name must be at least 2 characters" }));
    } else {
      setErrors(prev => ({ ...prev, name: "" }));
    }
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
    } else if (!emailRegex.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const validatePhone = () => {
    const phoneRegex = /^\d{10}$/;
    if (!formData.phone) {
      setErrors(prev => ({ ...prev, phone: "Phone number is required" }));
    } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setErrors(prev => ({ ...prev, phone: "Please enter a valid 10-digit phone number" }));
    } else {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
  };

  const validatePassword = () => {
    if (!formData.password) {
      setErrors(prev => ({ ...prev, password: "Password is required" }));
    } else if (formData.password.length < 6) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 6 characters" }));
    } else {
      // Optional: add more rules, but backend may not require uppercase/number
      // We'll keep them as suggestions only, not blocking
      setErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const validateConfirmPassword = () => {
    if (!formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Please confirm your password" }));
    } else if (formData.confirmPassword !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password) return 0;
    let strength = 0;
    if (formData.password.length >= 6) strength++;
    if (formData.password.length >= 10) strength++;
    if (/(?=.*[A-Z])/.test(formData.password)) strength++;
    if (/(?=.*[0-9])/.test(formData.password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(formData.password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength <= 2) return { text: "Weak", color: "text-red-500" };
    if (strength <= 3) return { text: "Fair", color: "text-yellow-500" };
    if (strength <= 4) return { text: "Good", color: "text-blue-500" };
    return { text: "Strong", color: "text-green-500" };
  };

  const handleSendOTP = async () => {
    if (registrationMethod === "email" && errors.email) return;
    if (registrationMethod === "phone" && errors.phone) return;
    setLoading(true);
    setOtpError("");
    try {
      const requestBody = registrationMethod === "phone"
        ? { phone: formData.phone.trim() }
        : { email: formData.email.trim() };
      const response = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setCountdown(60);
      } else {
        setOtpError(data.msg || data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      setOtpError("Please enter OTP");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      const requestBody = registrationMethod === "phone"
        ? { phone: formData.phone.trim(), otp: otpCode }
        : { email: formData.email.trim(), otp: otpCode };
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      if (response.ok) {
        // Store verification token returned by backend
        // Adjust field name according to your API: could be 'verificationToken', 'token', 'verifyToken'
        const token = data.verificationToken || data.token || data.verifyToken;
        if (!token) {
          console.warn("No verification token received from /verify-otp");
        }
        setVerificationToken(token);
        setCurrentStep(2);
      } else {
        setOtpError(data.msg || data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validateName();
    if (registrationMethod === "email") validateEmail();
    else validatePhone();
    validatePassword();
    validateConfirmPassword();

    if (!agreeToTerms) {
      setErrors(prev => ({ ...prev, terms: "You must agree to the terms and conditions" }));
      return;
    }

    // Check if there are any errors
    if (errors.name || errors[registrationMethod] || errors.password || errors.confirmPassword) {
      return;
    }

    // Require verification token
    if (!verificationToken) {
      setErrors({ general: "Verification required. Please go back and verify your email/phone." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Build payload - only include fields that are needed and not undefined
      const requestBody = {
        name: formData.name,
        password: formData.password,
        verificationToken: verificationToken, // crucial!
      };

      if (registrationMethod === "email") {
        requestBody.email = formData.email;
        // Include phone if provided (optional)
        if (formData.phone) requestBody.phone = formData.phone;
      } else {
        // Phone registration: send phone number, no email (unless backend requires both)
        requestBody.phone = formData.phone;
        // If your backend still wants an email, you could ask user in step 3, but better to avoid.
        // For now, we omit email to prevent fake email rejection.
      }

      if (referralCode) requestBody.referralCode = referralCode;

      // Remove any undefined properties
      Object.keys(requestBody).forEach(key =>
        requestBody[key] === undefined && delete requestBody[key]
      );

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate("/", { replace: true });
      } else {
        // Show detailed server error
        const errorMsg = data.msg || data.message || data.error || "Registration failed";
        setErrors({ general: errorMsg });
        console.error("Registration error details:", data);
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: "Server error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  const passwordStrength = getPasswordStrengthText();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b18] flex items-center justify-center p-4 py-10 font-sans">
      {/* Styles for the 3D scene, ambient blobs and micro-interactions */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');

        .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }

        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -36px) scale(1.08); }
        }
        .blob-bg { position: absolute; border-radius: 9999px; filter: blur(70px); pointer-events: none; }
        .blob-a { width: 360px; height: 360px; left: -120px; top: -120px; background: radial-gradient(circle, rgba(255,107,91,0.55), transparent 70%); animation: floatBlob 19s ease-in-out infinite; }
        .blob-b { width: 320px; height: 320px; right: -100px; bottom: -100px; background: radial-gradient(circle, rgba(45,212,191,0.45), transparent 70%); animation: floatBlob 23s ease-in-out infinite reverse; }
        .blob-c { width: 260px; height: 260px; right: 6%; top: 28%; background: radial-gradient(circle, rgba(139,124,246,0.4), transparent 70%); animation: floatBlob 27s ease-in-out infinite; }

        @keyframes spinOrbit {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        .orbit-stage { perspective: 1300px; }
        .orbit-group { transform-style: preserve-3d; animation: spinOrbit 28s linear infinite; }
        .orbit-card {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          transform: rotateY(var(--ry)) translateZ(160px);
        }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes flipIn {
          from { opacity: 0; transform: rotateX(-70deg); }
          to { opacity: 1; transform: rotateX(0deg); }
        }
        .field-flip { animation: flipIn 0.4s ease; transform-style: preserve-3d; transform-origin: top center; }

        .tilt-card { transition: transform 0.2s ease-out; transform-style: preserve-3d; }

        @media (prefers-reduced-motion: reduce) {
          .orbit-group, .blob-a, .blob-b, .blob-c, .field-flip,
          [class*="animate-"] { animation: none !important; }
          .tilt-card { transition: none !important; }
        }
      `}</style>

      {/* Ambient background blobs */}
      <div className="blob-bg blob-a" />
      <div className="blob-bg blob-b" />
      <div className="blob-bg blob-c" />

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-black/40 overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT PANEL - Brand & 3D destination carousel */}
        <div className="lg:w-1/2 relative overflow-hidden p-8 md:p-10 flex flex-col bg-gradient-to-br from-[#171c3a] via-[#11152c] to-[#0b0f1f]">
          <div className="relative z-10 flex flex-col h-full">

            {/* CUSTOM BOOKORA LOGO */}
            <Link to="/" className="flex items-center gap-3 group mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-60 group-hover:opacity-100 transition duration-500 rounded-2xl"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition duration-300">
                  <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6z" opacity="0.3"/>
                    <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
                  </svg>
                  <FiStar className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" />
                </div>
              </div>
              <div className="leading-tight">
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent font-display">
                  BOOKORA
                </h1>
                <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-medium">Luxury Stays</p>
              </div>
            </Link>

            <h2 className="font-display text-3xl font-semibold text-white leading-tight mb-3">
              Join thousands of<br />happy travelers.
            </h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Create your free account in under 2 minutes and unlock exclusive member deals across India.
            </p>

            {/* Benefits list */}
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B5B] to-[#FFC857] flex items-center justify-center flex-shrink-0 shadow-md">
                  <FiGift size={14} className="text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">₹500 welcome bonus</p>
                  <p className="text-xs text-slate-400">Credited instantly on sign-up</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FiShield size={14} className="text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Verified & secure</p>
                  <p className="text-xs text-slate-400">OTP-verified accounts only</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FiHeart size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Save & revisit</p>
                  <p className="text-xs text-slate-400">Wishlist stays across 100+ cities</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FiTrendingUp size={14} className="text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Member-only pricing</p>
                  <p className="text-xs text-slate-400">Up to 30% off on every booking</p>
                </div>
              </div>
            </div>

            {/* Trusted by count */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["🧑‍💼","👩‍💻","🧑‍🎓","👩‍🍳"].map((e, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm">{e}</div>
                ))}
              </div>
              <p className="text-xs text-slate-400"><span className="text-white font-semibold">50,000+</span> travelers joined this month</p>
            </div>

            <div className="pt-5 mt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <FiShield size={13} className="text-[#5EEAD4]" />
                Secure sign-up · 24/7 support
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Registration Form */}
        <div className="lg:w-1/2 p-6 md:p-10 lg:p-12 flex items-center justify-center bg-[#0d1224]">
          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={resetTilt}
            style={{ transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
            className="tilt-card w-full max-w-sm rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-black/40"
          >
            <div className="text-center mb-6">
              <h3 className="font-display text-2xl font-semibold text-white">Create account</h3>
              <p className="text-slate-400 text-sm mt-1">Get started in minutes</p>
            </div>

            {/* Referral Banner */}
            {referralCode && (
              <div className="mb-5 p-3 bg-[#FFC857]/10 border border-[#FFC857]/30 rounded-xl flex items-center gap-2">
                <FiGift className="text-[#FFC857] flex-shrink-0" size={16} />
                <p className="text-[#FFD98A] text-sm font-medium">Referral code applied! Get ₹500 bonus.</p>
              </div>
            )}

            {/* Step Indicator */}
            <div className="flex justify-center gap-2 mb-6">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-gradient-to-r from-[#FF6B5B] to-[#FFC857] w-8' : 'bg-white/10 w-2'}`}></div>
              <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-[#FF6B5B] to-[#FFC857] w-8' : 'bg-white/10 w-2'}`}></div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                <FiAlertCircle className="text-red-400 flex-shrink-0" size={16} />
                <p className="text-red-300 text-sm">{errors.general}</p>
              </div>
            )}

            {currentStep === 1 ? (
              /* Step 1: Email/Phone Verification */
              <div className="field-flip space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full name *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <FiUser size={16} />
                    </span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857]/60 focus:-translate-y-0.5 transition-all ${
                        errors.name ? "border-red-400/60" : "border-white/10"
                      }`}
                      placeholder="Enter your name"
                    />
                  </div>
                  {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                </div>

                {/* Registration Method Toggle */}
                <div className="relative flex bg-white/5 border border-white/10 rounded-2xl p-1">
                  <span
                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#FFC857] shadow-lg shadow-orange-500/20 transition-transform duration-300 ${
                      registrationMethod === "phone" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setRegistrationMethod("email")}
                    className={`relative z-10 flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      registrationMethod === "email" ? "text-[#1a1a2e]" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <FiMail className="inline mr-1.5 -mt-0.5" size={14} />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationMethod("phone")}
                    className={`relative z-10 flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      registrationMethod === "phone" ? "text-[#1a1a2e]" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <FiPhone className="inline mr-1.5 -mt-0.5" size={14} />
                    Phone
                  </button>
                </div>

                {/* Email or Phone Field */}
                <div key={registrationMethod} className="field-flip">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {registrationMethod === "email" ? "Email address *" : "Phone number *"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      {registrationMethod === "email" ? <FiMail size={16} /> : <FiPhone size={16} />}
                    </span>
                    <input
                      type={registrationMethod === "email" ? "email" : "tel"}
                      value={registrationMethod === "email" ? formData.email : formData.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [registrationMethod === "email" ? "email" : "phone"]: e.target.value
                      }))}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857]/60 focus:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors[registrationMethod] ? "border-red-400/60" : "border-white/10"
                      }`}
                      placeholder={registrationMethod === "email" ? "you@example.com" : "Enter your phone number"}
                      disabled={otpSent}
                    />
                  </div>
                  {errors[registrationMethod] && <p className="mt-1.5 text-xs text-red-400">{errors[registrationMethod]}</p>}
                </div>

                {/* OTP Section */}
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || !formData.name || (registrationMethod === "email" ? !formData.email : !formData.phone)}
                    className="w-full py-3 rounded-xl font-semibold text-[#1a1a2e] bg-gradient-to-r from-[#FF6B5B] to-[#FFC857] shadow-[0_6px_0_0_#c2483a] hover:shadow-[0_4px_0_0_#c2483a] hover:translate-y-0.5 active:shadow-[0_1px_0_0_#c2483a] active:translate-y-[5px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_#c2483a]"
                  >
                    {loading ? "Sending..." : "Send verification code"}
                  </button>
                ) : (
                  <div className="field-flip space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857]/60 text-center text-xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    {otpError && <p className="text-xs text-red-400">{otpError}</p>}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={loading || !otpCode}
                        className="flex-1 py-3 rounded-xl font-semibold text-[#04231f] bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_6px_0_0_#0f766e] hover:shadow-[0_4px_0_0_#0f766e] hover:translate-y-0.5 active:shadow-[0_1px_0_0_#0f766e] active:translate-y-[5px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_#0f766e]"
                      >
                        {loading ? "Verifying..." : "Verify & continue"}
                      </button>
                      {countdown === 0 ? (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          className="py-3 px-4 text-[#FFC857] font-medium hover:text-[#FFD98A] transition"
                        >
                          Resend
                        </button>
                      ) : (
                        <span className="py-3 px-4 text-slate-500">Resend in {countdown}s</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Password & Terms */
              <form onSubmit={handleSubmit} className="field-flip space-y-5">
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <FiLock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857]/60 focus:-translate-y-0.5 transition-all ${
                        errors.password ? "border-red-400/60" : "border-white/10"
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all ${
                              level <= getPasswordStrength()
                                ? passwordStrength.color.replace('text', 'bg')
                                : 'bg-white/10'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength.color}`}>
                        Password strength: {passwordStrength.text}
                      </p>
                      <ul className="text-xs text-slate-400 mt-1.5 space-y-1">
                        <li className={`flex items-center gap-1.5 ${formData.password.length >= 6 ? "text-emerald-400" : ""}`}>
                          <FiCheckCircle size={12} className={formData.password.length >= 6 ? "text-emerald-400" : "text-slate-500"} />
                          At least 6 characters
                        </li>
                        <li className={`flex items-center gap-1.5 ${/(?=.*[A-Z])/.test(formData.password) ? "text-emerald-400" : ""}`}>
                          <FiCheckCircle size={12} className={/(?=.*[A-Z])/.test(formData.password) ? "text-emerald-400" : "text-slate-500"} />
                          Uppercase letter (recommended)
                        </li>
                        <li className={`flex items-center gap-1.5 ${/(?=.*[0-9])/.test(formData.password) ? "text-emerald-400" : ""}`}>
                          <FiCheckCircle size={12} className={/(?=.*[0-9])/.test(formData.password) ? "text-emerald-400" : "text-slate-500"} />
                          Number (recommended)
                        </li>
                      </ul>
                    </div>
                  )}
                  {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Confirm password *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <FiLock size={16} />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857]/60 focus:-translate-y-0.5 transition-all ${
                        errors.confirmPassword ? "border-red-400/60" : "border-white/10"
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[#FF6B5B] focus:ring-[#FF6B5B]/40"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-400">
                    I agree to the{" "}
                    <Link to="/terms" className="text-[#FFC857] hover:text-[#FFD98A] hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-[#FFC857] hover:text-[#FFD98A] hover:underline">Privacy Policy</Link>
                  </label>
                </div>
                {errors.terms && <p className="text-xs text-red-400">{errors.terms}</p>}

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-[#1a1a2e] bg-gradient-to-r from-[#FF6B5B] to-[#FFC857] shadow-[0_6px_0_0_#c2483a] hover:shadow-[0_4px_0_0_#c2483a] hover:translate-y-0.5 active:shadow-[0_1px_0_0_#c2483a] active:translate-y-[5px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_#c2483a]"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#0d1224] text-slate-500">or sign up with</span>
                  </div>
                </div>

                {/* Social Register */}
                <div className="grid grid-cols-4 gap-3">
                  {SOCIAL_PROVIDERS.map(({ key, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSocialRegister(key)}
                      className="flex items-center justify-center p-2.5 border border-white/10 bg-white/5 rounded-xl text-slate-300 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 transition-all duration-200"
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              </form>
            )}

            {/* Login Link */}
            <p className="text-center text-sm text-slate-400 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-[#FFC857] hover:text-[#FFD98A] font-medium inline-flex items-center gap-1">
                Sign in <FiArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;