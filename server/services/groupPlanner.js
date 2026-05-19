class GroupPlanner {
  async createGroupPlan(rooms, people, preferences, budget, city) {
    const Hotel = require('../models/Hotel');
    
    // Search for suitable hotels
    const hotels = await this.findGroupFriendlyHotels(city, budget, rooms);
    
    // Calculate optimal room distribution
    const roomDistribution = this.calculateRoomDistribution(people, rooms, preferences);
    
    // Generate group itinerary
    const groupItinerary = await this.generateGroupItinerary(city, preferences);
    
    // Calculate group discounts
    const groupDiscounts = this.calculateGroupDiscounts(rooms, people);
    
    // Split cost options
    const costSplit = this.calculateCostSplit(people, rooms, budget);
    
    return {
      summary: {
        total_people: people,
        total_rooms: rooms,
        city: city,
        total_budget: budget,
        per_person_cost: budget / people
      },
      hotel_recommendations: hotels,
      room_distribution: roomDistribution,
      group_itinerary: groupItinerary,
      group_discounts: groupDiscounts,
      cost_split_options: costSplit,
      group_activities: await this.getGroupActivities(city, preferences),
      coordination_tools: this.getCoordinationTools(),
      tips_for_group_travel: this.getGroupTravelTips()
    };
  }

  async findGroupFriendlyHotels(city, budget, rooms) {
    const Hotel = require('../models/Hotel');
    const hotels = await Hotel.find({ 
      city: { $regex: new RegExp(city, 'i') },
      pricePerNight: { $lte: budget / rooms }
    }).limit(5);
    
    return hotels.map(hotel => ({
      ...hotel.toObject(),
      suitability_score: this.calculateGroupSuitability(hotel),
      group_deal: this.getGroupDeal(hotel, rooms),
      amenities_for_groups: this.getGroupAmenities(hotel)
    }));
  }

  calculateGroupSuitability(hotel) {
    let score = 0;
    
    if (hotel.amenities) {
      if (hotel.amenities.some(a => a.toLowerCase().includes('pool'))) score += 20;
      if (hotel.amenities.some(a => a.toLowerCase().includes('restaurant'))) score += 15;
      if (hotel.amenities.some(a => a.toLowerCase().includes('conference'))) score += 20;
      if (hotel.amenities.some(a => a.toLowerCase().includes('wifi'))) score += 10;
      if (hotel.amenities.some(a => a.toLowerCase().includes('parking'))) score += 10;
    }
    
    if (hotel.rating >= 4) score += 25;
    else if (hotel.rating >= 3.5) score += 15;
    
    return Math.min(score, 100);
  }

  getGroupDeal(hotel, rooms) {
    const basePrice = hotel.pricePerNight;
    
    if (rooms >= 5) {
      return {
        discount: '20% off',
        price_per_room: Math.round(basePrice * 0.8),
        freebies: ['2 complimentary rooms', 'Free breakfast for all', 'Group coordinator']
      };
    } else if (rooms >= 3) {
      return {
        discount: '15% off',
        price_per_room: Math.round(basePrice * 0.85),
        freebies: ['1 complimentary room', 'Free breakfast for all']
      };
    } else {
      return {
        discount: '10% off',
        price_per_room: Math.round(basePrice * 0.9),
        freebies: ['Free breakfast for all']
      };
    }
  }

  getGroupAmenities(hotel) {
    const amenities = [];
    
    if (hotel.amenities) {
      if (hotel.amenities.some(a => a.toLowerCase().includes('pool'))) {
        amenities.push('Pool suitable for groups');
      }
      if (hotel.amenities.some(a => a.toLowerCase().includes('restaurant'))) {
        amenities.push('Group dining area');
      }
      if (hotel.amenities.some(a => a.toLowerCase().includes('conference'))) {
        amenities.push('Meeting/conference room');
      }
      if (hotel.amenities.some(a => a.toLowerCase().includes('wifi'))) {
        amenities.push('High-speed WiFi for multiple devices');
      }
    }
    
    amenities.push('Interconnecting rooms option');
    amenities.push('Group check-in service');
    
    return amenities;
  }

  calculateRoomDistribution(people, rooms, preferences) {
    const distribution = [];
    let remainingPeople = people;
    let remainingRooms = rooms;
    
    // Standard distribution - prioritize couples and families
    if (preferences.includes('couples')) {
      const coupleRooms = Math.min(Math.floor(people / 2), rooms);
      for (let i = 0; i < coupleRooms; i++) {
        distribution.push({ type: 'Couple Room', occupants: 2, beds: '1 Queen/King', price_factor: 1 });
        remainingPeople -= 2;
        remainingRooms--;
      }
    }
    
    if (preferences.includes('families') && remainingRooms > 0) {
      const familyRooms = Math.min(Math.floor(remainingPeople / 3), remainingRooms);
      for (let i = 0; i < familyRooms; i++) {
        distribution.push({ type: 'Family Room', occupants: 3, beds: '1 Double + 1 Single', price_factor: 1.3 });
        remainingPeople -= 3;
        remainingRooms--;
      }
    }
    
    // Fill remaining with single/shared rooms
    if (remainingRooms > 0) {
      const sharedRooms = Math.min(remainingRooms, remainingPeople);
      for (let i = 0; i < sharedRooms; i++) {
        distribution.push({ type: 'Shared Room', occupants: Math.min(4, remainingPeople), beds: 'Multiple beds', price_factor: 1.2 });
        remainingPeople -= Math.min(4, remainingPeople);
      }
    }
    
    return {
      distribution: distribution,
      total_rooms_calculated: distribution.length,
      total_people_accommodated: people - remainingPeople,
      notes: remainingPeople > 0 ? 'Some people may need extra bedding' : 'Perfect fit'
    };
  }

  async generateGroupItinerary(city, preferences) {
    return {
      day_1: {
        theme: 'Arrival & Ice Breaking',
        activities: [
          'Check-in and room allocation',
          'Welcome lunch at hotel',
          'Ice-breaking games',
          'City orientation tour',
          'Welcome dinner with group'
        ]
      },
      day_2: {
        theme: 'Exploration & Activities',
        activities: preferences.includes('adventure') 
          ? ['Morning trek', 'Adventure sports', 'Group lunch', 'Sightseeing', 'Bonfire night']
          : ['City tour', 'Local market visit', 'Cultural show', 'Group dinner', 'Party night']
      },
      day_3: {
        theme: 'Leisure & Departure',
        activities: [
          'Free time for personal activities',
          'Group photo session',
          'Farewell lunch',
          'Feedback session',
          'Departure arrangements'
        ]
      }
    };
  }

  calculateGroupDiscounts(rooms, people) {
    const discounts = [];
    
    if (rooms >= 10) {
      discounts.push({
        type: 'Volume Discount',
        discount: '25% off on total booking',
        condition: '10+ rooms',
        savings: 'High'
      });
    } else if (rooms >= 5) {
      discounts.push({
        type: 'Group Discount',
        discount: '15% off on total booking',
        condition: '5-9 rooms',
        savings: 'Medium'
      });
    }
    
    if (people >= 20) {
      discounts.push({
        type: 'Corporate/Group Rate',
        discount: 'Free airport transfers + 10% off',
        condition: '20+ people',
        savings: 'Additional value'
      });
    }
    
    if (rooms >= 3) {
      discounts.push({
        type: 'Early Bird Discount',
        discount: '10% off',
        condition: 'Book 30+ days in advance',
        savings: '₹5000+'
      });
    }
    
    return discounts;
  }

  calculateCostSplit(people, rooms, totalBudget) {
    const perPersonBase = totalBudget / people;
    
    return {
      equal_split: {
        type: 'Equal Split',
        amount: Math.round(perPersonBase),
        description: 'Everyone pays the same amount',
        total: totalBudget
      },
      room_based_split: {
        type: 'Room-based Split',
        per_room: Math.round(totalBudget / rooms),
        description: 'Each room pays equally, occupants split room cost',
        example: `₹${Math.round(totalBudget / rooms)} per room`
      },
      custom_split: {
        type: 'Custom Split',
        description: 'Split based on room types and occupancy',
        options: [
          'Couples pay 30% more',
          'Singles pay 70% of couple rate',
          'Families with kids get 15% discount'
        ]
      }
    };
  }

  async getGroupActivities(city, preferences) {
    const activities = {
      adventure: [
        { name: 'Trekking', duration: '6 hours', cost: '₹2000/person', group_min: 5 },
        { name: 'River Rafting', duration: '3 hours', cost: '₹1500/person', group_min: 4 },
        { name: 'Camping', duration: '1 night', cost: '₹2500/person', group_min: 10 }
      ],
      cultural: [
        { name: 'City Tour', duration: '4 hours', cost: '₹1000/person', group_min: 6 },
        { name: 'Museum Visit', duration: '3 hours', cost: '₹500/person', group_min: 10 },
        { name: 'Cultural Show', duration: '2 hours', cost: '₹800/person', group_min: 15 }
      ],
      relaxation: [
        { name: 'Beach Day', duration: 'Full day', cost: '₹500/person', group_min: 1 },
        { name: 'Spa Package', duration: '3 hours', cost: '₹3000/person', group_min: 5 },
        { name: 'Pool Party', duration: 'Evening', cost: '₹1500/person', group_min: 10 }
      ]
    };
    
    const primaryPreference = preferences[0] || 'relaxation';
    return activities[primaryPreference] || activities.relaxation;
  }

  getCoordinationTools() {
    return [
      { name: 'Group Chat', feature: 'Real-time communication', available: true },
      { name: 'Expense Tracker', feature: 'Split bills automatically', available: true },
      { name: 'Poll Creator', feature: 'Decide activities together', available: true },
      { name: 'Shared Itinerary', feature: 'View plans together', available: true },
      { name: 'Live Location', feature: 'Track group members', available: true }
    ];
  }

  getGroupTravelTips() {
    return [
      '👥 Appoint a group coordinator for smooth communication',
      '💰 Use group expense apps to track shared costs',
      '📅 Plan buffer time between activities for flexibility',
      '🏨 Request interconnecting rooms for families/couples',
      '🚐 Consider renting a minibus for local travel',
      '📸 Designate photographers to capture group moments',
      '🎮 Plan group games/activities for bonding',
      '📋 Create a group checklist for packing essentials'
    ];
  }
}

module.exports = new GroupPlanner();