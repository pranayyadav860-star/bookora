// client/src/pages/login.js - Version 3 (3D Animated)
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiAlertCircle,
  FiShield, FiCompass, FiGlobe, FiTrendingUp, FiArrowRight, FiStar
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

function Login() {
  const [loginMethod, setLoginMethod] = useState("email");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Purely visual: 3D tilt for the sign-in card on mouse move ---
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (px - 0.5) * -10, y: (py - 0.5) * 10 });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  // Load saved credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    let newErrors = {};

    if (loginMethod === "email") {
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    } else {
      if (!formData.phone) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = "Please enter a valid 10-digit phone number";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const identifier = loginMethod === "email" ? formData.email : formData.phone;

      const response = await fetch("https://bookora-server-22ox.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          password: formData.password,
          loginMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe && loginMethod === "email") {
          localStorage.setItem("rememberedEmail", formData.email);
        } else if (!rememberMe) {
          localStorage.removeItem("rememberedEmail");
        }

        login(data.token, data.user);
        navigate("/");
      } else {
        setErrors({ general: data.msg || "Invalid credentials. Please try again." });
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setErrors({ general: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `https://bookora-server-22ox.onrender.com/api/auth/${provider}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b18] flex items-center justify-center p-4 font-sans">
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
              Welcome back,<br />traveler.
            </h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Sign in to pick up where your last trip left off — your saved stays across India are waiting.
            </p>

            {/* 3D orbiting destination cards */}
            <div className="orbit-stage flex-1 flex items-center justify-center min-h-[220px] my-6">
              <div className="orbit-group relative w-36 h-24">
                {DESTINATIONS.map((d, i) => (
                  <div
                    key={d.city}
                    className={`orbit-card rounded-2xl bg-gradient-to-br ${d.from} ${d.to} p-3 flex flex-col justify-between border border-white/10 shadow-xl shadow-black/30`}
                    style={{ "--ry": `${i * 60}deg` }}
                  >
                    <span className="text-2xl leading-none">{d.emoji}</span>
                    <div>
                      <p className="text-white text-sm font-semibold leading-tight">{d.city}</p>
                      <p className="text-white/70 text-xs">{d.tag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating feature chips */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center animate-[floatY_6s_ease-in-out_infinite]">
                <FiCompass className="mx-auto mb-1 text-[#FF8E78]" size={16} />
                <p className="text-[11px] text-slate-300">Curated stays</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center animate-[floatY_6s_ease-in-out_infinite] [animation-delay:0.8s]">
                <FiGlobe className="mx-auto mb-1 text-[#5EEAD4]" size={16} />
                <p className="text-[11px] text-slate-300">100+ Indian cities</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center animate-[floatY_6s_ease-in-out_infinite] [animation-delay:1.6s]">
                <FiTrendingUp className="mx-auto mb-1 text-[#C4B5FD]" size={16} />
                <p className="text-[11px] text-slate-300">Best price</p>
              </div>
            </div>

            <div className="pt-5 border-t border-white/10">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <FiShield size={13} className="text-[#5EEAD4]" />
                Secure sign-in · 24/7 support
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="lg:w-1/2 p-6 md:p-10 lg:p-12 flex items-center justify-center bg-[#0d1224]">
          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={resetTilt}
            style={{ transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
            className="tilt-card w-full max-w-sm rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-black/40"
          >
            <div className="text-center mb-6">
              <h3 className="font-display text-2xl font-semibold text-white">Sign in</h3>
              <p className="text-slate-400 text-sm mt-1">Access your account</p>
            </div>

            {/* Login Method Toggle */}
            <div className="relative flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-6">
              <span
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#FFC857] shadow-lg shadow-orange-500/20 transition-transform duration-300 ${
                  loginMethod === "phone" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                }`}
              />
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`relative z-10 flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  loginMethod === "email" ? "text-[#1a1a2e]" : "text-slate-300 hover:text-white"
                }`}
              >
                <FiMail className="inline mr-1.5 -mt-0.5" size={14} />
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`relative z-10 flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  loginMethod === "phone" ? "text-[#1a1a2e]" : "text-slate-300 hover:text-white"
                }`}
              >
                <FiPhone className="inline mr-1.5 -mt-0.5" size={14} />
                Phone
              </button>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                <FiAlertCircle className="text-red-400 flex-shrink-0" size={16} />
                <p className="text-red-300 text-sm">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email/Phone Field */}
              <div key={loginMethod} className="field-flip">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {loginMethod === "email" ? "Email address" : "Phone number"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    {loginMethod === "email" ? <FiMail size={16} /> : <FiPhone size={16} />}
                  </span>
                  <input
                    type={loginMethod === "email" ? "email" : "tel"}
                    value={loginMethod === "email" ? formData.email : formData.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [loginMethod === "email" ? "email" : "phone"]: e.target.value
                    }))}
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857]/60 focus:-translate-y-0.5 transition-all ${
                      errors[loginMethod === "email" ? "email" : "phone"]
                        ? "border-red-400/60"
                        : "border-white/10"
                    }`}
                    placeholder={loginMethod === "email" ? "you@example.com" : "Enter your phone number"}
                  />
                </div>
                {errors[loginMethod === "email" ? "email" : "phone"] && (
                  <p className="mt-1.5 text-xs text-red-400">{errors[loginMethod === "email" ? "email" : "phone"]}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
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
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#FF6B5B] focus:ring-[#FF6B5B]/40"
                  />
                  <span className="text-sm text-slate-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-[#FFC857] hover:text-[#FFD98A]">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button - 3D pressable */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-[#1a1a2e] bg-gradient-to-r from-[#FF6B5B] to-[#FFC857] shadow-[0_6px_0_0_#c2483a] hover:shadow-[0_4px_0_0_#c2483a] hover:translate-y-0.5 active:shadow-[0_1px_0_0_#c2483a] active:translate-y-[5px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_#c2483a]"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#0d1224] text-slate-500">or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {SOCIAL_PROVIDERS.map(({ key, Icon }) => (
                <button
                  key={key}
                  onClick={() => handleSocialLogin(key)}
                  className="flex items-center justify-center p-2.5 border border-white/10 bg-white/5 rounded-xl text-slate-300 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 transition-all duration-200"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-slate-400">
              New to Bookora?{" "}
              <Link to="/register" className="text-[#FFC857] hover:text-[#FFD98A] font-medium inline-flex items-center gap-1">
                Create account <FiArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;