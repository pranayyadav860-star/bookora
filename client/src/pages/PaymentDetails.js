// client/src/pages/PaymentDetails.js
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function PaymentDetails() {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // First, find booking with this payment ID
      const bookingsRes = await fetch("http://localhost:5000/api/bookings/my-bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const bookings = await bookingsRes.json();
      
      const foundBooking = bookings.find(b => b.paymentId === paymentId);
      if (foundBooking) {
        setBooking(foundBooking);
      }
      
      // Fetch payment details from Razorpay
      const paymentRes = await fetch(`http://localhost:5000/api/payment/details/${paymentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const paymentData = await paymentRes.json();
      
      if (paymentData.success) {
        setPayment(paymentData.payment);
      } else {
        setError(paymentData.error || "Payment not found");
      }
    } catch (err) {
      console.error("Error fetching payment:", err);
      setError("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'captured':
      case 'paid':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon, label: 'Success' };
      case 'authorized':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ClockIcon, label: 'Authorized' };
      case 'failed':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon, label: 'Failed' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: ClockIcon, label: status || 'Pending' };
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "Unable to find payment details"}</p>
          <Link to="/mybookings" className="inline-block bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(payment.status);
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Link to="/mybookings" className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Bookings
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition print:hidden"
          >
            <PrinterIcon className="h-5 w-5" />
            Print Receipt
          </button>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none">
          
          {/* Header Banner */}
          <div className={`${status.bg} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${status.text}`} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Payment {status.label}</h1>
                <p className="text-sm text-gray-600">Transaction ID: {payment.id}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="text-2xl font-bold text-yellow-600">{formatAmount(payment.amount)}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6 space-y-6">
            
            {/* Booking Info */}
            {booking && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-yellow-500" />
                  Booking Information
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-semibold">{booking.bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hotel:</span>
                    <span className="font-semibold">{booking.hotelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Type:</span>
                    <span>{booking.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span>{new Date(booking.checkIn).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span>{new Date(booking.checkOut).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-yellow-500" />
                Payment Information
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-sm">{payment.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="capitalize">{payment.method || 'Card'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Date:</span>
                  <span>{formatDate(payment.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${status.text}`}>{status.label}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-yellow-500" />
                Customer Information
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Name:</span>
                  <span>{payment.email?.split('@')[0] || booking?.userName || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{payment.email || booking?.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span>{payment.contact || booking?.userPhone}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Fee Breakdown</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatAmount(payment.amount)}</span>
                </div>
                {payment.fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Gateway Fee:</span>
                    <span className="text-red-600">- {formatAmount(payment.fee)}</span>
                  </div>
                )}
                {payment.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST on Fee:</span>
                    <span className="text-red-600">- {formatAmount(payment.tax)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Net Amount Received:</span>
                    <span className="text-green-600">{formatAmount(payment.amount - payment.fee - payment.tax)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank/Wallet Details (if available) */}
            {(payment.bank || payment.wallet || payment.vpa) && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Payment Source Details</h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {payment.bank && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span>{payment.bank}</span>
                    </div>
                  )}
                  {payment.wallet && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet:</span>
                      <span>{payment.wallet}</span>
                    </div>
                  )}
                  {payment.vpa && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">UPI ID:</span>
                      <span>{payment.vpa}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Refund Information */}
            {payment.refunds && payment.refunds.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Refund Information</h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {payment.refunds.map((refund, idx) => (
                    <div key={idx} className="border-b last:border-0 pb-2">
                      <div className="flex justify-between">
                        <span>Refund ID:</span>
                        <span className="font-mono text-sm">{refund.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Refund Amount:</span>
                        <span>{formatAmount(refund.amount / 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="capitalize">{refund.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Note */}
            <div className="text-center text-sm text-gray-400 pt-4 border-t">
              <p>This is a system generated receipt. No signature required.</p>
              <p className="mt-1">For any queries, contact support@bookora.com</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PaymentDetails;