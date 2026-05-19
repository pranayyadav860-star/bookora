// client/src/pages/login.js - Version 2 (Minimal & Airy)
import { useState, useEffect } from "react";
import { Link, useNavigate ,useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, 
  FiShield, FiHeart, FiGlobe, FiTrendingUp, FiArrowRight
} from "react-icons/fi";
import { FaGoogle, FaFacebook, FaApple, FaMicrosoft } from "react-icons/fa";

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

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
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
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-teal-50/40 flex items-center justify-center p-4">
      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT PANEL - Brand & Features (Soft pastel background) */}
        <div className="md:w-2/5 bg-gradient-to-br from-rose-100 to-amber-50 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <span className="text-rose-500 font-bold text-lg">B</span>
              </div>
              <span className="font-semibold text-gray-700">Bookora</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h2>
            <p className="text-gray-600 text-sm mb-8">Sign in to continue your journey</p>
            
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiHeart className="text-rose-500 text-xs" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Personalized stays</h4>
                  <p className="text-xs text-gray-500">Handpicked just for you</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiGlobe className="text-rose-500 text-xs" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">10,000+ destinations</h4>
                  <p className="text-xs text-gray-500">Global coverage</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiTrendingUp className="text-rose-500 text-xs" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Best price guaranteed</h4>
                  <p className="text-xs text-gray-500">Price match promise</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/40">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FiShield size={12} />
              Secure booking · 24/7 support
            </p>
          </div>
        </div>
        
        {/* RIGHT PANEL - Login Form */}
        <div className="md:w-3/5 p-8 md:p-10">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Sign in</h3>
              <p className="text-gray-500 text-sm">Access your account</p>
            </div>
            
            {/* Login Method Toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  loginMethod === "email" 
                    ? "bg-white text-rose-500 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiMail className="inline mr-1.5" size={14} />
                Email
              </button>
              <button
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  loginMethod === "phone" 
                    ? "bg-white text-rose-500 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiMail className="inline mr-1.5" size={14} />
                Phone
              </button>
            </div>
            
            {/* General Error */}
            {errors.general && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <FiAlertCircle className="text-red-500 flex-shrink-0" size={16} />
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email/Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {loginMethod === "email" ? "Email address" : "Phone number"}
                </label>
                <input
                  type={loginMethod === "email" ? "email" : "tel"}
                  value={loginMethod === "email" ? formData.email : formData.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [loginMethod === "email" ? "email" : "phone"]: e.target.value
                  }))}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                    errors[loginMethod === "email" ? "email" : "phone"]
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                  placeholder={loginMethod === "email" ? "Enter your email" : "Enter your phone number"}
                />
                {errors[loginMethod === "email" ? "email" : "phone"] && (
                  <p className="mt-1 text-xs text-red-500">{errors[loginMethod === "email" ? "email" : "phone"]}</p>
                )}
              </div>
              
              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                      errors.password ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>
              
              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-rose-500 hover:text-rose-600">
                  Forgot password?
                </Link>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition shadow-sm disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400">or</span>
              </div>
            </div>
            
            {/* Social Login */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
              >
                <FaGoogle size={20} />
              </button>
              <button
                onClick={() => handleSocialLogin("facebook")}
                className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
              >
                <FaFacebook size={20} />
              </button>
              <button
                onClick={() => handleSocialLogin("apple")}
                className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
              >
                <FaApple size={20} />
              </button>
              <button
                onClick={() => handleSocialLogin("microsoft")}
                className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
              >
                <FaMicrosoft size={20} />
              </button>
            </div>
            
            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-500">
              New to Bookora?{" "}
              <Link to="/register" className="text-rose-500 hover:text-rose-600 font-medium inline-flex items-center gap-1">
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