class DynamicPricing {
  static calculatePrice(basePrice, date, occupancy, demandFactor) {
    const price = basePrice;
    let multiplier = 1;
    
    // Weekend pricing (Friday-Sunday)
    const day = new Date(date).getDay();
    if (day >= 5) multiplier *= 1.3;
    
    // Seasonality
    const month = new Date(date).getMonth();
    if (month >= 10 || month <= 1) multiplier *= 1.5; // Peak season (Nov-Feb)
    else if (month >= 5 && month <= 7) multiplier *= 0.85; // Off season (June-Aug)
    
    // Occupancy based pricing
    if (occupancy > 0.8) multiplier *= 1.2;
    else if (occupancy < 0.3) multiplier *= 0.85;
    
    // Demand factor
    multiplier *= (1 + demandFactor);
    
    // Special events (can be configured)
    const specialDates = {
      '12-25': 2.0, // Christmas
      '01-01': 1.8, // New Year
      '02-14': 1.5, // Valentine's
      '10-31': 1.3, // Halloween
    };
    
    const dateKey = `${String(new Date(date).getMonth()+1).padStart(2,'0')}-${String(new Date(date).getDate()).padStart(2,'0')}`;
    if (specialDates[dateKey]) multiplier *= specialDates[dateKey];
    
    const finalPrice = Math.round(price * multiplier);
    
    return {
      originalPrice: price,
      finalPrice,
      discount: finalPrice < price ? price - finalPrice : 0,
      surge: finalPrice > price ? finalPrice - price : 0,
      multipliers: { weekend: multiplier >= 1.3, seasonal: multiplier >= 1.5, demand: demandFactor }
    };
  }
  
  static calculateDemandFactor(bookingsInLastWeek, totalCapacity) {
    const occupancy = bookingsInLastWeek / totalCapacity;
    if (occupancy > 0.9) return 0.3;
    if (occupancy > 0.7) return 0.15;
    if (occupancy < 0.3) return -0.15;
    return 0;
  }
}

module.exports = DynamicPricing;