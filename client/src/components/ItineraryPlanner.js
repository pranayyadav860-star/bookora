import React, { useState } from 'react';
import { FaCalendarAlt, FaMapMarkedAlt, FaUtensils, FaSun, FaMoon, FaDownload } from 'react-icons/fa';
import aiService from '../services/aiService';

const ItineraryPlanner = ({ hotel }) => {
  const [duration, setDuration] = useState(3);
  const [interests, setInterests] = useState(['relaxation']);
  const [budget, setBudget] = useState(15000);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);

  const interestOptions = [
    { value: 'beach', label: '🏖️ Beach', icon: '🏖️' },
    { value: 'romantic', label: '❤️ Romantic', icon: '❤️' },
    { value: 'adventure', label: '⛰️ Adventure', icon: '⛰️' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'relaxation', label: '🧘 Relaxation', icon: '🧘' },
    { value: 'cultural', label: '🎭 Cultural', icon: '🎭' }
  ];

  const handleGenerateItinerary = async () => {
    setLoading(true);
    try {
      const result = await aiService.generateItinerary(hotel, duration, interests, budget);
      if (result?.success) {
        setItinerary(result.itinerary);
      }
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (interest) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const downloadItinerary = () => {
    const dataStr = JSON.stringify(itinerary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `itinerary_${hotel.city}_${duration}days.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <>
      <button
        onClick={() => setShowPlanner(!showPlanner)}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
      >
        <FaMapMarkedAlt />
        Plan My Trip
      </button>

      {showPlanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaMapMarkedAlt className="text-green-500" />
                AI Travel Itinerary Planner
              </h2>
              <button
                onClick={() => setShowPlanner(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {!itinerary ? (
                <>
                  {/* Duration Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Trip Duration
                    </label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5, 7].map(day => (
                        <button
                          key={day}
                          onClick={() => setDuration(day)}
                          className={`px-4 py-2 rounded-lg transition ${
                            duration === day
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day} {day === 1 ? 'Day' : 'Days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Travel Interests
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleInterestToggle(option.value)}
                          className={`px-3 py-1 rounded-full transition ${
                            interests.includes(option.value)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Total Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Enter total budget"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Daily budget: ₹{(budget / duration).toFixed(0)} per day
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateItinerary}
                    disabled={loading}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Smart Itinerary'}
                  </button>
                </>
              ) : (
                <div>
                  {/* Summary */}
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold">{itinerary.summary?.destination}</h3>
                    <p className="text-sm opacity-90">{itinerary.summary?.duration}</p>
                    <p className="text-sm opacity-90">Total Budget: ₹{itinerary.summary?.total_budget}</p>
                    <p className="text-sm opacity-90">Daily Budget: ₹{itinerary.summary?.daily_budget}</p>
                  </div>

                  {/* Daily Itinerary */}
                  <div className="space-y-4 mb-6">
                    {itinerary.days?.map((day, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-3 font-semibold flex items-center gap-2">
                          <FaCalendarAlt className="text-green-500" />
                          Day {day.day} - {day.date}
                          <span className="text-sm text-gray-600 ml-auto">{day.theme}</span>
                        </div>
                        <div className="p-3 space-y-3">
                          {/* Morning */}
                          <div className="flex items-start gap-3">
                            <FaSun className="text-yellow-500 mt-1" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{day.morning?.time}</p>
                              <p className="text-sm">{day.morning?.activity}</p>
                              <p className="text-xs text-gray-500">{day.morning?.description}</p>
                              <p className="text-xs text-green-600">₹{day.morning?.cost}</p>
                            </div>
                          </div>
                          {/* Afternoon */}
                          <div className="flex items-start gap-3">
                            <FaSun className="text-orange-500 mt-1" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{day.afternoon?.time}</p>
                              <p className="text-sm">{day.afternoon?.activity}</p>
                              <p className="text-xs text-gray-500">{day.afternoon?.description}</p>
                              <p className="text-xs text-green-600">₹{day.afternoon?.cost}</p>
                            </div>
                          </div>
                          {/* Evening */}
                          <div className="flex items-start gap-3">
                            <FaMoon className="text-indigo-500 mt-1" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{day.evening?.time}</p>
                              <p className="text-sm">{day.evening?.activity}</p>
                              <p className="text-xs text-gray-500">{day.evening?.description}</p>
                              <p className="text-xs text-green-600">₹{day.evening?.cost}</p>
                            </div>
                          </div>
                          {/* Meals */}
                          {day.meals && (
                            <div className="bg-gray-50 p-2 rounded mt-2">
                              <div className="flex items-center gap-2 text-xs">
                                <FaUtensils />
                                <span>Breakfast: {day.meals?.breakfast}</span>
                                <span>•</span>
                                <span>Lunch: {day.meals?.lunch}</span>
                                <span>•</span>
                                <span>Dinner: {day.meals?.dinner}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {itinerary.recommendations && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">✨ Recommendations</h4>
                      <ul className="space-y-1">
                        {itinerary.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Packing List */}
                  {itinerary.packing_list && (
                    <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">🧳 Packing List</h4>
                      <div className="flex flex-wrap gap-2">
                        {itinerary.packing_list.map((item, idx) => (
                          <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full">
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Local Tips */}
                  {itinerary.local_tips && (
                    <div className="bg-purple-50 p-3 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">💡 Local Tips</h4>
                      <ul className="space-y-1">
                        {itinerary.local_tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-purple-800">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setItinerary(null)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Plan Another Trip
                    </button>
                    <button
                      onClick={downloadItinerary}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                      <FaDownload />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItineraryPlanner;