import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaHandshake, FaPaperPlane, FaUser, FaBuilding, FaClock, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const UserNegotiationBot = ({ hotelId, hotelName, currentPrice, roomType, checkIn, checkOut, guests, onNegotiationSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [negotiationId, setNegotiationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [negotiationStatus, setNegotiationStatus] = useState('idle');
  const [ownerOnline, setOwnerOnline] = useState(false);
  const [showOffer, setShowOffer] = useState(null);
  const [budget, setBudget] = useState(Math.round(currentPrice * 0.8));
  const [specialRequests, setSpecialRequests] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Connecting to WebSocket server...');
    
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to negotiation server');
      setConnected(true);
      setIsConnecting(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnecting(false);
      setConnected(false);
    });

    newSocket.on('negotiation-started', (data) => {
      console.log('Negotiation started:', data);
      setNegotiationId(data.negotiationId);
      addMessage('bot', data.message);
      setNegotiationStatus('negotiating');
    });

    newSocket.on('owner-response', (data) => {
      console.log('Owner response received:', data);
      setIsTyping(false);
      addMessage('owner', data.response, data);
      
      if (data.offerPrice) {
        setShowOffer({
          price: data.offerPrice,
          inclusions: data.inclusions,
          specialDeal: data.specialDeal
        });
      }
    });

    newSocket.on('booking-confirmation', (data) => {
      console.log('Booking confirmation:', data);
      addMessage('bot', data.message);
      setNegotiationStatus('accepted');
      
      setTimeout(() => {
        if (onNegotiationSuccess) {
          onNegotiationSuccess(data.offerDetails);
        }
        setIsOpen(false);
      }, 3000);
    });

    newSocket.on('negotiation-error', (data) => {
      console.error('Negotiation error:', data);
      addMessage('bot', data.message);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const addMessage = (type, message, data = null) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNegotiation = () => {
    if (!user) {
      addMessage('bot', 'Please login first to negotiate with the hotel owner.');
      setTimeout(() => window.location.href = '/login', 2000);
      return;
    }

    if (!socket || !connected) {
      addMessage('bot', 'Connecting to negotiation server... Please try again.');
      return;
    }

    addMessage('user', `I'd like to negotiate the price for ${hotelName}. My budget is ₹${budget}/night. ${specialRequests ? `Special requests: ${specialRequests}` : ''}`);
    
    socket.emit('start-negotiation', {
      hotelId,
      hotelName,
      message: `My budget is ₹${budget}/night. ${specialRequests ? `Special requests: ${specialRequests}` : ''}`,
      userBudget: budget,
      checkIn,
      checkOut,
      guests,
      roomType
    });
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    addMessage('user', inputMessage);
    
    socket.emit('user-response', {
      negotiationId,
      message: inputMessage,
      acceptOffer: false,
      counterPrice: null
    });
    
    setInputMessage('');
  };

  const acceptOffer = () => {
    if (showOffer) {
      socket.emit('accept-offer', {
        negotiationId,
        offerDetails: showOffer
      });
      addMessage('user', 'I accept this offer!');
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 z-50 group hover:scale-110"
      >
        <div className="relative">
          <FaHandshake size={24} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </button>

      {/* Negotiation Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <FaRobot className="text-2xl" />
                  <div>
                    <h2 className="text-xl font-bold">Talk to Hotel Owner</h2>
                    <p className="text-sm opacity-90">Real-time negotiation with {hotelName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnecting && (
                    <span className="text-xs bg-yellow-500 px-2 py-1 rounded-full animate-pulse">
                      Connecting...
                    </span>
                  )}
                  {!isConnecting && connected ? (
                    <span className="flex items-center gap-1 text-xs bg-green-500 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs bg-red-500 px-2 py-1 rounded-full">
                      Offline Mode
                    </span>
                  )}
                  <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Booking Summary */}
              {negotiationStatus === 'idle' && (
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="font-semibold text-gray-800 mb-2">📋 Your Booking Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>🏨 Hotel: {hotelName}</div>
                    <div>🛏️ Room: {roomType || 'Standard'}</div>
                    <div>📅 Check-in: {new Date(checkIn).toLocaleDateString()}</div>
                    <div>📅 Check-out: {new Date(checkOut).toLocaleDateString()}</div>
                    <div>👥 Guests: {guests}</div>
                    <div>💰 Current: ₹{currentPrice}/night</div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && negotiationStatus === 'idle' && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaBuilding className="text-3xl text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Negotiate with Hotel Owner</h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                      Talk directly with the hotel owner to get the best deal!
                    </p>
                    
                    <div className="space-y-3 max-w-md mx-auto">
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(parseInt(e.target.value))}
                        placeholder="Your budget per night"
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Special requests (optional)"
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={startNegotiation}
                        disabled={!connected}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                      >
                        {!connected ? 'Connecting...' : 'Start Negotiation →'}
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-4">
                      💡 Your message will be sent directly to the hotel owner
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : msg.type === 'owner'
                        ? 'bg-purple-100 text-purple-800 rounded-bl-sm border border-purple-200'
                        : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.type === 'owner' && <FaBuilding size={12} />}
                        {msg.type === 'user' && <FaUser size={12} />}
                        {msg.type === 'bot' && <FaRobot size={12} />}
                        <span className="text-xs font-semibold">
                          {msg.type === 'owner' ? 'Hotel Owner' : msg.type === 'user' ? user?.name || 'You' : 'Assistant'}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      {msg.data?.offerPrice && (
                        <div className="mt-2 bg-green-50 rounded-lg p-2">
                          <p className="text-xs font-semibold text-green-700">Special Offer:</p>
                          <p className="text-lg font-bold text-green-600">₹{msg.data.offerPrice}/night</p>
                          {msg.data.inclusions && (
                            <p className="text-xs text-green-600">Includes: {msg.data.inclusions.join(', ')}</p>
                          )}
                          <button
                            onClick={acceptOffer}
                            className="mt-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full hover:bg-green-700"
                          >
                            Accept Offer →
                          </button>
                        </div>
                      )}
                      <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 p-3 rounded-2xl rounded-bl-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {negotiationStatus === 'negotiating' && (
                <div className="border-t p-4 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message to the hotel owner..."
                      className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    💬 Your message will be sent directly to the hotel owner
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserNegotiationBot;