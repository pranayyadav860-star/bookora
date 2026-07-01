// client/src/pages/AdminNewsletter.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  EnvelopeIcon,
  UserGroupIcon,
  CalendarIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
    offerCode: ""
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadSubscribers();
  }, [user]);

  const loadSubscribers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/newsletter/subscribers", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSubscribers(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      alert("Please fill subject and message");
      return;
    }
    
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/newsletter/send-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(emailData)
      });
      
      const data = await res.json();
      setSuccess(data.msg);
      setSendModal(false);
      setEmailData({ subject: "", message: "", offerCode: "" });
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      alert("Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Newsletter Management</h1>
            <p className="text-gray-500 mt-1">Manage subscribers and send campaigns</p>
          </div>
          <button
            onClick={() => setSendModal(true)}
            className="bg-yellow-500 text-black px-5 py-2 rounded-xl font-semibold flex items-center gap-2"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            Send Newsletter
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Subscribers</p>
                <p className="text-3xl font-bold">{subscribers.length}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Subscribers</p>
                <p className="text-3xl font-bold text-green-600">{subscribers.filter(s => s.isActive !== false).length}</p>
              </div>
              <EnvelopeIcon className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">This Month</p>
                <p className="text-3xl font-bold text-blue-600">
                  {subscribers.filter(s => new Date(s.subscribedAt).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <CalendarIcon className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Subscribers List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold">Subscribers List</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {subscribers.map((sub) => (
              <div key={sub._id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{sub.email}</p>
                  <p className="text-sm text-gray-500">Subscribed: {new Date(sub.subscribedAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${sub.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sub.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Send Newsletter Modal */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Send Newsletter</h2>
              <button onClick={() => setSendModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-500 mb-4">Sending to {subscribers.length} subscribers</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                  placeholder="Special Offer: 20% Off!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  rows="5"
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                  placeholder="Dear Subscriber, we have an exclusive offer for you..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Offer Code (Optional)</label>
                <input
                  type="text"
                  value={emailData.offerCode}
                  onChange={(e) => setEmailData({...emailData, offerCode: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                  placeholder="WELCOME20"
                />
              </div>
              <button
                onClick={sendBulkEmail}
                disabled={sending}
                className="w-full bg-yellow-500 text-black py-3 rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-50"
              >
                {sending ? "Sending..." : `Send to ${subscribers.length} Subscribers`}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {success}
        </div>
      )}
    </div>
  );
}

export default AdminNewsletter;