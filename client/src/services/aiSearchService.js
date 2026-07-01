class AISearchService {
  // Process natural language search query
  static async processNaturalLanguageQuery(query, entities = null) {
    const searchData = entities || this.extractEntities(query);
    
    // Build search filters
    const filters = {
      city: searchData.city,
      minPrice: searchData.minPrice,
      maxPrice: searchData.maxPrice,
      minRating: searchData.minRating,
      preferences: searchData.preferences,
      amenities: searchData.amenities,
      roomType: searchData.roomType,
      guests: searchData.guests
    };
    
    // Get AI-powered hotel recommendations
    const recommendations = await this.getAIRecommendations(filters);
    
    return {
      query: query,
      interpreted: searchData,
      filters: filters,
      results: recommendations,
      aiSummary: this.generateAISummary(searchData, recommendations.length)
    };
  }
  
  static extractEntities(text) {
    const lowerText = text.toLowerCase();
    
    return {
      city: this.extractCity(lowerText),
      maxPrice: this.extractPrice(lowerText, 'max'),
      minPrice: this.extractPrice(lowerText, 'min'),
      minRating: this.extractRating(lowerText),
      preferences: this.extractPreferences(lowerText),
      amenities: this.extractAmenities(lowerText),
      roomType: this.extractRoomType(lowerText),
      guests: this.extractGuests(lowerText),
      nights: this.extractNights(lowerText),
      isUrgent: /(?:tonight|today|now|asap)/i.test(lowerText)
    };
  }
  
  static extractCity(text) {
    const cities = ['goa', 'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'jaipur', 'agra', 'pune', 'kochi'];
    for (const city of cities) {
      if (text.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1);
    }
    return null;
  }
  
  static extractPrice(text, type) {
    let pattern = type === 'max' 
      ? /(?:under|below|less than|within|max|upto)\s*₹?\s*(\d+)/
      : /(?:above|over|more than|min)\s*₹?\s*(\d+)/;
    
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : null;
  }
  
  static extractRating(text) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*star/);
    return match ? parseFloat(match[1]) : null;
  }
  
  static extractPreferences(text) {
    const preferences = [];
    const prefMap = {
      'romantic': ['romantic', 'honeymoon', 'couple'],
      'beach': ['beach', 'sea', 'ocean'],
      'business': ['business', 'corporate', 'work'],
      'family': ['family', 'kids', 'children'],
      'luxury': ['luxury', 'premium', '5 star'],
      'budget': ['budget', 'cheap', 'affordable']
    };
    
    for (const [pref, keywords] of Object.entries(prefMap)) {
      if (keywords.some(kw => text.includes(kw))) {
        preferences.push(pref);
      }
    }
    return preferences;
  }
  
  static extractAmenities(text) {
    const amenities = [];
    const amenityList = ['pool', 'spa', 'wifi', 'breakfast', 'parking', 'gym', 'restaurant'];
    for (const amenity of amenityList) {
      if (text.includes(amenity)) amenities.push(amenity);
    }
    return amenities;
  }
  
  static extractRoomType(text) {
    if (text.includes('single')) return 'single';
    if (text.includes('double')) return 'double';
    if (text.includes('suite') || text.includes('luxury')) return 'suite';
    if (text.includes('family')) return 'family';
    return null;
  }
  
  static extractGuests(text) {
    const match = text.match(/(\d+)\s*(?:people|person|guest|adult|pax)/);
    return match ? parseInt(match[1]) : null;
  }
  
  static extractNights(text) {
    const match = text.match(/(\d+)\s*(?:night|days?)/);
    return match ? parseInt(match[1]) : null;
  }
  
  static async getAIRecommendations(filters) {
    try {
      const response = await fetch('https://bookora-server-22ox.onrender.com/api/ai-features/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: JSON.stringify(filters), filters })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI recommendations error:', error);
      return { results: [], total: 0 };
    }
  }
  
  static generateAISummary(searchData, resultCount) {
    const parts = [];
    if (searchData.city) parts.push(`in ${searchData.city}`);
    if (searchData.maxPrice) parts.push(`under ₹${searchData.maxPrice}`);
    if (searchData.preferences.length > 0) parts.push(`for ${searchData.preferences.join(' & ')} travel`);
    
    const location = parts.join(' ') || 'matching your criteria';
    return `🔍 Found ${resultCount} hotels ${location}`;
  }
}

export default AISearchService;