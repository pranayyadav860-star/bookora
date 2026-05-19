class WeatherService {
  async getWeatherForecast(city) {
    try {
      // In production, use OpenWeatherMap API
      // const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
      
      // Simulated weather data for demonstration
      const weatherData = this.generateWeatherData(city);
      
      return {
        city: city,
        current: weatherData.current,
        forecast: weatherData.forecast,
        recommendations: this.getWeatherRecommendations(weatherData),
        best_activities: this.getBestActivitiesForWeather(weatherData),
        packing_advice: this.getPackingAdvice(weatherData)
      };
    } catch (error) {
      console.error('Weather service error:', error);
      return this.getFallbackWeather(city);
    }
  }

  generateWeatherData(city) {
    const conditions = ['Sunny', 'Partly Cloudy', 'Clear Sky', 'Light Rain', 'Cloudy'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const temperature = Math.floor(Math.random() * 20) + 20; // 20-40°C
    
    return {
      current: {
        temperature: temperature,
        feels_like: temperature + Math.floor(Math.random() * 3) - 1,
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 60) + 40,
        wind_speed: Math.floor(Math.random() * 20) + 5,
        uv_index: Math.floor(Math.random() * 10) + 1,
        visibility: Math.floor(Math.random() * 8) + 2,
        air_quality: ['Good', 'Moderate', 'Poor'][Math.floor(Math.random() * 3)]
      },
      forecast: this.generateWeeklyForecast(temperature)
    };
  }

  generateWeeklyForecast(baseTemp) {
    const forecast = [];
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
    
    for (let i = 1; i <= 7; i++) {
      forecast.push({
        day: this.getDayName(i),
        date: this.getFutureDate(i),
        high: baseTemp + Math.floor(Math.random() * 5),
        low: baseTemp - Math.floor(Math.random() * 8),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        rain_chance: Math.floor(Math.random() * 60),
        humidity: Math.floor(Math.random() * 60) + 40
      });
    }
    
    return forecast;
  }

  getWeatherRecommendations(weather) {
    const temp = weather.current.temperature;
    const condition = weather.current.condition;
    
    const recommendations = [];
    
    if (temp > 30) {
      recommendations.push('☀️ Very hot! Stay hydrated and avoid midday sun');
      recommendations.push('🏖️ Perfect weather for beach and water activities');
      recommendations.push('🧴 Don\'t forget sunscreen and sunglasses');
    } else if (temp > 25) {
      recommendations.push('🌤️ Pleasant weather for outdoor activities');
      recommendations.push('🚶 Great for sightseeing and walking tours');
    } else if (temp < 20) {
      recommendations.push('🧥 Carry light jacket or sweater');
      recommendations.push('🔥 Perfect for indoor activities and hot beverages');
    }
    
    if (condition.includes('Rain')) {
      recommendations.push('☔ Carry umbrella - rain expected');
      recommendations.push('🏠 Plan indoor activities and museum visits');
    }
    
    if (weather.current.uv_index > 7) {
      recommendations.push('⚠️ High UV levels - use sunscreen SPF 50+');
    }
    
    return recommendations;
  }

  getBestActivitiesForWeather(weather) {
    const temp = weather.current.temperature;
    const condition = weather.current.condition;
    
    if (condition.includes('Rain')) {
      return [
        { activity: 'Shopping at malls', indoor: true, rating: '⭐⭐⭐⭐' },
        { activity: 'Visit museums/galleries', indoor: true, rating: '⭐⭐⭐⭐⭐' },
        { activity: 'Spa and wellness', indoor: true, rating: '⭐⭐⭐⭐' },
        { activity: 'Food tour (indoor restaurants)', indoor: true, rating: '⭐⭐⭐' }
      ];
    } else if (temp > 30) {
      return [
        { activity: 'Beach and water parks', indoor: false, rating: '⭐⭐⭐⭐⭐' },
        { activity: 'Pool time', indoor: false, rating: '⭐⭐⭐⭐' },
        { activity: 'Early morning trekking', indoor: false, rating: '⭐⭐⭐' },
        { activity: 'Air-conditioned cafes', indoor: true, rating: '⭐⭐⭐⭐' }
      ];
    } else {
      return [
        { activity: 'Sightseeing and tours', indoor: false, rating: '⭐⭐⭐⭐⭐' },
        { activity: 'Outdoor adventures', indoor: false, rating: '⭐⭐⭐⭐' },
        { activity: 'Photography walks', indoor: false, rating: '⭐⭐⭐⭐' },
        { activity: 'Local market visits', indoor: false, rating: '⭐⭐⭐' }
      ];
    }
  }

  getPackingAdvice(weather) {
    const temp = weather.current.temperature;
    const advice = ['Essentials: ID, phone charger, power bank'];
    
    if (temp > 30) {
      advice.push('👕 Light cotton clothes');
      advice.push('🩳 Shorts and sleeveless tops');
      advice.push('👒 Hat/cap and sunglasses');
      advice.push('🧴 High SPF sunscreen');
    } else if (temp > 25) {
      advice.push('👚 Light layers');
      advice.push('👖 Comfortable pants');
      advice.push('🧥 Light jacket for evenings');
    } else {
      advice.push('🧥 Warm jacket/sweater');
      advice.push('🧣 Scarf and gloves');
      advice.push('👖 Warm pants');
    }
    
    if (weather.current.condition.includes('Rain')) {
      advice.push('☔ Umbrella or raincoat');
      advice.push('👢 Waterproof shoes');
    }
    
    return advice;
  }

  getFallbackWeather(city) {
    return {
      city: city,
      current: {
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        wind_speed: 12
      },
      message: 'Using approximate weather data'
    };
  }

  getDayName(daysFromNow) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    return days[(today + daysFromNow) % 7];
  }

  getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

module.exports = new WeatherService();