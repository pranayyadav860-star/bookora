const axios = require('axios');

class PriceComparator {
  constructor() {
    this.platforms = [
      { name: 'MakeMyTrip', commission: 0.05, cashback: '5%', couponCode: 'MMT10' },
      { name: 'Goibibo', commission: 0.06, cashback: '6%', couponCode: 'GO10' },
      { name: 'Agoda', commission: 0.04, cashback: '4%', couponCode: 'AGODA15' },
      { name: 'Booking.com', commission: 0.07, cashback: '7%', couponCode: 'BOOKING10' },
      { name: 'Cleartrip', commission: 0.055, cashback: '5.5%', couponCode: 'CLEAR5' }
    ];
    this.priceHistory = new Map();
  }

  async comparePrices(hotel) {
    try {
      const currentPrices = await this.fetchPricesFromPlatforms(hotel);
      const bestDeal = this.findBestDeal(currentPrices);
      const historicalData = await this.getHistoricalPrices(hotel._id);
      const pricePrediction = this.predictPriceTrend(historicalData);
      
      return {
        hotel_name: hotel.name,
        current_prices: currentPrices,
        best_deal: bestDeal,
        potential_savings: this.calculatePotentialSavings(currentPrices),
        historical_low: historicalData.lowest,
        price_prediction: pricePrediction,
        recommendation: this.getRecommendation(bestDeal, historicalData),
        price_alerts: await this.setupPriceAlerts(hotel._id, bestDeal.price),
        booking_tips: this.getBookingTips(bestDeal)
      };
    } catch (error) {
      console.error('Price comparison error:', error);
      return null;
    }
  }

  async fetchPricesFromPlatforms(hotel) {
    const basePrice = hotel.pricePerNight;
    
    return this.platforms.map(platform => {
      const platformPrice = basePrice * (1 + platform.commission);
      const discountedPrice = platformPrice * 0.9; // 10% discount simulation
      
      return {
        platform: platform.name,
        original_price: Math.round(platformPrice),
        discounted_price: Math.round(discountedPrice),
        discount: `${Math.round(((platformPrice - discountedPrice) / platformPrice) * 100)}%`,
        cashback: platform.cashback,
        coupon_code: platform.couponCode,
        url: `https://${platform.name.toLowerCase()}.com/hotel/${hotel._id}`,
        is_best: false,
        savings: 0
      };
    });
  }

  findBestDeal(prices) {
    const sorted = [...prices].sort((a, b) => a.discounted_price - b.discounted_price);
    sorted[0].is_best = true;
    sorted[0].savings = sorted[1] ? sorted[1].discounted_price - sorted[0].discounted_price : 0;
    return sorted[0];
  }

  async getHistoricalPrices(hotelId) {
    // In production, fetch from database
    // For now, generate realistic historical data
    const currentPrice = await this.getCurrentPrice(hotelId);
    
    return {
      lowest: currentPrice * 0.7,
      highest: currentPrice * 1.5,
      average: currentPrice * 0.9,
      trend: this.generateTrend(),
      last_30_days: this.generateLast30DaysData(currentPrice)
    };
  }

  generateTrend() {
    const trends = ['rising', 'falling', 'stable', 'volatile'];
    const weights = [0.3, 0.4, 0.2, 0.1];
    return this.weightedRandom(trends, weights);
  }

  generateLast30DaysData(basePrice) {
    const data = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        date: this.getDateDaysAgo(i),
        price: basePrice * (0.8 + Math.random() * 0.6)
      });
    }
    return data;
  }

  predictPriceTrend(historicalData) {
    const predictions = [];
    const currentPrice = historicalData.average;
    
    for (let i = 1; i <= 7; i++) {
      let predictedPrice;
      if (historicalData.trend === 'rising') {
        predictedPrice = currentPrice * (1 + (i * 0.02));
      } else if (historicalData.trend === 'falling') {
        predictedPrice = currentPrice * (1 - (i * 0.015));
      } else {
        predictedPrice = currentPrice * (0.95 + Math.random() * 0.1);
      }
      
      predictions.push({
        day: i,
        predicted_price: Math.round(predictedPrice),
        confidence: Math.round(70 + Math.random() * 20)
      });
    }
    
    return predictions;
  }

  calculatePotentialSavings(prices) {
    const best = Math.min(...prices.map(p => p.discounted_price));
    const worst = Math.max(...prices.map(p => p.discounted_price));
    
    return {
      max_savings: worst - best,
      savings_percentage: Math.round(((worst - best) / worst) * 100),
      best_platform: prices.find(p => p.discounted_price === best).platform
    };
  }

  getRecommendation(bestDeal, historicalData) {
    const priceRatio = bestDeal.discounted_price / historicalData.lowest;
    
    if (priceRatio <= 1) {
      return {
        action: '🔥 Book Now!',
        message: `Historic low price! Save ₹${bestDeal.savings} compared to other platforms`,
        urgency: 'high',
        color: 'red'
      };
    } else if (priceRatio <= 1.1) {
      return {
        action: '✅ Good Deal',
        message: `Only ${Math.round((priceRatio - 1) * 100)}% above historic low`,
        urgency: 'medium',
        color: 'green'
      };
    } else if (historicalData.trend === 'falling') {
      return {
        action: '⏰ Wait',
        message: 'Prices are trending down. Set a price alert!',
        urgency: 'low',
        color: 'yellow'
      };
    } else {
      return {
        action: '👀 Watch',
        message: 'Current price is high. Consider alternative dates',
        urgency: 'low',
        color: 'gray'
      };
    }
  }

  async setupPriceAlerts(hotelId, currentPrice) {
    const alertLevels = [
      { discount: 10, target_price: Math.round(currentPrice * 0.9), users: 0 },
      { discount: 15, target_price: Math.round(currentPrice * 0.85), users: 0 },
      { discount: 20, target_price: Math.round(currentPrice * 0.8), users: 0 }
    ];
    
    return alertLevels;
  }

  getBookingTips(bestDeal) {
    return [
      `Use coupon code ${bestDeal.coupon_code} for extra savings`,
      `Get ${bestDeal.cashback} cashback on ${bestDeal.platform}`,
      'Book at least 2 weeks in advance for best rates',
      'Weekend stays are 15% more expensive',
      'Sign up for newsletter for exclusive deals'
    ];
  }

  async getCurrentPrice(hotelId) {
    // Fetch current price from database
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findById(hotelId);
    return hotel ? hotel.pricePerNight : 5000;
  }

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  weightedRandom(items, weights) {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * total;
    let index = 0;
    while (random > 0) {
      random -= weights[index];
      index++;
    }
    return items[index - 1];
  }
}

module.exports = new PriceComparator();