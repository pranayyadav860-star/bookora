class FraudDetection {
  static async analyzeBooking(booking, user, hotel) {
    const riskScore = { total: 0, factors: [] };
    
    // 1. Check for rapid successive bookings
    const recentBookings = await Booking.find({
      userId: user._id,
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    }).count();
    
    if (recentBookings > 5) {
      riskScore.total += 30;
      riskScore.factors.push('Multiple bookings in short time');
    }
    
    // 2. Check IP geolocation vs booking location
    if (booking.userIP && booking.hotelCity) {
      // Implement IP to location check
      const ipLocation = await this.getIPLocation(booking.userIP);
      if (ipLocation && !this.isNearby(ipLocation.city, booking.hotelCity)) {
        riskScore.total += 20;
        riskScore.factors.push('Booking from distant location');
      }
    }
    
    // 3. Email domain check
    const suspiciousDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com'];
    const emailDomain = user.email.split('@')[1];
    if (suspiciousDomains.includes(emailDomain)) {
      riskScore.total += 40;
      riskScore.factors.push('Suspicious email domain');
    }
    
    // 4. Payment method velocity
    const paymentsToday = await Booking.find({
      'payment.cardLast4': booking.payment.cardLast4,
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    }).count();
    
    if (paymentsToday > 10) {
      riskScore.total += 50;
      riskScore.factors.push('Unusual payment velocity');
    }
    
    // 5. Device fingerprinting
    if (this.isVPN(booking.userIP)) {
      riskScore.total += 25;
      riskScore.factors.push('VPN/Proxy detected');
    }
    
    // Determine action
    let action = 'allow';
    if (riskScore.total > 70) action = 'block';
    else if (riskScore.total > 40) action = 'review';
    
    return {
      riskScore: riskScore.total,
      riskFactors: riskScore.factors,
      action,
      requiresManualReview: action === 'review'
    };
  }
  
  static isVPN(ip) {
    // Integrate with VPN detection API
    const vpnIPs = []; // Load from database or API
    return vpnIPs.includes(ip);
  }
  
  static async getIPLocation(ip) {
    // Integrate with IP geolocation service
    return null;
  }
  
  static isNearby(city1, city2) {
    // Implement distance calculation
    return city1 === city2;
  }
}

module.exports = FraudDetection;