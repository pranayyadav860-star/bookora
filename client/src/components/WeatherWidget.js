import React, { useState, useEffect } from 'react';
import { FaSun, FaCloud, FaCloudRain, FaWind, FaTint, FaMapMarkerAlt, FaSpinner, FaCloudSun, FaSnowflake } from 'react-icons/fa';
import AIService from '../services/temp';

const WeatherWidget = ({ city }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidCity, setIsValidCity] = useState(false);

  // List of valid Indian cities for weather
  const validCities = [
    'goa', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 
    'kolkata', 'jaipur', 'agra', 'pune', 'kochi', 'udaipur', 'manali', 'shimla',
    'darjeeling', 'ooty', 'munnar', 'varanasi', 'amritsar', 'chandigarh', 'lucknow',
    'nagpur', 'indore', 'bhopal', 'surat', 'ahmedabad', 'thiruvananthapuram', 'vizag'
  ];

  // Check if the input is a valid city
  useEffect(() => {
    if (!city || typeof city !== 'string') {
      setIsValidCity(false);
      setWeather(null);
      return;
    }

    const cityLower = city.toLowerCase().trim();
    const isValid = validCities.some(validCity => 
      cityLower === validCity || 
      cityLower.includes(validCity) || 
      validCity.includes(cityLower)
    );
    
    setIsValidCity(isValid);
    
    if (isValid && city.length > 2) {
      fetchWeather();
    } else {
      setWeather(null);
      setError(null);
    }
  }, [city]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get city name for API (first letter uppercase)
      const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
      const data = await AIService.getWeather(cityName);
      
      if (data && data.current) {
        setWeather(data);
      } else {
        setError('Weather data not available');
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) 
      return <FaSun className="text-yellow-500" size={32} />;
    if (conditionLower.includes('cloud')) 
      return <FaCloud className="text-gray-500" size={32} />;
    if (conditionLower.includes('rain')) 
      return <FaCloudRain className="text-blue-500" size={32} />;
    if (conditionLower.includes('snow')) 
      return <FaSnowflake className="text-blue-300" size={32} />;
    return <FaCloudSun className="text-yellow-500" size={32} />;
  };

  // Don't show widget if no valid city
  if (!city || !isValidCity || city.length < 2) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="opacity-75" />
              <h3 className="font-semibold">{city}</h3>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <FaSpinner className="animate-spin" />
              <span>Loading weather...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !weather) {
    return (
      <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="opacity-75" />
              <h3 className="font-semibold">{city}</h3>
            </div>
            <p className="text-sm opacity-75 mt-1">Weather data unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 text-white">
        {/* Location Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="opacity-75" />
            <h3 className="font-semibold text-lg">{weather.city}</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{weather.current.temperature}°C</div>
            <div className="text-xs opacity-75">Feels like {weather.current.feels_like}°C</div>
          </div>
        </div>

        {/* Weather Condition */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.current.condition)}
            <div>
              <div className="font-medium">{weather.current.condition}</div>
              <div className="text-xs opacity-75">Humidity: {weather.current.humidity}%</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="flex items-center gap-1">
              <FaWind /> {weather.current.wind_speed} km/h
            </div>
            <div>UV: {weather.current.uv_index}</div>
          </div>
        </div>

        {/* Travel Tips */}
        {weather.recommendations && weather.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-400">
            <p className="text-xs font-semibold mb-2">💡 Travel Tips:</p>
            <ul className="text-xs space-y-1 opacity-90">
              {weather.recommendations.slice(0, 2).map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 5-Day Forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="bg-blue-700/30 px-4 py-2">
          <div className="flex justify-between">
            {weather.forecast.slice(0, 4).map((day, idx) => (
              <div key={idx} className="text-center text-white">
                <div className="text-xs font-medium">{day.day}</div>
                <div className="text-sm mt-1">{day.high}°</div>
                <div className="text-xs opacity-75">{day.low}°</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;