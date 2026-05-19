const Hotel = require('../models/Hotel');

class AITravelAssistant {
  constructor() {
    // Field name mappings for different possible database schemas
    this.fieldMappings = {
      priceFields: ['pricePerNight', 'price', 'rate', 'cost', 'nightlyRate', 'amount'],
      nameFields: ['name', 'hotelName', 'title', 'propertyName'],
      cityFields: ['city', 'location', 'cityName', 'addressCity'],
      ratingFields: ['rating', 'averageRating', 'starRating', 'stars'],
      imageFields: ['images', 'photos', 'pictures', 'imageUrls']
    };

    this.intentKeywords = {
      romantic: ['romantic', 'honeymoon', 'couple', 'love', 'anniversary', 'wedding', 'date'],
      budget: ['budget', 'cheap', 'affordable', 'economical', 'low cost', 'inexpensive', 'value'],
      luxury: ['luxury', 'premium', '5-star', 'expensive', 'high-end', 'lavish', 'deluxe'],
      business: ['business', 'corporate', 'work', 'conference', 'meeting', 'office', 'professional'],
      family: ['family', 'kids', 'children', 'child-friendly', 'family-friendly', 'with children'],
      beach: ['beach', 'sea', 'ocean', 'coastal', 'shore', 'seaside', 'beachfront'],
      mountain: ['mountain', 'hill', 'mountain view', 'hill station', 'valley', 'peak'],
      pool: ['pool', 'swimming pool', 'swim', 'water'],
      spa: ['spa', 'wellness', 'massage', 'sauna', 'jacuzzi'],
      wifi: ['wifi', 'internet', 'broadband', 'high-speed internet']
    };

    this.cityCoordinates = {
      'goa': [73.827, 15.2993],
      'mumbai': [72.8777, 19.0760],
      'delhi': [77.2090, 28.6139],
      'bangalore': [77.5946, 12.9716],
      'hyderabad': [78.4867, 17.3850],
      'chennai': [80.2707, 13.0827],
      'kolkata': [88.3639, 22.5726],
      'jaipur': [75.7873, 26.9124],
      'agra': [78.0081, 27.1767],
      'pune': [73.8567, 18.5204],
      'kochi': [76.2675, 9.9312],
      'udaipur': [73.7125, 24.5854]
    };
  }

  // Helper method to extract field value from hotel object
  getFieldValue(hotel, possibleFields) {
    for (const field of possibleFields) {
      if (hotel[field] !== undefined && hotel[field] !== null) {
        return hotel[field];
      }
    }
    return null;
  }

  // Normalize hotel data to standard format
  normalizeHotel(hotel) {
    const hotelObj = hotel.toObject ? hotel.toObject() : hotel;
    
    return {
      ...hotelObj,
      _id: hotelObj._id,
      name: this.getFieldValue(hotelObj, this.fieldMappings.nameFields) || 'Unnamed Hotel',
      pricePerNight: this.getFieldValue(hotelObj, this.fieldMappings.priceFields) || 0,
      city: this.getFieldValue(hotelObj, this.fieldMappings.cityFields) || 'Unknown',
      rating: this.getFieldValue(hotelObj, this.fieldMappings.ratingFields) || 0,
      images: this.getFieldValue(hotelObj, this.fieldMappings.imageFields) || []
    };
  }

  async processQuery(query) {
    const extracted = this.extractEnhancedInfo(query);
    const matches = await this.searchHotelsAdvanced(extracted);
    
    // Normalize all hotels first
    const normalizedMatches = matches.map(hotel => this.normalizeHotel(hotel));
    
    const ranked = this.rankMatchesEnhanced(normalizedMatches, extracted);
    
    return {
      query: query,
      extracted_info: extracted,
      results: ranked,
      total_matches: ranked.length,
      assistant_note: this.generateEnhancedNote(ranked, extracted),
      search_summary: this.generateSearchSummary(extracted, ranked.length)
    };
  }

  extractEnhancedInfo(query) {
    const lowerQuery = query.toLowerCase();
    const extracted = {
      location: null,
      maxPrice: null,
      minPrice: null,
      travelers: null,
      checkIn: null,
      checkOut: null,
      preferences: [],
      tripType: 'budget',
      amenities: [],
      minRating: null,
      duration: null
    };

    // Enhanced location extraction with synonyms
    const locationSynonyms = {
      'goa': ['goa', 'goan', 'north goa', 'south goa', 'panaji'],
      'mumbai': ['mumbai', 'bombay', 'sobo', 'andheri', 'bandra'],
      'bangalore': ['bangalore', 'bengaluru', 'blr', 'electronic city', 'whitefield'],
      'delhi': ['delhi', 'new delhi', 'ncr', 'south delhi', 'north delhi'],
      'hyderabad': ['hyderabad', 'secunderabad', 'hitec city', 'gachibowli'],
      'chennai': ['chennai', 'madras', 'omr', 'egmore'],
      'jaipur': ['jaipur', 'pink city', 'jpr'],
      'kolkata': ['kolkata', 'calcutta', 'salt lake', 'park street']
    };

    for (const [city, synonyms] of Object.entries(locationSynonyms)) {
      if (synonyms.some(synonym => lowerQuery.includes(synonym))) {
        extracted.location = city;
        break;
      }
    }

    if (!extracted.location) {
      const cities = Object.keys(locationSynonyms);
      for (const city of cities) {
        if (lowerQuery.includes(city)) {
          extracted.location = city;
          break;
        }
      }
    }

    // Enhanced price extraction with various formats
    const pricePatterns = [
      /under\s*₹?\s*(\d+)/i,
      /less than\s*₹?\s*(\d+)/i,
      /max\s*₹?\s*(\d+)/i,
      /budget\s*₹?\s*(\d+)/i,
      /below\s*₹?\s*(\d+)/i,
      /upto\s*₹?\s*(\d+)/i,
      /(\d+)\s*rupees/i,
      /₹\s*(\d+)/i,
      /under\s*(\d+)/i,
      /less than\s*(\d+)/i
    ];

    for (const pattern of pricePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        extracted.maxPrice = parseInt(match[1]);
        break;
      }
    }

    // Minimum price extraction
    const minPricePatterns = [
      /above\s*₹?\s*(\d+)/i,
      /more than\s*₹?\s*(\d+)/i,
      /min\s*₹?\s*(\d+)/i,
      /starting from\s*₹?\s*(\d+)/i
    ];

    for (const pattern of minPricePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        extracted.minPrice = parseInt(match[1]);
        break;
      }
    }

    // Trip type detection with scoring
    let typeScores = {
      romantic: 0,
      budget: 0,
      luxury: 0,
      business: 0,
      family: 0
    };

    for (const [type, keywords] of Object.entries(this.intentKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          if (type in typeScores) {
            typeScores[type] += 1;
          } else if (['beach', 'mountain', 'pool', 'spa', 'wifi'].includes(type)) {
            extracted.preferences.push(type);
          } else {
            extracted.amenities.push(type);
          }
        }
      }
    }

    let maxScore = 0;
    for (const [type, score] of Object.entries(typeScores)) {
      if (score > maxScore) {
        maxScore = score;
        extracted.tripType = type;
      }
    }

    extracted.preferences = [...new Set(extracted.preferences)];
    extracted.amenities = [...new Set(extracted.amenities)];

    const ratingMatch = lowerQuery.match(/(\d+)\s*star/i) || lowerQuery.match(/above\s*(\d+)\s*stars/i);
    if (ratingMatch) {
      extracted.minRating = parseInt(ratingMatch[1]);
    }

    return extracted;
  }

  async searchHotelsAdvanced(criteria) {
    let query = {};

    if (criteria.location) {
      query.city = { $regex: new RegExp(criteria.location, 'i') };
    }

    // Try multiple price field names in the database query
    const priceFields = this.fieldMappings.priceFields;
    let priceQuery = {};
    
    if (criteria.maxPrice) {
      priceQuery = { $or: priceFields.map(field => ({ [field]: { $lte: criteria.maxPrice } })) };
    }
    if (criteria.minPrice) {
      const minQuery = { $or: priceFields.map(field => ({ [field]: { $gte: criteria.minPrice } })) };
      priceQuery = priceQuery.$or ? 
        { $and: [priceQuery, minQuery] } : 
        minQuery;
    }

    if (Object.keys(priceQuery).length > 0) {
      query = { ...query, ...priceQuery };
    }

    if (criteria.minRating) {
      const ratingFields = this.fieldMappings.ratingFields;
      query.$or = ratingFields.map(field => ({ [field]: { $gte: criteria.minRating } }));
    }

    console.log('Searching hotels with query:', JSON.stringify(query, null, 2));
    
    try {
      let hotels = await Hotel.find(query)
        .populate('reviews')
        .limit(50);
      
      console.log(`Found ${hotels.length} hotels matching basic criteria`);
      
      if (hotels.length === 0 && criteria.location) {
        console.log('No exact matches, trying broader search...');
        const broadQuery = { 
          city: { $regex: new RegExp(criteria.location, 'i') } 
        };
        hotels = await Hotel.find(broadQuery).populate('reviews').limit(50);
        console.log(`Found ${hotels.length} hotels in ${criteria.location} with broad search`);
      }
      
      // Log sample hotel data for debugging
      if (hotels.length > 0) {
        const sample = hotels[0];
        console.log('Sample hotel from DB:', {
          id: sample._id,
          availableFields: Object.keys(sample.toObject()),
          priceFields: this.fieldMappings.priceFields.map(f => ({ field: f, value: sample[f] }))
        });
      }
      
      return hotels;
    } catch (error) {
      console.error('Error searching hotels:', error);
      return [];
    }
  }

  rankMatchesEnhanced(hotels, criteria) {
    console.log('=== Ranking Hotels ===');
    console.log(`Total hotels to rank: ${hotels.length}`);
    
    if (!hotels || hotels.length === 0) {
      return [];
    }

    const rankedHotels = hotels.map(hotel => {
      let score = 0;
      let reasons = [];
      let detailedScores = {};

      const hotelPrice = hotel.pricePerNight; // Already normalized
      const hotelName = hotel.name;
      
      console.log(`Processing hotel: ${hotelName}, Price: ${hotelPrice}`);

      // 1. Price Score (0-30 points)
      if (criteria.maxPrice && hotelPrice > 0) {
        const priceRatio = hotelPrice / criteria.maxPrice;
        if (priceRatio <= 0.3) {
          score += 30;
          reasons.push(`💎 Excellent value at ₹${hotelPrice} (well under ₹${criteria.maxPrice})`);
          detailedScores.price = 30;
        } else if (priceRatio <= 0.6) {
          score += 25;
          reasons.push(`💰 Great price at ₹${hotelPrice} (below ₹${criteria.maxPrice})`);
          detailedScores.price = 25;
        } else if (priceRatio <= 0.8) {
          score += 20;
          reasons.push(`✓ Within your budget of ₹${criteria.maxPrice}`);
          detailedScores.price = 20;
        } else if (priceRatio <= 1) {
          score += 10;
          reasons.push(`📊 At your budget limit (₹${hotelPrice}/night)`);
          detailedScores.price = 10;
        } else {
          const overAmount = hotelPrice - criteria.maxPrice;
          score -= 10;
          reasons.push(`⚠️ Slightly above budget (₹${hotelPrice} - ₹${overAmount} over)`);
          detailedScores.price = -10;
        }
      } else if (hotelPrice > 0) {
        if (hotelPrice < 3000) {
          score += 15;
          reasons.push(`💰 Budget-friendly option at ₹${hotelPrice}`);
          detailedScores.price = 15;
        } else if (hotelPrice < 7000) {
          score += 10;
          detailedScores.price = 10;
        }
      } else {
        reasons.push(`📞 Contact for pricing`);
        detailedScores.price = 0;
      }

      // 2. Trip Type Matching (0-40 points)
      const typeScoresMap = {
        romantic: hotel.romanticScore || 0.3,
        budget: hotel.budgetScore || (hotelPrice > 0 && hotelPrice < 4000 ? 0.8 : 0.3),
        luxury: hotel.luxuryScore || (hotelPrice > 0 && hotelPrice > 8000 ? 0.8 : 0.2),
        business: hotel.businessScore || 0.3,
        family: hotel.familyScore || 0.3
      };

      const typeScoreValue = typeScoresMap[criteria.tripType] || 0.3;
      const typePoints = typeScoreValue * 40;
      score += typePoints;
      detailedScores.tripType = typePoints;

      if (typeScoreValue > 0.7) {
        reasons.push(`🎯 Perfect for ${criteria.tripType} travel`);
      } else if (typeScoreValue > 0.4) {
        reasons.push(`👍 Good choice for ${criteria.tripType} travelers`);
      }

      // 3. Preference Matching (0-25 points)
      let preferenceMatchCount = 0;
      if (criteria.preferences && criteria.preferences.length > 0) {
        for (const pref of criteria.preferences) {
          if (pref === 'beach' && (hotel.nearBeach || hotel.aiTags?.includes('beach-view'))) {
            preferenceMatchCount += 1;
            reasons.push(`🏖️ Located near the beach`);
          }
          if (pref === 'mountain' && hotel.aiTags?.includes('mountain-view')) {
            preferenceMatchCount += 1;
            reasons.push(`⛰️ Beautiful mountain views`);
          }
          if (pref === 'pool' && hotel.amenities?.some(a => a.toLowerCase().includes('pool'))) {
            preferenceMatchCount += 1;
            reasons.push(`🏊 Swimming pool available`);
          }
          if (pref === 'spa' && hotel.amenities?.some(a => a.toLowerCase().includes('spa'))) {
            preferenceMatchCount += 1;
            reasons.push(`💆‍♀️ Spa and wellness center`);
          }
        }
        const preferencePoints = (preferenceMatchCount / criteria.preferences.length) * 25;
        score += preferencePoints;
        detailedScores.preferences = preferencePoints;
      }

      // 4. Rating Score (0-20 points)
      const rating = hotel.rating || 0;
      const ratingScore = (rating / 5) * 20;
      score += ratingScore;
      detailedScores.rating = ratingScore;
      
      if (rating >= 4.5) {
        reasons.push(`⭐ Exceptional rating of ${rating}/5 from guests`);
      } else if (rating >= 4.0) {
        reasons.push(`👍 Highly rated at ${rating}/5`);
      }

      // Cap score at 100
      score = Math.min(Math.max(Math.round(score), 0), 100);
      
      const result = {
        ...hotel,
        _id: hotel._id,
        name: hotelName,
        pricePerNight: hotelPrice,
        ai_score: score,
        ai_reasons: reasons.slice(0, 4),
        detailed_scores: detailedScores,
        match_breakdown: {
          price_match: criteria.maxPrice ? `₹${hotelPrice} / ₹${criteria.maxPrice}` : 'N/A',
          trip_type_match: criteria.tripType,
          preference_matches: `${preferenceMatchCount}/${criteria.preferences?.length || 0}`
        }
      };
      
      return result;
    }).sort((a, b) => b.ai_score - a.ai_score);
    
    console.log(`Ranked ${rankedHotels.length} hotels, top score: ${rankedHotels[0]?.ai_score}`);
    return rankedHotels;
  }

  calculateRomanticScore(hotel) {
    let score = 0.3;
    if (hotel.aiTags?.includes('romantic') || hotel.aiTags?.includes('honeymoon-special')) score += 0.4;
    if (hotel.amenities?.some(a => a.toLowerCase().includes('spa') || a.toLowerCase().includes('dinner'))) score += 0.2;
    if (hotel.nearBeach) score += 0.1;
    return Math.min(score, 1);
  }

  calculateBusinessScore(hotel) {
    let score = 0.3;
    if (hotel.aiTags?.includes('business-friendly')) score += 0.3;
    if (hotel.amenities?.some(a => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('conference'))) score += 0.2;
    if (hotel.nearAirport || hotel.nearMetro) score += 0.2;
    return Math.min(score, 1);
  }

  calculateFamilyScore(hotel) {
    let score = 0.3;
    if (hotel.aiTags?.includes('family-friendly')) score += 0.4;
    if (hotel.amenities?.some(a => a.toLowerCase().includes('pool') || a.toLowerCase().includes('play area'))) score += 0.2;
    if (hotel.pricePerNight < 5000) score += 0.1;
    return Math.min(score, 1);
  }

  generateEnhancedNote(ranked, criteria) {
    if (ranked.length === 0) {
      if (criteria.location) {
        return `I couldn't find hotels matching your criteria in ${criteria.location}. Try:\n• Removing the price filter\n• Checking nearby cities\n• Increasing your budget`;
      }
      return "I couldn't find hotels matching your exact criteria. Try adjusting your budget, location, or preferences?";
    }
    
    const top = ranked[0];
    const avgPrice = ranked.slice(0, 5).reduce((sum, h) => sum + (h.pricePerNight || 0), 0) / Math.min(5, ranked.length);
    
    let note = `✨ I found ${ranked.length} hotel(s) matching your request. `;
    
    if (criteria.tripType === 'romantic') {
      note += `💕 ${top.name} is perfect for your romantic getaway with ${top.ai_score}% match! `;
    } else if (criteria.tripType === 'budget') {
      note += `💰 The average price is ₹${Math.round(avgPrice)}/night. ${top.name} offers great value at ₹${top.pricePerNight}/night! `;
    } else if (criteria.tripType === 'luxury') {
      note += `👑 ${top.name} provides premium amenities with a ${top.ai_score}% match to your luxury preferences. `;
    } else {
      note += `🏆 ${top.name} is my top recommendation with ${top.ai_score}% match to your preferences. `;
    }
    
    if (criteria.maxPrice) {
      note += `All options are within your ₹${criteria.maxPrice} budget.`;
    }
    
    return note;
  }

  generateSearchSummary(extracted, totalMatches) {
    const summary = [];
    if (extracted.location) summary.push(`📍 Location: ${extracted.location}`);
    if (extracted.maxPrice) summary.push(`💰 Budget: upto ₹${extracted.maxPrice}`);
    if (extracted.tripType) summary.push(`🎯 Trip type: ${extracted.tripType}`);
    if (extracted.preferences.length > 0) summary.push(`✨ Preferences: ${extracted.preferences.join(', ')}`);
    summary.push(`📊 Results: ${totalMatches} hotels found`);
    return summary;
  }
}

module.exports = new AITravelAssistant();