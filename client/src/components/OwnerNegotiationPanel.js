import React, { useState, useEffect, useRef } from 'react';
import { FaComments, FaTimes, FaReply, FaCheck, FaClock, FaUser, FaBuilding, FaCalendar, FaMoneyBillWave, FaSpinner, FaGift } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const OwnerNegotiationPanel = ({ hotelId, hotelName }) => {
  const [isOpen, setIsOpen] = useState(true); // Start open for owner
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [negotiations, setNegotiations] = useState([]);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [inclusions, setInclusions] = useState([]);
  const [newInclusion, setNewInclusion] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Owner connecting to WebSocket server...');
    
    const newSocket = io('https://bookora-server-22ox.onrender.com', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Owner connected to negotiation server');
      setConnected(true);
      
      // Register as owner for this hotel
      newSocket.emit('register-owner', { hotelId, ownerId: user?._id });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Owner WebSocket error:', error);
      setConnected(false);
    });

    newSocket.on('new-negotiation-request', (data) => {
      console.log('📩 New negotiation request received:', data);
      
      setNegotiations(prev => [{
        ...data,
        messages: [{ 
          type: 'user', 
          message: data.message, 
          timestamp: new Date(),
          sender: data.userName 
        }],
        status: 'pending',
        read: false
      }, ...prev]);
      
      setUnreadCount(prev => prev + 1);
      
      // Play notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio not supported'));
      } catch(e) {}
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Negotiation Request', {
          body: `${data.userName} wants to negotiate for ${data.hotelName}`,
          icon: '/logo1.png'
        });
      }
    });

    newSocket.on('user-response', (data) => {
      console.log('User response received:', data);
      setNegotiations(prev => prev.map(neg => 
        neg.negotiationId === data.negotiationId
          ? { 
              ...neg, 
              messages: [...neg.messages, { 
                type: 'user', 
                message: data.message, 
                timestamp: new Date(),
                sender: data.userName
              }] 
            }
          : neg
      ));
    });

    setSocket(newSocket);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [hotelId, user]);

  const sendResponse = () => {
    if (!responseMessage.trim()) return;

    setLoading(true);
    
    socket.emit('owner-response', {
      negotiationId: selectedNegotiation.negotiationId,
      response: responseMessage,
      offerPrice: offerPrice ? parseInt(offerPrice) : null,
      inclusions: inclusions.filter(i => i),
      specialDeal: offerPrice ? `Special negotiated price: ₹${offerPrice}/night` : null
    });

    setNegotiations(prev => prev.map(neg =>
      neg.negotiationId === selectedNegotiation.negotiationId
        ? { 
            ...neg, 
            messages: [...neg.messages, { 
              type: 'owner', 
              message: responseMessage, 
              timestamp: new Date(),
              sender: 'Hotel Owner',
              offerPrice: offerPrice ? parseInt(offerPrice) : null,
              inclusions: inclusions.filter(i => i)
            }], 
            status: 'responded' 
          }
        : neg
    ));

    setResponseMessage('');
    setOfferPrice('');
    setInclusions([]);
    setLoading(false);
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const removeInclusion = (index) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const markAsRead = (negotiationId) => {
    setNegotiations(prev => prev.map(neg =>
      neg.negotiationId === negotiationId ? { ...neg, read: true } : neg
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <FaComments />
              Customer Negotiations
            </h3>
            <p className="text-xs opacity-90">Real-time chat with customers</p>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <span className="flex items-center gap-1 text-xs bg-green-500 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Connected
              </span>
            ) : (
              <span className="text-xs bg-red-500 px-2 py-1 rounded-full">
                Connecting...
              </span>
            )}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      {negotiations.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <FaComments size={40} className="mx-auto mb-3 opacity-50" />
          <p>No active negotiations</p>
          <p className="text-xs mt-1">When customers message you, they will appear here</p>
        </div>
      ) : (
        <div className="flex h-96">
          {/* Negotiations List */}
          <div className="w-64 border-r overflow-y-auto">
            {negotiations.map((neg) => (
              <div
                key={neg.negotiationId}
                onClick={() => {
                  setSelectedNegotiation(neg);
                  markAsRead(neg.negotiationId);
                }}
                className={`p-3 cursor-pointer border-b hover:bg-gray-50 transition ${
                  selectedNegotiation?.negotiationId === neg.negotiationId ? 'bg-purple-50' : ''
                } ${!neg.read ? 'bg-yellow-50' : ''}`}
              >
                <div className="font-semibold text-sm flex justify-between">
                  <span>{neg.userName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(neg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">{neg.message}</p>
                <div className="flex gap-2 mt-1 text-xs text-gray-400">
                  <span>₹{neg.userBudget}/nt</span>
                  <span>{neg.guests} guests</span>
                </div>
                {!neg.read && (
                  <div className="mt-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Area */}
          {selectedNegotiation ? (
            <div className="flex-1 flex flex-col">
              {/* Customer Info */}
              <div className="bg-gray-50 p-3 border-b">
                <div className="font-semibold">{selectedNegotiation.userName}</div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>📅 {new Date(selectedNegotiation.checkIn).toLocaleDateString()} → {new Date(selectedNegotiation.checkOut).toLocaleDateString()}</span>
                  <span>👥 {selectedNegotiation.guests} guests</span>
                  <span>💰 Budget: ₹{selectedNegotiation.userBudget}/night</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedNegotiation.messages?.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'owner' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-2 rounded-lg ${
                      msg.type === 'owner'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="text-xs font-semibold mb-1">
                        {msg.type === 'owner' ? 'You' : msg.sender || 'Customer'}
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Response Form */}
              <div className="border-t p-3">
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows="2"
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Offer price (optional)"
                    className="flex-1 border rounded-lg p-2 text-sm"
                  />
                  <button
                    onClick={sendResponse}
                    disabled={!responseMessage.trim() || loading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaReply />} Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a negotiation to respond
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerNegotiationPanel;