// client/src/pages/register.js - Version 3 (Fixed 400 Error)
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, 
  FiCheckCircle, FiPhone, FiGift, FiShield, FiHeart,
  FiGlobe, FiTrendingUp, FiArrowRight
} from "react-icons/fi";
import { FaGoogle, FaFacebook, FaApple, FaMicrosoft } from "react-icons/fa";

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-teal-50/40 flex items-center justify-center p-4">
      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT PANEL - Brand & Features */}
        <div className="md:w-2/5 bg-gradient-to-br from-rose-100 to-amber-50 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <span className="text-rose-500 font-bold text-lg">B</span>
              </div>
              <span className="font-semibold text-gray-700">Bookora</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Join us today</h2>
            <p className="text-gray-600 text-sm mb-8">Create your account and start your journey</p>
            
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
        
        {/* RIGHT PANEL - Registration Form */}
        <div className="md:w-3/5 p-8 md:p-10">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Create account</h3>
              <p className="text-gray-500 text-sm">Get started in minutes</p>
            </div>

            {/* Referral Banner */}
            {referralCode && (
              <div className="mb-5 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
                <FiGift className="text-rose-500 flex-shrink-0" size={16} />
                <p className="text-rose-700 text-sm font-medium">Referral code applied! Get ₹500 bonus.</p>
              </div>
            )}

            {/* Step Indicator */}
            <div className="flex justify-center gap-2 mb-6">
              <div className={`h-1.5 rounded-full transition-all ${currentStep >= 1 ? 'bg-rose-500 w-6' : 'bg-gray-200 w-2'}`}></div>
              <div className={`h-1.5 rounded-full transition-all ${currentStep >= 2 ? 'bg-rose-500 w-6' : 'bg-gray-200 w-2'}`}></div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <FiAlertCircle className="text-red-500 flex-shrink-0" size={16} />
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {currentStep === 1 ? (
              /* Step 1: Email/Phone Verification */
              <div className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                      errors.name ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="Enter your name"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Registration Method Toggle */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRegistrationMethod("email")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      registrationMethod === "email" 
                        ? "bg-white text-rose-500 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FiMail className="inline mr-1.5" size={14} />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationMethod("phone")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      registrationMethod === "phone" 
                        ? "bg-white text-rose-500 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FiPhone className="inline mr-1.5" size={14} />
                    Phone
                  </button>
                </div>

                {/* Email or Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {registrationMethod === "email" ? "Email address *" : "Phone number *"}
                  </label>
                  <input
                    type={registrationMethod === "email" ? "email" : "tel"}
                    value={registrationMethod === "email" ? formData.email : formData.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [registrationMethod === "email" ? "email" : "phone"]: e.target.value
                    }))}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                      errors[registrationMethod] ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder={registrationMethod === "email" ? "Enter your email" : "Enter your phone number"}
                    disabled={otpSent}
                  />
                  {errors[registrationMethod] && <p className="mt-1 text-xs text-red-500">{errors[registrationMethod]}</p>}
                </div>

                {/* OTP Section */}
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || !formData.name || (registrationMethod === "email" ? !formData.email : !formData.phone)}
                    className="w-full py-2.5 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition disabled:opacity-60 shadow-sm"
                  >
                    {loading ? "Sending..." : "Send verification code"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-center text-xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    {otpError && <p className="text-xs text-red-500">{otpError}</p>}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={loading || !otpCode}
                        className="flex-1 py-2.5 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition disabled:opacity-60"
                      >
                        {loading ? "Verifying..." : "Verify & continue"}
                      </button>
                      {countdown === 0 ? (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          className="py-2.5 px-4 text-rose-500 font-medium hover:text-rose-600"
                        >
                          Resend
                        </button>
                      ) : (
                        <span className="py-2.5 px-4 text-gray-400">Resend in {countdown}s</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Password & Terms */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                        errors.password ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                                : 'bg-gray-200'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength.color}`}>
                        Password strength: {passwordStrength.text}
                      </p>
                      <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <li className={formData.password.length >= 6 ? "text-green-500" : ""}>
                          ✓ At least 6 characters
                        </li>
                        <li className={/(?=.*[A-Z])/.test(formData.password) ? "text-green-500" : "text-gray-400"}>
                          ✓ Uppercase letter (recommended)
                        </li>
                        <li className={/(?=.*[0-9])/.test(formData.password) ? "text-green-500" : "text-gray-400"}>
                          ✓ Number (recommended)
                        </li>
                      </ul>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                        errors.confirmPassword ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link to="/terms" className="text-rose-500 hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-rose-500 hover:underline">Privacy Policy</Link>
                  </label>
                </div>
                {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition shadow-sm disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">or sign up with</span>
                  </div>
                </div>

                {/* Social Register */}
                <div className="grid grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("google")}
                    className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
                  >
                    <FaGoogle size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("facebook")}
                    className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
                  >
                    <FaFacebook size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("apple")}
                    className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
                  >
                    <FaApple size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("microsoft")}
                    className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 hover:text-rose-500"
                  >
                    <FaMicrosoft size={20} />
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-rose-500 hover:text-rose-600 font-medium inline-flex items-center gap-1">
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