class SmartItinerary {
  async generateItinerary(hotel, duration, interests, budget = 5000) {
    const location = hotel.city;
    const hotelPrice = hotel.pricePerNight;
    
    // Calculate budget allocation
    const dailyBudget = budget / duration;
    const accommodationCost = hotelPrice;
    const remainingBudget = dailyBudget - accommodationCost;
    
    const itinerary = {
      summary: {
        destination: location,
        duration: `${duration} days`,
        hotel: hotel.name,
        total_budget: budget,
        daily_budget: dailyBudget,
        accommodation_cost: accommodationCost,
        activities_budget: remainingBudget
      },
      days: [],
      recommendations: [],
      packing_list: [],
      best_time_to_visit: await this.getBestTimeToVisit(location),
      local_tips: await this.getLocalTips(location)
    };

    // Generate day-wise plan
    for (let i = 1; i <= duration; i++) {
      const dayPlan = await this.generateDayPlan(location, i, interests, remainingBudget / duration);
      itinerary.days.push(dayPlan);
    }

    // Get recommendations based on interests
    itinerary.recommendations = await this.getRecommendations(location, interests);
    
    // Generate packing list based on weather and activities
    itinerary.packing_list = await this.generatePackingList(location, interests);
    
    return itinerary;
  }

  async generateDayPlan(location, day, interests, dailyActivityBudget) {
    const activities = await this.getActivitiesByInterest(location, interests);
    
    return {
      day: day,
      date: this.getDateForDay(day),
      theme: this.getDayTheme(interests, day),
      morning: {
        time: "08:00 - 12:00",
        activity: activities.morning,
        description: await this.getActivityDescription(activities.morning, location),
        cost: Math.floor(dailyActivityBudget * 0.3),
        tips: await this.getActivityTips(activities.morning)
      },
      afternoon: {
        time: "12:00 - 17:00",
        activity: activities.afternoon,
        description: await this.getActivityDescription(activities.afternoon, location),
        cost: Math.floor(dailyActivityBudget * 0.4),
        tips: await this.getActivityTips(activities.afternoon)
      },
      evening: {
        time: "17:00 - 22:00",
        activity: activities.evening,
        description: await this.getActivityDescription(activities.evening, location),
        cost: Math.floor(dailyActivityBudget * 0.3),
        tips: await this.getActivityTips(activities.evening)
      },
      meals: {
        breakfast: await this.getMealRecommendation(location, 'breakfast'),
        lunch: await this.getMealRecommendation(location, 'lunch'),
        dinner: await this.getMealRecommendation(location, 'dinner')
      },
      estimated_total: dailyActivityBudget
    };
  }

  async getActivitiesByInterest(location, interests) {
    const activityDatabase = {
      beach: {
        morning: 'Sunrise beach walk and yoga session',
        afternoon: 'Water sports and beach games',
        evening: 'Sunset cruise and beach party'
      },
      adventure: {
        morning: 'Trekking or hiking expedition',
        afternoon: 'Rock climbing or river rafting',
        evening: 'Campfire and stargazing'
      },
      culture: {
        morning: 'Heritage site visit',
        afternoon: 'Local market and museum tour',
        evening: 'Cultural show and traditional dinner'
      },
      relaxation: {
        morning: 'Spa and wellness session',
        afternoon: 'Pool time and reading',
        evening: 'Fine dining and sunset viewing'
      },
      family: {
        morning: 'Theme park or zoo visit',
        afternoon: 'Family-friendly activities',
        evening: 'Dinner at family restaurant'
      },
      nightlife: {
        morning: 'Sleep in and brunch',
        afternoon: 'Beach or pool time',
        evening: 'Club hopping and bar crawl'
      }
    };

    const primaryInterest = interests[0] || 'relaxation';
    return activityDatabase[primaryInterest] || activityDatabase.relaxation;
  }

  async getActivityDescription(activity, location) {
    const descriptions = {
      'Sunrise beach walk': `Start your day with a peaceful walk along ${location}'s beautiful beaches. Perfect for morning meditation and photography.`,
      'Water sports': `Enjoy thrilling water sports like jet skiing, parasailing, and banana boat rides. Professional instructors available.`,
      'Heritage site': `Explore the rich history and architecture of ${location}'s most famous heritage sites.`,
      'Spa session': `Rejuvenate with traditional Ayurvedic treatments and massages at renowned spas.`
    };
    return descriptions[activity] || `Experience the best of ${activity} in ${location}.`;
  }

  async getActivityTips(activity) {
    const tips = {
      'Sunrise beach walk': 'Start at 6 AM for best views. Carry a camera and water bottle.',
      'Water sports': 'Book in advance. Carry extra clothes and sunscreen.',
      'Heritage site': 'Hire a local guide for better experience. Wear comfortable shoes.',
      'Spa session': 'Book 24 hours in advance. Arrive 15 minutes early.'
    };
    return tips[activity] || 'Plan ahead and carry necessary items.';
  }

  async getMealRecommendation(location, mealType) {
    const restaurants = {
      beach: {
        breakfast: 'Beachside cafe with fresh coconut water and poha',
        lunch: 'Seafood shack serving fresh catch of the day',
        dinner: 'Rooftop restaurant with sea view'
      },
      city: {
        breakfast: 'Local street food - vada pav, idli, dosa',
        lunch: 'Biryani house or thali restaurant',
        dinner: 'Fine dining with city views'
      },
      hill: {
        breakfast: 'Cafe with mountain view and fresh bakery',
        lunch: 'Local cuisine - momos, thukpa',
        dinner: 'Bonfire dinner with live music'
      }
    };
    
    const locationType = location === 'goa' ? 'beach' : 'city';
    return restaurants[locationType][mealType];
  }

  async getRecommendations(location, interests) {
    const recommendations = {
      must_visit: [
        `Iconic landmarks in ${location}`,
        'Local hidden gems',
        'Famous food joints'
      ],
      activities: [
        `${interests[0]} activities nearby`,
        'Group tours available',
        'Photography spots'
      ],
      restaurants: [
        'Top-rated local restaurants',
        'Budget-friendly eateries',
        'Specialty cuisine places'
      ]
    };
    return recommendations;
  }

  async generatePackingList(location, interests) {
    const essentials = [
      'Valid ID proof',
      'Hotel booking confirmation',
      'Travel insurance documents'
    ];
    
    const activityBased = {
      beach: ['Swimsuit', 'Sunscreen', 'Sunglasses', 'Flip flops', 'Beach towel'],
      adventure: ['Hiking shoes', 'Backpack', 'First aid kit', 'Energy bars'],
      culture: ['Comfortable walking shoes', 'Camera', 'Notebook', 'Local currency'],
      relaxation: ['Comfortable clothes', 'Books', 'Spa wear', 'Yoga mat']
    };
    
    const primaryInterest = interests[0] || 'relaxation';
    return [...essentials, ...(activityBased[primaryInterest] || activityBased.relaxation)];
  }

  async getBestTimeToVisit(location) {
    const seasons = {
      goa: 'November to February (Pleasant weather, perfect for beach activities)',
      mumbai: 'October to March (Cool and dry weather)',
      default: 'October to March (Best weather conditions)'
    };
    return seasons[location.toLowerCase()] || seasons.default;
  }

  async getLocalTips(location) {
    return [
      `Download offline maps for ${location}`,
      'Keep local emergency numbers handy',
      'Try local public transport for authentic experience',
      'Learn a few local language phrases',
      'Respect local customs and traditions'
    ];
  }

  getDateForDay(day) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + day - 1);
    return futureDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getDayTheme(interests, day) {
    const themes = {
      1: 'Arrival and Exploration',
      2: 'Adventure and Activities',
      3: 'Culture and Relaxation'
    };
    return themes[day] || 'Discovery Day';
  }
}

module.exports = new SmartItinerary();