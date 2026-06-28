// client/src/pages/OwnerRegister.js
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OwnerRegister() {
  // ---------- OTP & verification state (your exact snippet) ----------
  const [registrationMethod, setRegistrationMethod] = useState("email"); // "email" or "phone"
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [verificationToken, setVerificationToken] = useState(null);
  
  // ---------- Multi-step form state ----------
  const [step, setStep] = useState(1); // 1: details+sendOTP, 2: verifyOTP, 3: documents
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    gstin: "",
    addressProof: null,
    idProof: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // ---------- Helper: field validation (local to step1) ----------
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Full name is required";
    if (registrationMethod === "email") {
      if (!formData.email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    } else {
      if (!formData.phone) newErrors.phone = "Phone number is required";
      else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, '')))
        newErrors.phone = "10-digit phone number required";
    }
    if (!formData.password) newErrors.password = "Password required";
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Your exact handleSendOTP (with minor adaption) ----------
  const handleSendOTP = async () => {
    if (registrationMethod === "email" && errors.email) return;
    if (registrationMethod === "phone" && errors.phone) return;
    if (!validateStep1()) return;

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
        // move to OTP verification step
        setStep(2);
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

  // ---------- Your exact handleVerifyOTP ----------
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
        const token = data.verificationToken || data.token || data.verifyToken;
        if (!token) {
          console.warn("No verification token received from /verify-otp");
        }
        setVerificationToken(token);
        setStep(3); // proceed to document upload
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

  // ---------- Document upload & final submission ----------
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files[0] }));
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idProof || !formData.addressProof) {
      setGeneralError("Please upload both ID proof and address proof");
      return;
    }
    setLoading(true);
    setGeneralError("");

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("email", formData.email);
    fd.append("phone", formData.phone);
    fd.append("password", formData.password);
    fd.append("businessName", formData.businessName || "");
    fd.append("gstin", formData.gstin || "");
    fd.append("idProof", formData.idProof);
    fd.append("addressProof", formData.addressProof);
    // send verification token (header or body)
    fd.append("verificationToken", verificationToken);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register-owner-secure", {
        method: "POST",
        body: fd, // multipart/form-data
      });
      const data = await response.json();
      
      if (response.ok) {
        // auto-login or redirect to pending approval page
        if (data.token && data.user) login(data.token, data.user);
        navigate("/owner/pending-approval");
      } else {
        setGeneralError(data.msg || "Registration failed");
      }
    } catch (err) {
      setGeneralError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render different steps ----------
  const renderStep = () => {
    if (step === 1) {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-2">Hotel Owner Registration</h2>
          <p className="text-gray-600 mb-4">Step 1: Basic Details</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Register with</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRegistrationMethod("email")}
                className={`px-4 py-2 rounded ${registrationMethod === "email" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMethod("phone")}
                className={`px-4 py-2 rounded ${registrationMethod === "phone" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                Phone
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <input name="name" placeholder="Full Name *" onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            
            {registrationMethod === "email" && (
              <>
                <input name="email" type="email" placeholder="Email *" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </>
            )}
            {registrationMethod === "phone" && (
              <>
                <input name="phone" placeholder="Phone Number (10 digits) *" onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded" />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
              </>
            )}

            <input name="businessName" placeholder="Business / Hotel Name" onChange={(e) => setFormData({...formData, businessName: e.target.value})} className="w-full p-2 border rounded" />
            <input name="gstin" placeholder="GSTIN (if any)" onChange={(e) => setFormData({...formData, gstin: e.target.value})} className="w-full p-2 border rounded" />
            
            <input name="password" type="password" placeholder="Password (min 6 chars) *" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded" />
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            
            <input name="confirmPassword" type="password" placeholder="Confirm Password *" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full p-2 border rounded" />
            {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
            
            <button onClick={handleSendOTP} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded mt-2">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <h2 className="text-xl font-bold">Verify your {registrationMethod}</h2>
          <p className="text-gray-600 mb-2">OTP sent to {registrationMethod === "email" ? formData.email : formData.phone}</p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            className="w-full p-2 border rounded my-3"
          />
          <button onClick={handleVerifyOTP} disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          {otpError && <p className="text-red-500 text-sm mt-2">{otpError}</p>}
          {countdown > 0 && (
            <p className="text-center text-sm text-gray-500 mt-3">Resend in {countdown}s</p>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <form onSubmit={handleFinalSubmit}>
          <h2 className="text-xl font-bold">Upload Documents</h2>
          <p className="text-gray-600 text-sm mb-3">Please upload ID proof (PAN/Aadhar) and address proof (utility bill/rent agreement).</p>
          
          <label className="block mb-2 font-medium">ID Proof (Image/PDF) *</label>
          <input type="file" name="idProof" onChange={handleFileChange} accept="image/*,application/pdf" required className="mb-4" />
          
          <label className="block mb-2 font-medium">Address Proof (Image/PDF) *</label>
          <input type="file" name="addressProof" onChange={handleFileChange} accept="image/*,application/pdf" required className="mb-4" />
          
          {generalError && <p className="text-red-500 text-sm mb-3">{generalError}</p>}
          
          <button type="submit" disabled={loading} className="w-full bg-yellow-600 text-white py-2 rounded">
            {loading ? "Submitting..." : "Submit for Admin Review"}
          </button>
        </form>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {renderStep()}
        <div className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-yellow-600">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default OwnerRegister;