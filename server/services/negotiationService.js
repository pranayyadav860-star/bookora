const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

class NegotiationService {
  constructor() {
    this.negotiationHistory = new Map();
    this.priceAdjustmentFactors = {
      peakSeason: 1.3,
      offSeason: 0.8,
      weekend: 1.2,
      weekday: 0.9,
      lastMinute: 0.85,
      earlyBird: 0.9,
      longStay: 0.85,
      groupBooking: 0.8
    };
  }

  async negotiate(params) {
    const {
      hotelId,
      roomType,
      checkIn,
      checkOut,
      guests,
      requestedPrice,
      userBudget,
      specialRequests,
      userId,
      isCorporate,
      isFirstTime,
      loyaltyPoints
    } = params;

    try {
      // Get hotel details
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return { success: false, message: 'Hotel not found' };
      }

      // Find room type
      const room = hotel.roomTypes.find(r => r.name === roomType);
      if (!room) {
        return { success: false, message: 'Room type not found' };
      }

      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      const originalPrice = room.price * nights;
      const requestedTotal = requestedPrice * nights;
      const budgetTotal = userBudget * nights;

      // Calculate dynamic factors
      const factors = await this.calculateDynamicFactors(hotel, checkIn, checkOut, nights, guests, userId);

      // Calculate minimum possible price
      const minimumPrice = await this.calculateMinimumPrice(room.price, factors);

      // Generate negotiation strategy
      const strategy = this.determineStrategy(originalPrice, requestedTotal, minimumPrice, factors);

      // Generate counter offers
      const counterOffers = this.generateCounterOffers(
        originalPrice,
        requestedTotal,
        minimumPrice,
        nights,
        factors,
        specialRequests
      );

      // Calculate success probability
      const successProbability = this.calculateSuccessProbability(
        requestedTotal,
        originalPrice,
        minimumPrice,
        factors,
        userBudget
      );

      // Check for special deals
      const specialDeals = await this.checkSpecialDeals(hotel, userId, nights, guests);

      // AI negotiation tips
      const tips = this.generateNegotiationTips(strategy, successProbability, factors);

      // Store negotiation session
      const sessionId = this.storeNegotiationSession({
        hotelId,
        userId,
        originalPrice,
        requestedTotal,
        strategy,
        timestamp: new Date()
      });

      return {
        success: true,
        sessionId,
        hotelName: hotel.hotelName,
        roomType: room.name,
        originalPrice,
        requestedPrice: requestedTotal,
        minimumPossible: minimumPrice * nights,
        nights,
        strategy,
        counterOffers,
        successProbability,
        specialDeals,
        tips,
        factors: {
          isPeakSeason: factors.isPeakSeason,
          isWeekend: factors.isWeekend,
          occupancyRate: factors.occupancyRate,
          daysUntilCheckIn: factors.daysUntilCheckIn,
          negotiationPower: factors.negotiationPower
        }
      };

    } catch (error) {
      console.error('Negotiation error:', error);
      return { success: false, message: error.message };
    }
  }

  async calculateDynamicFactors(hotel, checkIn, checkOut, nights, guests, userId) {
    const checkInDate = new Date(checkIn);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
    
    // Season calculation
    const month = checkInDate.getMonth();
    const isPeakSeason = [10, 11, 0, 1].includes(month); // Nov-Feb
    const isWeekend = [5, 6].includes(checkInDate.getDay()); // Sat-Sun
    
    // Calculate occupancy rate (simulated)
    const totalBookings = await Booking.countDocuments({
      hotelId: hotel._id,
      checkIn: { $lte: checkOut },
      checkOut: { $gte: checkIn }
    });
    const occupancyRate = Math.min(totalBookings / 100, 0.95);
    
    // Calculate negotiation power based on various factors
    let negotiationPower = 0.5; // Base
    
    if (daysUntilCheckIn <= 3) negotiationPower += 0.3; // Last minute
    else if (daysUntilCheckIn >= 30) negotiationPower += 0.2; // Early bird
    
    if (nights >= 5) negotiationPower += 0.2; // Long stay
    if (guests >= 4) negotiationPower += 0.1; // Group
    if (!isPeakSeason) negotiationPower += 0.2;
    if (!isWeekend) negotiationPower += 0.1;
    if (occupancyRate < 0.5) negotiationPower += 0.3;
    
    // User-specific factors (if userId provided)
    if (userId) {
      const userBookings = await Booking.countDocuments({ userId });
      if (userBookings >= 3) negotiationPower += 0.15; // Loyal customer
      if (userBookings === 0) negotiationPower += 0.05; // First time
    }
    
    return {
      isPeakSeason,
      isWeekend,
      daysUntilCheckIn,
      occupancyRate,
      negotiationPower: Math.min(negotiationPower, 0.9),
      nights,
      guests
    };
  }

  async calculateMinimumPrice(originalPrice, factors) {
    let multiplier = 1;
    
    if (factors.daysUntilCheckIn <= 3) multiplier *= 0.85; // Last minute discount
    else if (factors.daysUntilCheckIn >= 30) multiplier *= 0.9; // Early bird
    
    if (factors.nights >= 5) multiplier *= 0.85; // Long stay
    if (factors.guests >= 4) multiplier *= 0.9; // Group booking
    if (!factors.isPeakSeason) multiplier *= 0.8;
    if (!factors.isWeekend) multiplier *= 0.9;
    if (factors.occupancyRate < 0.3) multiplier *= 0.75;
    
    // Minimum price cannot go below 30% of original
    return Math.max(originalPrice * 0.3, originalPrice * multiplier);
  }

  determineStrategy(originalPrice, requestedPrice, minimumPrice, factors) {
    const difference = originalPrice - requestedPrice;
    const percentageDiff = (difference / originalPrice) * 100;
    
    if (requestedPrice >= minimumPrice && requestedPrice < originalPrice) {
      return {
        type: 'promising',
        name: 'Direct Negotiation',
        message: `Good news! Your request of ₹${requestedPrice} is reasonable. We can likely negotiate this.`,
        approach: `Request a discount of ${Math.round(percentageDiff)}% from the original price.`,
        chance: 'High'
      };
    } else if (requestedPrice < minimumPrice) {
      return {
        type: 'challenging',
        name: 'Value-Added Negotiation',
        message: `₹${requestedPrice} is below our minimum possible price of ₹${Math.round(minimumPrice)}. Let's try adding value instead.`,
        approach: 'Ask for room upgrades, free breakfast, or late checkout instead of price reduction.',
        chance: 'Medium'
      };
    } else {
      return {
        type: 'standard',
        name: 'Package Deal',
        message: `Let's explore package options that include meals, spa, or activities for better value.`,
        approach: 'Consider bundling multiple services for a better overall deal.',
        chance: 'Good'
      };
    }
  }

  generateCounterOffers(originalPrice, requestedPrice, minimumPrice, nights, factors, specialRequests) {
    const offers = [];
    
    // Offer 1: Small discount
    if (requestedPrice > minimumPrice) {
      offers.push({
        id: 1,
        type: 'price_discount',
        title: 'Direct Discount',
        offer: `₹${Math.round((requestedPrice + originalPrice) / 2)} for ${nights} nights`,
        originalPrice: originalPrice,
        discountedPrice: Math.round((requestedPrice + originalPrice) / 2),
        savings: originalPrice - Math.round((requestedPrice + originalPrice) / 2),
        savingsPercentage: Math.round(((originalPrice - Math.round((requestedPrice + originalPrice) / 2)) / originalPrice) * 100),
        conditions: ['Standard room only', 'No further discounts'],
        validity: '24 hours'
      });
    }
    
    // Offer 2: Value additions
    const valueAdds = ['Free Breakfast', 'Early Check-in', 'Late Checkout', 'Room Upgrade'];
    if (specialRequests && specialRequests.length > 0) {
      valueAdds.push(...specialRequests);
    }
    
    offers.push({
      id: 2,
      type: 'value_add',
      title: 'Value Package',
      offer: `₹${Math.round(requestedPrice)} for ${nights} nights`,
      originalPrice: originalPrice,
      discountedPrice: Math.round(requestedPrice),
      savings: originalPrice - Math.round(requestedPrice),
      savingsPercentage: Math.round(((originalPrice - Math.round(requestedPrice)) / originalPrice) * 100),
      inclusions: valueAdds.slice(0, 4),
      conditions: ['Minimum 2 nights stay', 'Non-refundable'],
      validity: '48 hours'
    });
    
    // Offer 3: Long stay discount
    if (nights >= 3) {
      const longStayPrice = Math.round(originalPrice * 0.85);
      offers.push({
        id: 3,
        type: 'long_stay',
        title: 'Extended Stay Deal',
        offer: `₹${longStayPrice} for ${nights} nights`,
        originalPrice: originalPrice,
        discountedPrice: longStayPrice,
        savings: originalPrice - longStayPrice,
        savingsPercentage: 15,
        inclusions: ['Free WiFi', 'Welcome Drink', '10% off on F&B'],
        conditions: ['Non-refundable', 'Full prepayment required'],
        validity: '72 hours'
      });
    }
    
    // Offer 4: Last minute deal
    if (factors.daysUntilCheckIn <= 7) {
      const lastMinutePrice = Math.round(originalPrice * 0.8);
      offers.push({
        id: 4,
        type: 'last_minute',
        title: 'Last Minute Special',
        offer: `₹${lastMinutePrice} for ${nights} nights`,
        originalPrice: originalPrice,
        discountedPrice: lastMinutePrice,
        savings: originalPrice - lastMinutePrice,
        savingsPercentage: 20,
        inclusions: ['Complimentary Breakfast', 'Room Upgrade (subject to availability)'],
        conditions: ['Book within 24 hours', 'Non-refundable'],
        validity: '24 hours'
      });
    }
    
    // Offer 5: Group/Family deal
    if (factors.guests >= 3) {
      const groupPrice = Math.round(originalPrice * 0.75);
      offers.push({
        id: 5,
        type: 'group',
        title: 'Family & Group Package',
        offer: `₹${groupPrice} for ${nights} nights`,
        originalPrice: originalPrice,
        discountedPrice: groupPrice,
        savings: originalPrice - groupPrice,
        savingsPercentage: 25,
        inclusions: ['Extra Bed Free', 'Kids Eat Free', 'Group Activities'],
        conditions: ['Minimum 2 rooms required', 'Valid for family groups'],
        validity: '7 days'
      });
    }
    
    return offers;
  }

  calculateSuccessProbability(requestedPrice, originalPrice, minimumPrice, factors, userBudget) {
    let baseProbability = 0.5;
    
    // Price-based probability
    if (requestedPrice >= originalPrice * 0.9) baseProbability += 0.3;
    else if (requestedPrice >= originalPrice * 0.8) baseProbability += 0.2;
    else if (requestedPrice >= originalPrice * 0.7) baseProbability += 0.1;
    else if (requestedPrice < minimumPrice) baseProbability -= 0.3;
    
    // Factor-based adjustments
    if (factors.daysUntilCheckIn <= 3) baseProbability += 0.2;
    if (factors.nights >= 5) baseProbability += 0.15;
    if (factors.guests >= 4) baseProbability += 0.1;
    if (!factors.isPeakSeason) baseProbability += 0.15;
    if (!factors.isWeekend) baseProbability += 0.1;
    if (factors.occupancyRate < 0.4) baseProbability += 0.2;
    
    // User budget alignment
    if (userBudget >= requestedPrice * 0.9) baseProbability += 0.1;
    
    const finalProbability = Math.min(Math.max(baseProbability, 0.1), 0.95);
    
    let level = 'Medium';
    if (finalProbability >= 0.7) level = 'High';
    else if (finalProbability >= 0.4) level = 'Medium';
    else level = 'Low';
    
    return {
      percentage: Math.round(finalProbability * 100),
      level: level,
      factors: this.getProbabilityFactors(requestedPrice, originalPrice, minimumPrice, factors)
    };
  }

  getProbabilityFactors(requestedPrice, originalPrice, minimumPrice, factors) {
    const factors_list = [];
    
    if (requestedPrice >= originalPrice * 0.9) {
      factors_list.push('✓ Budget is very close to asking price');
    } else if (requestedPrice < minimumPrice) {
      factors_list.push('⚠️ Requested price is below minimum threshold');
    } else {
      factors_list.push('✓ Requested price is within negotiable range');
    }
    
    if (factors.daysUntilCheckIn <= 3) {
      factors_list.push('✓ Last minute booking increases leverage');
    }
    
    if (factors.nights >= 5) {
      factors_list.push('✓ Long stay qualifies for better discounts');
    }
    
    if (!factors.isPeakSeason) {
      factors_list.push('✓ Off-season travel offers better rates');
    }
    
    if (factors.occupancyRate < 0.4) {
      factors_list.push('✓ Low occupancy increases negotiation power');
    }
    
    return factors_list;
  }

  async checkSpecialDeals(hotel, userId, nights, guests) {
    const deals = [];
    
    // Check loyalty program
    if (userId) {
      const pastBookings = await Booking.countDocuments({ userId });
      if (pastBookings >= 5) {
        deals.push({
          type: 'loyalty',
          name: 'Loyalty Member Discount',
          discount: '15% off',
          description: `As a loyal customer with ${pastBookings} bookings, you get special pricing`,
          eligibility: `Verified - ${pastBookings} past bookings`
        });
      } else if (pastBookings >= 2) {
        deals.push({
          type: 'loyalty',
          name: 'Returning Guest Benefit',
          discount: '10% off',
          description: 'Welcome back! Enjoy 10% off on your stay',
          eligibility: `Returning guest - ${pastBookings} past bookings`
        });
      }
    }
    
    // First-time booking offer
    if (!userId || await Booking.countDocuments({ userId }) === 0) {
      deals.push({
        type: 'welcome',
        name: 'First Booking Special',
        discount: '12% off',
        description: 'Special discount for your first booking with us',
        eligibility: 'First-time bookers'
      });
    }
    
    // Long stay deals
    if (nights >= 7) {
      deals.push({
        type: 'extended',
        name: 'Week Long Stay Package',
        discount: 'One Night Free',
        description: 'Book 7 nights, get 1 night absolutely free',
        eligibility: 'Minimum 7 nights stay'
      });
    }
    
    // Group booking deals
    if (guests >= 4) {
      deals.push({
        type: 'group',
        name: 'Group Booking Discount',
        discount: '20% off',
        description: 'Special group rates for 4+ guests',
        eligibility: '4+ guests per room'
      });
    }
    
    // Weekend special
    const today = new Date();
    const isWeekend = [5, 6].includes(today.getDay());
    if (isWeekend) {
      deals.push({
        type: 'weekend',
        name: 'Weekend Getaway',
        discount: 'Free Breakfast',
        description: 'Complimentary breakfast for all guests',
        eligibility: 'Weekend stays (Fri-Sun)'
      });
    }
    
    return deals;
  }

  generateNegotiationTips(strategy, successProbability, factors) {
    const tips = [
      '💬 Be polite and respectful during negotiations - it increases success rate by 30%',
      '🎯 Focus on value additions rather than just price reduction - you might get more value',
      '📅 Being flexible with dates can unlock better deals - mid-week stays are often cheaper',
      '⏰ Last-minute bookings (within 3 days) have 40% higher negotiation success rate',
      '👥 Group bookings (4+ people) qualify for special group discounts',
      '⭐ Mention if you\'re celebrating a special occasion - hotels often provide complimentary upgrades'
    ];
    
    if (strategy.type === 'promising') {
      tips.unshift('🎉 Your requested price has a high chance of acceptance! Use the "Direct Discount" offer');
    }
    
    if (factors.daysUntilCheckIn <= 3) {
      tips.push('🔥 Last minute booking! Hotels prefer to fill rooms - you have strong negotiation power');
    }
    
    if (factors.nights >= 5) {
      tips.push('🏨 Long stay detected! Ask for extended stay discounts - hotels love long-term guests');
    }
    
    if (factors.guests >= 4) {
      tips.push('👨‍👩‍👧‍👦 Group booking! Request group discounts or complimentary extras');
    }
    
    if (successProbability.level === 'High') {
      tips.unshift('✅ Strong negotiation position! Your request has a high probability of acceptance');
    } else if (successProbability.level === 'Low') {
      tips.unshift('⚠️ Your current request may be challenging - consider adding value requests instead');
    }
    
    return tips;
  }

  storeNegotiationSession(session) {
    const sessionId = `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.negotiationHistory.set(sessionId, session);
    
    // Clean old sessions (keep last 100)
    if (this.negotiationHistory.size > 100) {
      const firstKey = this.negotiationHistory.keys().next().value;
      this.negotiationHistory.delete(firstKey);
    }
    
    return sessionId;
  }

  getNegotiationHistory(sessionId) {
    return this.negotiationHistory.get(sessionId);
  }
}

module.exports = new NegotiationService();