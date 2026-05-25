// client/src/components/Navbar.js
// PREMIUM VERSION - Complete with All New Features + AI Integration

import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LanguageSelector from './LanguageSelector';
import { 
  UserCircleIcon, 
  ChevronDownIcon,
  HomeIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CalendarIcon,
  UsersIcon,
  EyeIcon,
  ArrowRightStartOnRectangleIcon,
  UserPlusIcon,
  StarIcon,
  TicketIcon,
  HeartIcon,
  GiftIcon,
  UserGroupIcon,
  GlobeAltIcon,
  MicrophoneIcon,
  TagIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

function Navbar() {
  const [menu, setMenu] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [registerDropdownOpen, setRegisterDropdownOpen] = useState(false);
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const registerDropdownRef = useRef(null);
  const aiToolsRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
      if (registerDropdownRef.current && !registerDropdownRef.current.contains(event.target)) {
        setRegisterDropdownOpen(false);
      }
      if (aiToolsRef.current && !aiToolsRef.current.contains(event.target)) {
        setAiToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenu(false);
    setAdminDropdownOpen(false);
    navigate("/");
  };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";
  const isOwner = user?.role === "owner";
  const isRegularUser = isLoggedIn && !isAdmin && !isOwner;

  return (
    <nav className="sticky top-0 z-[9999] bg-gradient-to-r from-gray-900 via-gray-900 to-black border-b border-yellow-500/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-[72px] flex items-center justify-between">
        
        {/* CUSTOM BOOKORA LOGO */}
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setMenu(false)}>
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-60 group-hover:opacity-100 transition duration-500 rounded-2xl"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition duration-300">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6z" opacity="0.3"/>
                <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
              </svg>
              <StarIcon className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <div className="leading-tight">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              BOOKORA
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-medium">Luxury Stays</p>
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden lg:flex items-center gap-1">
          
          <Link to="/" className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300">
            <span className="relative z-10 flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              Home
            </span>
            <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
          </Link>
          
          <Link to="/hotels" className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300">
            <span className="relative z-10 flex items-center gap-2">
              <BuildingOfficeIcon className="h-4 w-4" />
              Hotels
            </span>
            <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
          </Link>
          <Link to="/offers" className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300">
            <span className="relative z-10 flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              Offers
            </span>
            <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
          </Link>

          {/* ========== AI TOOLS DROPDOWN - NEW ========== */}
          <div className="relative" ref={aiToolsRef}>
            <button
              onClick={() => setAiToolsOpen(!aiToolsOpen)}
              className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300 flex items-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                AI Tools
                <ChevronDownIcon className={`h-3 w-3 transition-transform duration-300 ${aiToolsOpen ? "rotate-180" : ""}`} />
              </span>
              <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
            </button>
            
            {aiToolsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-900 backdrop-blur-xl border border-yellow-500/20 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                <Link to="/group-planner" onClick={() => setAiToolsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                  <UsersIcon className="h-4 w-4" />
                  Group Travel Planner
                </Link>
                <div className="border-t border-gray-800 my-1"></div>
                <div className="px-4 py-2 text-xs text-gray-500">AI Features Available:</div>
                <div className="px-4 py-1.5 text-xs text-gray-400">• Smart Itinerary Builder</div>
                <div className="px-4 py-1.5 text-xs text-gray-400">• Price Comparison</div>
                <div className="px-4 py-1.5 text-xs text-gray-400">• Weather Integration</div>
                <div className="px-4 py-1.5 text-xs text-gray-400">• Negotiation Bot</div>
              </div>
            )}
          </div>

          {/* My Bookings Link */}
          {isRegularUser && (
            <Link to="/mybookings" className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300">
              <span className="relative z-10 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                My Bookings
              </span>
              <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
            </Link>
          )}

          {/* Owner Dashboard Link */}
          {isOwner && (
            <>
              <Link to="/owner/dashboard" className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300">
                <span className="relative z-10 flex items-center gap-2">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  My Dashboard
                </span>
                <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
              </Link>
              <Link to="/owner/negotiations" className="...">
      <ChatBubbleLeftRightIcon className="h-4 w-4" />
      Negotiations
    </Link>
              
              <Link to="/owner/coupons" className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300">
                <span className="relative z-10 flex items-center gap-2">
                  <TicketIcon className="h-4 w-4" />
                  Coupons
                </span>
                <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
              </Link>
            </>
          )}

          {/* Admin Dropdown */}
          {isAdmin && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                className="group relative px-4 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300 flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4" />
                  Admin Tools
                  <ChevronDownIcon className={`h-3 w-3 transition-transform duration-300 ${adminDropdownOpen ? "rotate-180" : ""}`} />
                </span>
                <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></span>
              </button>
              
              {adminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900 backdrop-blur-xl border border-yellow-500/20 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                  <Link to="/admin/dashboard" onClick={() => setAdminDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                    <ChartBarIcon className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link to="/admin/hotels" onClick={() => setAdminDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    Manage Hotels
                  </Link>
                  <Link to="/admin/bookings" onClick={() => setAdminDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                    <CalendarIcon className="h-4 w-4" />
                    Manage Bookings
                  </Link>
                  <Link to="/admin/users" onClick={() => setAdminDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                    <UsersIcon className="h-4 w-4" />
                    Manage Users
                  </Link>
                  <Link to="/admin/coupons" onClick={() => setAdminDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                    <TicketIcon className="h-4 w-4" />
                    Coupons
                  </Link>
                  <Link to="/admin/owners" onClick={() => setAdminDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                    <EyeIcon className="h-4 w-4" />
                    View All Owners
                  </Link>
                  <Link to="/owner/dashboard" onClick={() => setAdminDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 border-t border-gray-800 mt-1 pt-2">
                    <EyeIcon className="h-4 w-4" />
                    Owner View
                  </Link>
                </div>
              )}
            </div>
          )}
           {/* Language Selector - NEW */}
          <div className="ml-2">
            <LanguageSelector />
          </div>

          {/* AUTH SECTION */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-2 ml-3">
              <Link to="/login" className="px-5 py-2 rounded-xl text-gray-300 text-sm font-medium hover:text-yellow-400 transition-all duration-300">
                Login
              </Link>
              
              <div className="relative" ref={registerDropdownRef}>
                <button
                  onClick={() => setRegisterDropdownOpen(!registerDropdownOpen)}
                  className="px-5 py-2 rounded-xl font-bold text-black text-sm bg-gradient-to-r from-yellow-400 to-yellow-500 hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 flex items-center gap-2"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  Register
                  <ChevronDownIcon className={`h-3 w-3 transition-transform duration-300 ${registerDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {registerDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 backdrop-blur-xl border border-yellow-500/20 rounded-2xl shadow-2xl py-2 z-50">
                    <Link to="/register" onClick={() => setRegisterDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                      <UserCircleIcon className="h-4 w-4" />
                      Regular User
                    </Link>
                    <Link to="/owner/register" onClick={() => setRegisterDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      Hotel Owner
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-4">
              <div className="group relative">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500/15 to-yellow-600/15 border border-yellow-500/40 backdrop-blur-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                    <span className="text-black font-bold text-xs">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-yellow-400 text-xs font-semibold tracking-wide">
                    {isAdmin ? "ADMIN" : isOwner ? "OWNER" : "USER"}
                  </span>
                  <span className="text-white text-xs font-medium">
                    {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User"}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl font-medium text-white text-sm bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-red-500/25"
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button 
          onClick={() => setMenu(!menu)} 
          className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold flex items-center justify-center hover:shadow-lg transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* MOBILE MENU - WITH NEW AI FEATURES */}
      {menu && (
        <div className="lg:hidden bg-gray-900 border-t border-yellow-500/20 px-4 pb-6 pt-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {/* Basic Links */}
          <Link to="/" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
            <HomeIcon className="h-5 w-5" />
            Home
          </Link>
          <Link to="/hotels" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200">
            <BuildingOfficeIcon className="h-5 w-5" />
            Hotels
          </Link>

          {/* AI Tools Section - Mobile */}
          <div className="px-4 py-2 text-yellow-400 text-xs font-semibold uppercase tracking-wider border-t border-yellow-500/20 mt-2 pt-3">
            AI Tools
          </div>
          <Link to="/group-planner" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
            <UsersIcon className="h-5 w-5" />
            Group Travel Planner
          </Link>
          <div className="px-4 py-2 text-xs text-gray-500">✨ AI Features: Itinerary Builder | Price Compare | Weather | Negotiation</div>

          {/* Language Selector - Mobile */}
          <div className="px-4 py-2">
            <LanguageSelector />
          </div>

          {/* Regular User Mobile Menu */}
          {isRegularUser && (
            <>
              <div className="px-4 py-2 text-yellow-400 text-xs font-semibold uppercase tracking-wider border-t border-yellow-500/20 mt-2 pt-3">
                My Account
              </div>
              <Link to="/mybookings" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <CalendarIcon className="h-5 w-5" />
                My Bookings
              </Link>
            </>
          )}

          {/* Owner Mobile Menu */}
          {isOwner && (
            <>
              <div className="px-4 py-2 text-yellow-400 text-xs font-semibold uppercase tracking-wider border-t border-yellow-500/20 mt-2 pt-3">
                Owner Panel
              </div>
              <Link to="/owner/dashboard" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <BuildingOfficeIcon className="h-5 w-5" />
                My Dashboard
              </Link>
              <Link to="/owner/coupons" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <TicketIcon className="h-5 w-5" />
                Coupons
              </Link>
            </>
          )}

          {/* Admin Mobile Menu */}
          {isAdmin && (
            <>
              <div className="px-4 py-2 text-yellow-400 text-xs font-semibold uppercase tracking-wider border-t border-yellow-500/20 mt-2 pt-3">
                Admin Menu
              </div>
              <Link to="/admin/dashboard" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <ChartBarIcon className="h-5 w-5" />
                Dashboard
              </Link>
              <Link to="/admin/hotels" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <BuildingOfficeIcon className="h-5 w-5" />
                Manage Hotels
              </Link>
              <Link to="/admin/bookings" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <CalendarIcon className="h-5 w-5" />
                Manage Bookings
              </Link>
              <Link to="/admin/users" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <UsersIcon className="h-5 w-5" />
                Manage Users
              </Link>
              <Link to="/admin/coupons" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <TicketIcon className="h-5 w-5" />
                Coupons
              </Link>
              <Link to="/owner/dashboard" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <EyeIcon className="h-5 w-5" />
                Owner View
              </Link>
            </>
          )}

          {/* Auth Section for Mobile */}
          {!isLoggedIn ? (
            <>
              <div className="px-4 py-2 text-yellow-400 text-xs font-semibold uppercase tracking-wider border-t border-yellow-500/20 mt-2 pt-3">
                Register As
              </div>
              <Link to="/register" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <UserCircleIcon className="h-5 w-5" />
                Regular User
              </Link>
              <Link to="/owner/register" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-200 pl-8">
                <BuildingOfficeIcon className="h-5 w-5" />
                Hotel Owner
              </Link>
              
              <Link to="/login" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 text-yellow-400 mt-2">
                Login
              </Link>
            </>
          ) : (
            <>
              <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/15 to-yellow-600/15 border border-yellow-500/40 mx-4 my-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <span className="text-black font-bold text-sm">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <div className="text-yellow-400 font-semibold text-xs tracking-wide">
                      {isAdmin ? "ADMIN" : isOwner ? "OWNER" : "USER"}
                    </div>
                    <div className="text-white text-sm font-medium">
                      {user?.name || user?.email || "User"}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-center mx-4 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;