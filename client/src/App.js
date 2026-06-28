// client/src/App.js  — UPDATED
// Changes:
//   1. Added ErrorBoundary around main content
//   2. Added LoyaltyPoints route
//   3. Added /owner/negotiations protection (was unguarded before)
//   4. Added AdminNewsletter route
//   5. Cleaner footer

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';
import OwnerRoute from './components/OwnerRoute';

// Pages
import Home from './Home';
import Hotels from './pages/Hotels';
import HotelDetails from './pages/HotelDetails';
import Login from './pages/login';
import Register from './pages/register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthSuccess from './pages/AuthSuccess';
import AuthCallback from './pages/AuthCallback';
import MyBookings from './pages/MyBookings';
import Checkout from './pages/Checkout';
import Offers from './pages/Offers';
import LoyaltyPoints from './pages/LoyaltyPoints';
import PaymentDetails from './pages/PaymentDetails';

// Owner
import OwnerRegister from './pages/OwnerRegister';
import OwnerPendingApproval from './pages/OwnerPendingApproval';
import OwnerTools from './pages/OwnerTools';
import OwnerHotels from './pages/OwnerHotels';
import OwnerBookings from './pages/OwnerBookings';
import OwnerAnalytics from './pages/OwnerAnalytics';
import OwnerCoupons from './pages/OwnerCoupons';
import OwnerNegotiations from './pages/OwnerNegotiations';

// Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminHotels from './pages/AdminHotels';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import AddHotel from './pages/AddHotel';
import AdminOwnerView from './pages/AdminOwnerView';
import AdminSimulateOwner from './pages/AdminSimulateOwner';
import AdminCoupons from './pages/AdminCoupons';
import AdminNewsletter from './pages/AdminNewsletter';

// Info
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Cancellation from './pages/Cancellation';

// AI
import AITravelAssistant from './components/AITravelAssistant';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {/* Toast notifications */}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

          {/* Floating AI assistant */}
          <AITravelAssistant />

          <Navbar />

          <main>
            {/* ErrorBoundary: prevents a broken page from crashing the whole app */}
            <ErrorBoundary>
              <Routes>
                {/* ── Public ─────────────────────────────────────────── */}
                <Route path="/" element={<Home />} />
                <Route path="/hotels" element={<Hotels />} />
                <Route path="/hotel/:id" element={<HotelDetails />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cancellation" element={<Cancellation />} />

                {/* ── Auth ───────────────────────────────────────────── */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/auth-success" element={<AuthSuccess />} />
                <Route path="/auth-callback" element={<AuthCallback />} />

                {/* ── User (require login — handled inside components) ─ */}
                <Route path="/mybookings" element={<MyBookings />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/:paymentId" element={<PaymentDetails />} />
                <Route path="/loyalty" element={<LoyaltyPoints />} />

                {/* ── Owner ──────────────────────────────────────────── */}
                <Route path="/owner/register" element={<OwnerRegister />} />
                <Route path="/owner/pending-approval" element={<OwnerPendingApproval />} />
                <Route path="/owner/dashboard" element={<OwnerRoute><OwnerTools /></OwnerRoute>} />
                <Route path="/owner/hotels" element={<OwnerRoute><OwnerHotels /></OwnerRoute>} />
                <Route path="/owner/bookings" element={<OwnerRoute><OwnerBookings /></OwnerRoute>} />
                <Route path="/owner/analytics" element={<OwnerRoute><OwnerAnalytics /></OwnerRoute>} />
                <Route path="/owner/coupons" element={<OwnerRoute><OwnerCoupons /></OwnerRoute>} />
                {/* FIXED: was unguarded before */}
                <Route path="/owner/negotiations" element={<OwnerRoute><OwnerNegotiations /></OwnerRoute>} />

                {/* ── Admin ──────────────────────────────────────────── */}
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/hotels" element={<AdminRoute><AdminHotels /></AdminRoute>} />
                <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/add-hotel" element={<AdminRoute><AddHotel /></AdminRoute>} />
                <Route path="/admin/owners" element={<AdminRoute><AdminOwnerView /></AdminRoute>} />
                <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
                <Route path="/admin/newsletter" element={<AdminRoute><AdminNewsletter /></AdminRoute>} />
                <Route path="/admin/simulate-owner" element={<AdminRoute><AdminSimulateOwner /></AdminRoute>} />
              </Routes>
            </ErrorBoundary>
          </main>

          <footer className="bg-white border-t mt-16 py-8">
            <div className="container mx-auto px-4 text-center text-sm text-gray-400 space-y-1">
              <p className="font-medium text-gray-600">Bookora</p>
              <p>Smart hotel booking with AI-powered recommendations and real-time negotiation</p>
              <div className="flex justify-center gap-4 mt-2">
                <a href="/privacy" className="hover:text-blue-500 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-blue-500 transition-colors">Terms</a>
                <a href="/contact" className="hover:text-blue-500 transition-colors">Contact</a>
                <a href="/faq" className="hover:text-blue-500 transition-colors">FAQ</a>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
