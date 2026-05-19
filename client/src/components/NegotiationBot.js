import React, { useState, useEffect, useRef } from 'react';
import { 
  FaRobot, FaTimes, FaHandshake, FaGift, FaChartLine, 
  FaCheck, FaSpinner, FaWhatsapp, FaEnvelope, FaArrowRight, 
  FaClock, FaUsers, FaCalendar, FaMoneyBillWave, FaThumbsUp, FaHistory
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const NegotiationBot = ({ 
  hotelId, 
  hotelName, 
  currentPrice, 
  roomType, 
  checkIn, 
  checkOut, 
  guests,
  onNegotiationSuccess 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [budget, setBudget] = useState(Math.round(currentPrice * 0.8));
  const [specialRequests, setSpecialRequests] = useState('');
  const [negotiation, setNegotiation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [negotiationStage, setNegotiationStage] = useState('initial'); // initial, negotiating, countering, accepted
  const [showOffers, setShowOffers] = useState(false);
  const chatEndRef = useRef(null);
  const { user } = useAuth();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Start negotiation with proper conversational flow
  const startNegotiation = async () => {
    setLoading(true);
    setNegotiationStage('negotiating');
    
    // Initial greeting
    setChatHistory([
      { 
        type: 'bot', 
        message: `👋 Hi! I'm your AI Negotiation Assistant for ${hotelName}. Let me help you get the best deal!`, 
        timestamp: new Date().toLocaleTimeString() 
      },
      { 
        type: 'bot', 
        message: `💰 The current price is ₹${currentPrice}/night. What's your ideal budget per night?`, 
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/negotiation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId,
          roomType,
          checkIn,
          checkOut,
          guests,
          requestedPrice: budget,
          userBudget: budget,
          specialRequests: specialRequests.split(',').map(s => s.trim()).filter(s => s),
          userId: user?._id,
          isCorporate: false,
          isFirstTime: true,
          loyaltyPoints: 0
        })
      });
      
      const data = await response.json();
      setNegotiation(data);
      
      if (data.success) {
        // Add strategy message
        setChatHistory(prev => [...prev, 
          { 
            type: 'bot', 
            message: data.strategy.message, 
            timestamp: new Date().toLocaleTimeString() 
          },
          { 
            type: 'bot', 
            message: `📊 Success probability: ${data.successProbability.percentage}%`, 
            timestamp: new Date().toLocaleTimeString() 
          },
          { 
            type: 'bot', 
            message: `Would you like to see the special offers I've prepared for you?`, 
            timestamp: new Date().toLocaleTimeString() 
          }
        ]);
        
        setShowOffers(true);
      }
    } catch (error) {
      console.error('Negotiation error:', error);
      setChatHistory(prev => [...prev, 
        { type: 'bot', message: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toLocaleTimeString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Show offers to user
  const showOffersToUser = () => {
    setShowOffers(true);
    setChatHistory(prev => [...prev, 
      { 
        type: 'bot', 
        message: `✨ Here are ${negotiation.counterOffers.length} special offers I've negotiated for you:`, 
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
  };

  // Handle user message
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;
    
    const userMsg = userMessage.trim();
    setChatHistory(prev => [...prev, 
      { type: 'user', message: userMsg, timestamp: new Date().toLocaleTimeString() }
    ]);
    setUserMessage('');
    setIsTyping(true);
    
    // Process user message based on stage
    const lowerMsg = userMsg.toLowerCase();
    
    setTimeout(async () => {
      try {
        // Check if user is accepting an offer
        if (lowerMsg.includes('accept') || lowerMsg.includes('yes') || lowerMsg.includes('take') || lowerMsg.includes('book')) {
          if (selectedOffer) {
            await acceptOffer(selectedOffer);
          } else {
            setChatHistory(prev => [...prev, 
              { type: 'bot', message: "Which offer would you like to accept? Please select one from the offers above.", timestamp: new Date().toLocaleTimeString() }
            ]);
          }
        }
        // Check if user wants to see offers
        else if (lowerMsg.includes('show') || lowerMsg.includes('offer') || lowerMsg.includes('deal')) {
          showOffersToUser();
        }
        // Check if user is countering with a price
        else if (lowerMsg.includes('₹') || lowerMsg.includes('rupees') || lowerMsg.includes('rs')) {
          const priceMatch = userMsg.match(/(\d+)/);
          if (priceMatch) {
            const counterPrice = parseInt(priceMatch[1]);
            await handleCounterOffer(counterPrice);
          } else {
            setChatHistory(prev => [...prev, 
              { type: 'bot', message: "Please specify a price amount (e.g., 'Can you do ₹3500?')", timestamp: new Date().toLocaleTimeString() }
            ]);
          }
        }
        // Check if user is negotiating
        else if (lowerMsg.includes('negotiate') || lowerMsg.includes('discount') || lowerMsg.includes('cheaper') || lowerMsg.includes('reduce')) {
          setChatHistory(prev => [...prev, 
            { type: 'bot', message: "Sure! Let me check what I can do. What price were you thinking?", timestamp: new Date().toLocaleTimeString() }
          ]);
        }
        // Check if user wants more info
        else if (lowerMsg.includes('tell') || lowerMsg.includes('explain') || lowerMsg.includes('more') || lowerMsg.includes('details')) {
          setChatHistory(prev => [...prev, 
            { type: 'bot', message: `Here's what we've negotiated so far: Original price ₹${negotiation?.originalPrice || currentPrice * calculateNights()}, Current offer starting from ₹${negotiation?.counterOffers[0]?.discountedPrice || budget}. Would you like to see all offers?`, timestamp: new Date().toLocaleTimeString() }
          ]);
        }
        // Default response
        else {
          setChatHistory(prev => [...prev, 
            { type: 'bot', message: "I'm here to help you get the best deal! You can:\n• Ask to 'show offers'\n• Suggest a price like '₹3500'\n• Say 'accept' to confirm an offer\n• Ask for 'more details'", timestamp: new Date().toLocaleTimeString() }
          ]);
        }
      } catch (error) {
        console.error('Message handling error:', error);
        setChatHistory(prev => [...prev, 
          { type: 'bot', message: "I'm having trouble processing that. Could you please rephrase?", timestamp: new Date().toLocaleTimeString() }
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 1000);
  };

  // Handle counter offer
  const handleCounterOffer = async (counterPrice) => {
    setIsTyping(true);
    setChatHistory(prev => [...prev, 
      { type: 'bot', message: `Let me check if I can get ₹${counterPrice} per night for you...`, timestamp: new Date().toLocaleTimeString() }
    ]);
    
    try {
      const response = await fetch(`http://localhost:5000/api/negotiation/counter/${negotiation?.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newPrice: counterPrice,
          specialRequests: [...(negotiation?.specialRequests || []), userMessage]
        })
      });
      
      const newOffers = await response.json();
      setNegotiation(newOffers);
      
      setChatHistory(prev => [...prev, 
        { type: 'bot', message: "I've spoken with the hotel manager. Good news! I was able to negotiate a better deal!", timestamp: new Date().toLocaleTimeString() },
        { type: 'bot', message: `I can now offer you ₹${newOffers.counterOffers[0]?.discountedPrice / newOffers.nights} per night (Total: ₹${newOffers.counterOffers[0]?.discountedPrice})`, timestamp: new Date().toLocaleTimeString() },
        { type: 'bot', message: "Would you like to see all the updated offers?", timestamp: new Date().toLocaleTimeString() }
      ]);
      
      setShowOffers(true);
    } catch (error) {
      setChatHistory(prev => [...prev, 
        { type: 'bot', message: "The hotel manager couldn't accept that price. Would you like to try a different amount or see the current offers?", timestamp: new Date().toLocaleTimeString() }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Accept offer
  const acceptOffer = async (offer) => {
    setSelectedOffer(offer);
    setNegotiationStage('accepted');
    
    setChatHistory(prev => [...prev, 
      { type: 'bot', message: `🎉 Excellent choice! You've accepted the ${offer.title} offer!`, timestamp: new Date().toLocaleTimeString() },
      { type: 'bot', message: `💰 Final Price: ₹${offer.discountedPrice} (You saved ₹${offer.savings})`, timestamp: new Date().toLocaleTimeString() },
      { type: 'bot', message: `✨ Included: ${offer.inclusions?.join(', ') || 'Standard amenities'}`, timestamp: new Date().toLocaleTimeString() },
      { type: 'bot', message: "Taking you to checkout to complete your booking...", timestamp: new Date().toLocaleTimeString() }
    ]);
    
    setTimeout(() => {
      if (onNegotiationSuccess) {
        onNegotiationSuccess({
          ...offer,
          hotelId,
          hotelName,
          roomType,
          checkIn,
          checkOut,
          guests,
          perNightPrice: offer.discountedPrice / calculateNights()
        });
      }
      setIsOpen(false);
    }, 3000);
  };

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    return Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);
  };

  const nights = calculateNights();

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 z-50 group hover:scale-110"
      >
        <div className="relative">
          <FaHandshake size={24} className="group-hover:rotate-12 transition" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="absolute -bottom-8 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
            Negotiate Price
          </span>
        </div>
      </button>

      {/* Negotiation Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className={`bg-white rounded-2xl max-w-5xl w-full shadow-2xl transition-all duration-300 ${isMinimized ? 'h-24' : 'max-h-[90vh]'} flex flex-col`}>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <FaRobot className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Negotiation Assistant</h2>
                    <p className="text-green-100 text-sm">Real-time price negotiation • Save up to 30%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-white hover:text-green-200 transition p-1"
                  >
                    {isMinimized ? '□' : '−'}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-green-200 transition p-1"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Left Side - Chat Interface */}
                <div className="flex-1 flex flex-col h-[550px]">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaHandshake className="text-4xl text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Negotiate Your Stay</h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                          Get the best price for {hotelName}. Our AI will negotiate with the hotel to get you the best deal!
                        </p>
                        
                        {/* Booking Summary */}
                        <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto text-left mb-6">
                          <p className="text-sm font-semibold text-gray-700 mb-2">📋 Your Booking Details:</p>
                          <div className="space-y-1 text-sm">
                            <p>🏨 {hotelName}</p>
                            <p>🛏️ {roomType || 'Standard Room'}</p>
                            <p>📅 {checkIn ? new Date(checkIn).toLocaleDateString() : 'Select date'} → {checkOut ? new Date(checkOut).toLocaleDateString() : 'Select date'}</p>
                            <p>👥 {guests} guest(s)</p>
                            <p>💰 Current price: {formatPrice(currentPrice)}/night</p>
                            <p>📊 Total for {nights} night(s): {formatPrice(currentPrice * nights)}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Budget (per night)</label>
                            <input
                              type="number"
                              value={budget}
                              onChange={(e) => setBudget(parseInt(e.target.value))}
                              className="w-full max-w-md mx-auto border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                              placeholder="Enter your budget"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (optional)</label>
                            <input
                              type="text"
                              value={specialRequests}
                              onChange={(e) => setSpecialRequests(e.target.value)}
                              placeholder="e.g., late checkout, room upgrade, free breakfast"
                              className="w-full max-w-md mx-auto border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <button
                            onClick={startNegotiation}
                            disabled={loading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
                          >
                            {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'Start Negotiation →'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.type === 'user' 
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-br-sm' 
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-line">{msg.message}</p>
                          {msg.timestamp && (
                            <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start animate-slideIn">
                        <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Chat Input */}
                  {chatHistory.length > 0 && negotiationStage !== 'accepted' && (
                    <div className="border-t p-4 bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message... e.g., 'Show offers', 'Can you do ₹3500?', 'Accept'"
                          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          <FaArrowRight />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => setUserMessage("Show me offers")}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                        >
                          Show offers
                        </button>
                        <button 
                          onClick={() => setUserMessage("Can you do lower?")}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                        >
                          Negotiate price
                        </button>
                        <button 
                          onClick={() => setUserMessage("Tell me more")}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                        >
                          More details
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side - Offers Panel */}
                {showOffers && negotiation && negotiation.counterOffers && (
                  <div className="md:w-96 border-l bg-gray-50 overflow-y-auto max-h-[550px]">
                    <div className="p-4 space-y-4">
                      {/* Savings Highlight */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-200">
                        <p className="text-sm text-gray-600">Potential Savings</p>
                        <p className="text-3xl font-bold text-green-600">
                          {formatPrice(negotiation.originalPrice - negotiation.counterOffers[0]?.discountedPrice)}
                        </p>
                        <p className="text-xs text-gray-500">on this booking</p>
                      </div>

                      {/* Success Probability */}
                      <div className="bg-white rounded-xl p-4 border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Success Probability</span>
                          <span className="text-lg font-bold text-green-600">{negotiation.successProbability.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 rounded-full h-2 transition-all"
                            style={{ width: `${negotiation.successProbability.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Special Offers */}
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FaGift className="text-green-600" />
                          Special Offers ({negotiation.counterOffers.length})
                        </h3>
                        <div className="space-y-3">
                          {negotiation.counterOffers.map((offer, idx) => (
                            <div 
                              key={idx} 
                              className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all duration-200 cursor-pointer ${
                                selectedOffer?.id === offer.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400'
                              }`}
                              onClick={() => setSelectedOffer(offer)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  {offer.type === 'price_discount' && <FaMoneyBillWave className="text-green-500" />}
                                  {offer.type === 'value_add' && <FaGift className="text-purple-500" />}
                                  {offer.type === 'long_stay' && <FaCalendar className="text-blue-500" />}
                                  {offer.type === 'last_minute' && <FaClock className="text-orange-500" />}
                                  {offer.type === 'group' && <FaUsers className="text-indigo-500" />}
                                  <h4 className="font-bold text-gray-800">{offer.title}</h4>
                                </div>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                                  Save {offer.savingsPercentage}%
                                </span>
                              </div>
                              
                              <p className="text-2xl font-bold text-green-600 mb-1">
                                {formatPrice(offer.discountedPrice)}
                              </p>
                              <p className="text-xs text-gray-400 line-through">
                                {formatPrice(offer.originalPrice)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatPrice(offer.discountedPrice / nights)} per night
                              </p>
                              
                              {offer.inclusions && offer.inclusions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">✨ Includes:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {offer.inclusions.slice(0, 3).map((item, i) => (
                                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                        <FaCheck size={8} className="text-green-600" />
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <button 
                                onClick={() => acceptOffer(offer)}
                                className={`w-full mt-3 py-2 rounded-lg transition text-sm font-semibold ${
                                  selectedOffer?.id === offer.id 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {selectedOffer?.id === offer.id ? 'Accept This Offer →' : 'Select Offer'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NegotiationBot;