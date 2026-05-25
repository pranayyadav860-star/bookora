import { useState, useRef } from 'react';

function PaymentGateway({ amount, bookingData, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');

  const isProcessingRef = useRef(false);
  const successCalledRef = useRef(false);

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
    if (isProcessingRef.current) {
      console.log('⚠️ Payment already processing');
      return;
    }

    if (successCalledRef.current) {
      console.log('⚠️ Payment already completed');
      return;
    }

    if (!amount || amount <= 0) {
      onError('Invalid amount');
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // CREATE ORDER
      const orderRes = await fetch(
        'http://localhost:5000/api/payment/razorpay/create-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // LOAD RAZORPAY
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Bookora',
        description: `Hotel Booking - ${bookingData.hotelName}`,
        image: '/logo192.png',
        order_id: orderData.order.id,

        handler: async (response) => {
          try {
            if (successCalledRef.current) {
              console.log('⚠️ Duplicate payment callback blocked');
              return;
            }

            successCalledRef.current = true;

            console.log('✅ Razorpay Success:', response);

            // VERIFY PAYMENT ONLY
            const verifyRes = await fetch(
              'http://localhost:5000/api/payment/razorpay/verify',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookingData: {
    ...bookingData,
    paymentId: response.razorpay_payment_id,
    orderId: response.razorpay_order_id,
  },
                }),
              }
            );

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error(
                verifyData.error || 'Payment verification failed'
              );
            }

            // SEND PAYMENT DATA TO CHECKOUT
            onSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });

          } catch (err) {
            console.error('Verification Error:', err);
            onError(err.message || 'Payment verification failed');
          } finally {
            setLoading(false);
            isProcessingRef.current = false;
          }
        },

        prefill: {
          name: bookingData.userName,
          email: bookingData.userEmail,
          contact: bookingData.userPhone,
        },

        theme: {
          color: '#eab308',
        },

        modal: {
          ondismiss: () => {
            console.log('Payment popup closed');

            setLoading(false);
            isProcessingRef.current = false;

            onError('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.open();

    } catch (error) {
      console.error('Payment Error:', error);

      setLoading(false);
      isProcessingRef.current = false;

      onError(error.message);
    }
  };

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, RuPay, Amex',
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: '📱',
      description: 'Google Pay, PhonePe, Paytm',
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'All major banks',
    },
    {
      id: 'wallet',
      name: 'Wallets',
      icon: '👛',
      description: 'Paytm, Mobikwik',
    },
  ];

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">
        Select Payment Method
      </h3>

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
              <p className="font-semibold text-sm">
                {method.name}
              </p>

              <p className="text-xs text-gray-500">
                {method.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 text-center border border-yellow-200">
        <p className="text-gray-600 text-sm">
          Total Amount to Pay
        </p>

        <p className="text-4xl font-bold text-yellow-600">
          {formattedAmount}
        </p>

        <p className="text-xs text-gray-400 mt-1">
          Including all taxes
        </p>
      </div>

      <button
        onClick={processPayment}
        disabled={
          loading ||
          isProcessingRef.current ||
          successCalledRef.current
        }
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-lg"
      >
        {loading ? 'Processing...' : `Pay ${formattedAmount}`}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <span>🔒 SSL Secure</span>
        <span>💳 PCI Compliant</span>
        <span>✅ Instant Confirmation</span>
      </div>
    </div>
  );
}

export default PaymentGateway;