import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ai-features';

class AIService {
  // Get weather for a specific city
  static async getWeather(city) {
    try {
      // First, try to get real weather from backend
      const response = await axios.get(`${API_URL}/weather/${encodeURIComponent(city)}`);
      return response.data;
    } catch (error) {
      console.error('Weather fetch error:', error);
      // Return mock data as fallback
      return this.getMockWeather(city);
    }
  }

  // Mock weather data for fallback
  static getMockWeather(city) {
    const conditions = ['Sunny', 'Partly Cloudy', 'Clear Sky', 'Light Breeze'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const temperature = Math.floor(Math.random() * 20) + 20;
    
    return {
      city: city,
      current: {
        temperature: temperature,
        feels_like: temperature + Math.floor(Math.random() * 3) - 1,
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 60) + 40,
        wind_speed: Math.floor(Math.random() * 20) + 5,
        uv_index: Math.floor(Math.random() * 10) + 1
      },
      forecast: [
        { day: 'Today', high: temperature + 2, low: temperature - 3 },
        { day: 'Tomorrow', high: temperature + 3, low: temperature - 2 },
        { day: 'Wed', high: temperature + 1, low: temperature - 4 },
        { day: 'Thu', high: temperature + 4, low: temperature - 1 }
      ],
      recommendations: [
        '☀️ Perfect weather for outdoor activities',
        '🧴 Don\'t forget sunscreen',
        '🚶 Great for sightseeing'
      ]
    };
  }

  // Generate itinerary
  static async generateItinerary(hotel, duration, interests, budget) {
    try {
      const response = await axios.post(`${API_URL}/itinerary`, {
        hotel,
        duration,
        interests,
        budget
      });
      return response.data;
    } catch (error) {
      console.error('Itinerary error:', error);
      return null;
    }
  }

  // Compare prices
  static async comparePrices(hotelId) {
    try {
      const response = await axios.get(`${API_URL}/price-comparison/${hotelId}`);
      return response.data;
    } catch (error) {
      console.error('Price comparison error:', error);
      return null;
    }
  }

  // Negotiate price
  static async negotiatePrice(hotelId, budget, specialRequests) {
    try {
      const response = await axios.post(`${API_URL}/negotiate`, {
        hotelId,
        budget,
        specialRequests
      });
      return response.data;
    } catch (error) {
      console.error('Negotiation error:', error);
      return null;
    }
  }

  // Group travel planning
  static async planGroupTrip(rooms, people, preferences, budget, city) {
    try {
      const response = await axios.post(`${API_URL}/group-plan`, {
        rooms,
        people,
        preferences,
        budget,
        city
      });
      return response.data;
    } catch (error) {
      console.error('Group plan error:', error);
      return null;
    }
  }

  // AI search
  static async aiSearch(query) {
    try {
      const response = await axios.post(`${API_URL}/ai-search`, { query });
      return response.data;
    } catch (error) {
      console.error('AI search error:', error);
      return null;
    }
  }

  // Translate text
  static async translateText(text, targetLanguage) {
    try {
      const response = await axios.post(`${API_URL}/translate`, {
        text,
        targetLanguage
      });
      return response.data;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }
}

export default AIService;