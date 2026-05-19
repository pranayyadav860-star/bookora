// client/src/components/PaymentGateway.js
import { useState } from 'react';

function PaymentGateway({ amount, bookingData, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const processPayment = async () => {
    if (!amount || amount <= 0) {
      onError('Invalid amount. Please try again.');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Creating order for amount:', amount);
      
      // Create order
      const orderRes = await fetch('http://localhost:5000/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amount })
      });
      
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }
      
      console.log('Order created:', orderData);
      
      // Load Razorpay
      await loadRazorpayScript();
      
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Bookora',
        description: `Hotel Booking - ${bookingData.hotelName}`,
        image: '/logo192.png',
        order_id: orderData.order.id,
        handler: async (response) => {
          console.log('Payment Response:', response);
          console.log('Payment ID:', response.razorpay_payment_id);
          console.log('Order ID:', response.razorpay_order_id);
          console.log('Signature:', response.razorpay_signature);
          
          // Verify payment with backend
          try {
            const verifyRes = await fetch('http://localhost:5000/api/payment/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingData: {
                  ...bookingData,
                  paymentId: response.razorpay_payment_id
                }
              })
            });
            
            const verifyData = await verifyRes.json();
            console.log('Verification Response:', verifyData);
            
            if (verifyData.success) {
              alert(`✅ Payment Successful!\n\nPayment ID: ${response.razorpay_payment_id}\nAmount: ₹${amount}\nBooking ID: ${verifyData.booking?.bookingId || 'Confirmed'}`);
              onSuccess(verifyData.booking || { paymentId: response.razorpay_payment_id, amount });
            } else {
              console.error('Verification failed:', verifyData.error);
              onError(verifyData.error || 'Payment verification failed');
            }
          } catch (verifyError) {
            console.error('Verification error:', verifyError);
            onError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: bookingData.userName,
          email: bookingData.userEmail,
          contact: bookingData.userPhone
        },
        theme: {
          color: '#eab308'
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onError('Payment cancelled');
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay, Amex' },
    { id: 'upi', name: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm, BHIM' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'SBI, HDFC, ICICI, Axis & more' },
    { id: 'wallet', name: 'Mobile Wallets', icon: '👛', description: 'Paytm, Amazon Pay, Mobikwik' },
  ];

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-yellow-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-4 h-4 text-yellow-500"
            />
            <div className="text-2xl">{method.icon}</div>
            <div>
              <p className="font-semibold text-sm">{method.name}</p>
              <p className="text-xs text-gray-500">{method.description}</p>
            </div>
          </label>
        ))}
      </div>
      
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 text-center border border-yellow-200">
        <p className="text-gray-600 text-sm">Total Amount to Pay</p>
        <p className="text-4xl font-bold text-yellow-600">{formattedAmount}</p>
        <p className="text-xs text-gray-400 mt-1">Including all taxes</p>
      </div>
      
      <button
        onClick={processPayment}
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay ${formattedAmount} Securely`
        )}
      </button>
      
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <span>🔒 128-bit SSL Secure</span>
        <span>💳 PCI Compliant</span>
        <span>✅ Instant Confirmation</span>
      </div>
    </div>
  );
}

export default PaymentGateway;