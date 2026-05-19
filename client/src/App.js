// client/src/App.js
// UPDATED - Added Forgot Password, Reset Password, and Social Auth routes

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./Home";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthSuccess from "./pages/AuthSuccess";
import AuthCallback from "./pages/AuthCallback";
import MyBookings from "./pages/MyBookings";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHotels from "./pages/AdminHotels";
import AdminBookings from "./pages/AdminBookings";
import AdminUsers from "./pages/AdminUsers";
import AddHotel from "./pages/AddHotel";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerTools from "./pages/OwnerTools";
import OwnerRegister from "./pages/OwnerRegister";
import OwnerHotels from "./pages/OwnerHotels";
import OwnerBookings from './pages/OwnerBookings';
import OwnerAnalytics from './pages/OwnerAnalytics';            
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cancellation from "./pages/Cancellation";
import AdminRoute from "./components/AdminRoute";
import OwnerRoute from "./components/OwnerRoute";
import { AuthProvider } from "./context/AuthContext";
import PaymentDetails from "./pages/PaymentDetails";



import AdminOwnerView from "./pages/AdminOwnerView";
import AdminSimulateOwner from "./pages/AdminSimulateOwner";
import "./App.css";
import AdminCoupons from "./pages/AdminCoupons";
import OwnerCoupons from "./pages/OwnerCoupons";
// AI Components
import AITravelAssistant from './components/AITravelAssistant';
import OwnerNegotiations from './pages/OwnerNegotiations';
import { motion, AnimatePresence } from "framer-motion";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {/* AI Travel Assistant - Floating Button (always available) */}
          <AITravelAssistant />
          
          {/* Navbar */}
          <Navbar />
          
          {/* Main Content */}
          <main>
            <Routes>
              {/* ========== PUBLIC ROUTES ========== */}
              <Route path="/" element={<Home />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/hotel/:id" element={<HotelDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cancellation" element={<Cancellation />} />
              <Route path="/payment/:paymentId" element={<PaymentDetails />} />
              
              {/* ========== AUTHENTICATION ROUTES ========== */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/auth-success" element={<AuthSuccess />} />
              <Route path="/auth-callback" element={<AuthCallback />} />
              
              {/* ========== OWNER ROUTES ========== */}
              <Route path="/owner/negotiations" element={<OwnerNegotiations />} />
              <Route path="/owner/register" element={<OwnerRegister />} />
              <Route path="/owner/dashboard" element={
                <OwnerRoute>
                  <OwnerTools />
                </OwnerRoute>
              } />
              <Route path="/owner/hotels" element={
                <OwnerRoute>
                  <OwnerHotels />
                </OwnerRoute>
              } />
              <Route path="/owner/coupons" element={
                <OwnerRoute>
                  <OwnerCoupons />
                </OwnerRoute>
              } />
              <Route path="/owner/bookings" element={
                <OwnerRoute>
                  <OwnerBookings />
                </OwnerRoute>
              } />
              <Route path="/owner/analytics" element={
                <OwnerRoute>
                  <OwnerAnalytics />
                </OwnerRoute>
              } />

              {/* ========== PROTECTED ROUTES (Require Login) ========== */}
              <Route path="/mybookings" element={<MyBookings />} />
              <Route path="/checkout" element={<Checkout />} />
              
              {/* ========== ADMIN ROUTES ========== */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/hotels" element={
                <AdminRoute>
                  <AdminHotels />
                </AdminRoute>
              } />
              <Route path="/admin/bookings" element={
                <AdminRoute>
                  <AdminBookings />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } />
              <Route path="/admin/add-hotel" element={
                <AdminRoute>
                  <AddHotel />
                </AdminRoute>
              } />
              <Route path="/admin/owners" element={
                <AdminRoute>
                  <AdminOwnerView />
                </AdminRoute>
              } />
              <Route path="/admin/coupons" element={
                <AdminRoute>
                  <AdminCoupons />
                </AdminRoute>
              } />
              <Route path="/admin/simulate-owner" element={
                <AdminRoute>
                  <AdminSimulateOwner />
                </AdminRoute>
              } />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t mt-12 py-6">
            <div className="container mx-auto px-4 text-center text-sm text-gray-500">
              <p>Powered by AI Travel Assistant | Smart recommendations for your perfect stay</p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;