import React, { useState } from 'react';
import { FaGavel, FaCheckCircle, FaTimesCircle, FaRocket } from 'react-icons/fa';
import aiService from '../services/aiService';

const PriceNegotiator = ({ hotelId, currentPrice, hotelName }) => {
  const [budget, setBudget] = useState(currentPrice * 0.8);
  const [specialRequests, setSpecialRequests] = useState('');
  const [negotiation, setNegotiation] = useState(null);
  const [negotiating, setNegotiating] = useState(false);
  const [showNegotiator, setShowNegotiator] = useState(false);

  const handleNegotiate = async () => {
    setNegotiating(true);
    try {
      const requests = specialRequests.split(',').map(r => r.trim());
      const result = await aiService.negotiatePrice(hotelId, budget, requests);
      if (result?.success) {
        setNegotiation(result);
      }
    } catch (error) {
      console.error('Negotiation failed:', error);
    } finally {
      setNegotiating(false);
    }
  };

  const getSuccessColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessEmoji = (percentage) => {
    if (percentage >= 80) return '🎉';
    if (percentage >= 60) return '👍';
    return '🤔';
  };

  return (
    <>
      <button
        onClick={() => setShowNegotiator(!showNegotiator)}
        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
      >
        <FaGavel />
        Negotiate Price
      </button>

      {showNegotiator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FaGavel className="text-orange-500" />
                  Price Negotiator
                </h2>
                <button
                  onClick={() => setShowNegotiator(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {!negotiation ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Your Budget (₹ per night)
                    </label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Enter your budget"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current price: ₹{currentPrice}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Special Requests (comma separated)
                    </label>
                    <input
                      type="text"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., free breakfast, late checkout"
                    />
                  </div>

                  <button
                    onClick={handleNegotiate}
                    disabled={negotiating}
                    className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {negotiating ? 'Negotiating...' : 'Start Negotiation'}
                  </button>
                </>
              ) : (
                <div>
                  {/* Strategy */}
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <h3 className="font-semibold text-blue-800 mb-1">Negotiation Strategy</h3>
                    <p className="text-sm text-blue-700">{negotiation.negotiation_strategy?.message}</p>
                    <p className="text-xs text-blue-600 mt-1">{negotiation.negotiation_strategy?.approach}</p>
                  </div>

                  {/* Success Probability */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">Success Probability</span>
                      <span className={`text-lg font-bold ${getSuccessColor(negotiation.success_probability?.percentage)}`}>
                        {getSuccessEmoji(negotiation.success_probability?.percentage)} {negotiation.success_probability?.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2 transition-all"
                        style={{ width: `${negotiation.success_probability?.percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 space-y-1">
                      {negotiation.success_probability?.factors?.map((factor, idx) => (
                        <p key={idx} className="text-xs text-gray-600">{factor}</p>
                      ))}
                    </div>
                  </div>

                  {/* Counter Offers */}
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Counter Offers</h3>
                    <div className="space-y-2">
                      {negotiation.counter_offers?.map((offer, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-lg">{offer.offer}</p>
                              <p className="text-xs text-gray-500">{offer.condition}</p>
                              {offer.inclusions && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {offer.inclusions.map((item, i) => (
                                    <span key={i} className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-green-600 font-semibold">
                              Save ₹{offer.savings}
                            </div>
                          </div>
                          <button className="w-full mt-2 bg-green-500 text-white py-1 rounded hover:bg-green-600 transition text-sm">
                            Accept Offer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">💡 Negotiation Tips</h3>
                    <ul className="space-y-1">
                      {negotiation.negotiation_tips?.slice(0, 3).map((tip, idx) => (
                        <li key={idx} className="text-xs text-yellow-700">{tip}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setNegotiation(null)}
                    className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Start New Negotiation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceNegotiator;