<div align="center">

# 🏨 BOOKORA
### Luxury Hotel Booking Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-bookora--gamma.vercel.app-2563eb?style=for-the-badge)](https://bookora-gamma.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

**A production-ready, full-stack hotel booking platform with AI-powered features, real-time negotiation, and a complete multi-role system.**

[🚀 Live Demo](https://bookora-gamma.vercel.app) • [📧 Contact](mailto:pranayyadav860@gmail.com)

---

</div>

## ✨ Features

### 🤖 AI-Powered
| Feature | Description |
|---------|-------------|
| 💬 AI Travel Assistant | Claude-powered floating chat on every page |
| 🎤 Voice Search | Multi-language voice search (Hindi, Telugu, Tamil, 8+ languages) |
| 🗺️ Smart Itinerary Planner | AI-generated day-by-day travel plans |
| 💰 Price Negotiation Bot | Real-time AI negotiation between guests and hotel owners |
| 🌤️ Weather Integration | Live weather widget on hotel detail pages |

### 👤 For Users
| Feature | Description |
|---------|-------------|
| 🔐 OTP Verification | Email OTP verification via Brevo API |
| 📅 Availability Calendar | Visual calendar showing booked/available dates |
| ❤️ Wishlist | Save and manage favourite hotels |
| 🏅 Loyalty Points | Tiered rewards system (Bronze → Silver → Gold → Platinum) |
| ⭐ Verified Reviews | Only guests with completed stays can review |
| 📄 GST Invoice | MakeMyTrip-style PDF invoice download |
| 📧 Email Confirmations | Booking confirmation + invoice via email |
| 🌐 Multi-language UI | 12 Indian languages supported |

### 🏨 For Hotel Owners
| Feature | Description |
|---------|-------------|
| 📊 Owner Dashboard | Complete hotel and booking management |
| 💬 Real-time Negotiations | Socket.io-powered negotiation panel |
| ⭐ Review Management | Reply to guest reviews inline |
| 🎫 Coupon Management | Create and manage discount coupons |
| 📈 Analytics | Revenue, occupancy, and booking insights |
| 🚫 Booking Cancellation | Cancel with email notification to guest |

### 🔑 Admin Panel
| Feature | Description |
|---------|-------------|
| 🏨 Hotel Management | Add, edit, approve hotels |
| 👥 User Management | View and manage all users |
| 📋 Booking Management | View and manage all bookings |
| 🎫 Coupon Management | Platform-wide coupon control |
| 📰 Newsletter | Send newsletters to subscribers |
| 👁️ Owner Verification | Approve/reject hotel owner applications |

### 🔒 Security
| Feature | Description |
|---------|-------------|
| 🔑 JWT Authentication | Secure token-based auth with 7-day expiry |
| 🔒 Account Lockout | Auto-lock after 5 failed login attempts |
| 🛡️ Helmet.js | Security headers on all responses |
| 🚦 Rate Limiting | 20 requests/15 min on auth routes |
| 🌐 CORS Whitelist | Only whitelisted origins allowed |
| 👮 Role-based Access | User / Owner / Admin roles |

---

## 🛠️ Tech Stack

### Frontend
```
React.js 18          — UI framework
Tailwind CSS         — Styling
Socket.io Client     — Real-time communication
Axios                — HTTP client
React Router v6      — Navigation
Recharts             — Analytics charts
Puppeteer            — PDF generation
React Hot Toast      — Notifications
Heroicons            — Icons
```

### Backend
```
Node.js + Express    — Server framework
MongoDB + Mongoose   — Database
Socket.io            — Real-time WebSocket
JWT                  — Authentication
Bcrypt               — Password hashing
Multer               — File uploads
Nodemailer           — Email service
Brevo API            — Transactional emails
Cloudinary           — Image storage
Helmet + Rate-limit  — Security
```

### Services & APIs
```
MongoDB Atlas        — Cloud database
Render.com           — Backend hosting
Vercel               — Frontend hosting
Razorpay             — Payment gateway
Brevo                — Email API
Cloudinary           — Media storage
Fast2SMS             — SMS OTP (India)
Anthropic Claude     — AI assistant
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Vercel)                   │
│              React.js + Tailwind CSS                 │
│         https://bookora-gamma.vercel.app             │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS + WebSocket
┌──────────────────────▼──────────────────────────────┐
│                   SERVER (Render)                    │
│              Node.js + Express.js                    │
│        https://bookora-server-22ox.onrender.com      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │   REST   │  │ Socket   │  │   Middleware       │ │
│  │   API    │  │  .io     │  │ JWT + Helmet +     │ │
│  │ /api/*   │  │ Real-time│  │ Rate Limit + CORS  │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               MONGODB ATLAS (Cloud)                  │
│  Collections: users, hotels, bookings, reviews,      │
│               loyalties, coupons, negotiations        │
└─────────────────────────────────────────────────────┘
```

---

## 📱 Screenshots

> 🌐 **[View Live Demo](https://bookora-gamma.vercel.app)** to see all features in action

### 🏠 Home Page
- Hero section with AI-powered search
- Featured hotels with real-time availability
- Active offers and coupons display

### 🏨 Hotel Detail Page
- Photo gallery with full-screen view
- Interactive availability calendar
- Real-time price negotiation
- Weather widget
- Verified guest reviews with owner replies
- AI itinerary planner

### 💳 Checkout Flow
- Room selection with dynamic pricing
- GST calculation
- Coupon code application
- Loyalty points redemption
- Razorpay payment integration
- Instant email confirmation + PDF invoice

### 🏅 Loyalty System
- Points earned per booking (₹100 = 1 point)
- 4 tiers: Bronze → Silver → Gold → Platinum
- +50 points for leaving a review
- Points redeemable as cash discount

---

## 🚀 Key Highlights

- **Real-time negotiation** — Socket.io powers live price negotiation between guests and hotel owners
- **Production deployed** — Live on Vercel + Render + MongoDB Atlas
- **Multi-role system** — 3 distinct roles with separate dashboards and permissions
- **PDF invoice generation** — Puppeteer renders HTML to professional PDF (MakeMyTrip style)
- **GST compliant** — Proper tax calculation with GSTIN on invoices
- **Mobile responsive** — Works seamlessly on all screen sizes
- **Email automation** — OTP, booking confirmation, and cancellation emails

---

## 👨‍💻 Developer

**Pranay Yadav**  
Full Stack Developer | MERN Stack  
📧 pranayyadav860@gmail.com  
🌐 [Live Project](https://bookora-gamma.vercel.app)

---

<div align="center">

**⭐ If you found this project interesting, please give it a star!**

*Built with ❤️ using React, Node.js, MongoDB, and lots of chai ☕*

</div>
