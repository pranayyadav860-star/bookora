// client/src/pages/Cancellation.js
import { Link } from "react-router-dom";

function Cancellation() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Cancellation Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: January 1, 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Free Cancellation Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Most hotels on Bookora offer free cancellation up to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>7 days before check-in for standard bookings</li>
                <li>14 days before check-in for peak season bookings</li>
                <li>30 days before check-in for group bookings (5+ rooms)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Cancellation Fees</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">Time of Cancellation</th>
                      <th className="p-3 text-left">Cancellation Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-3">More than 7 days before check-in</td>
                      <td className="p-3 text-green-600">Free Cancellation</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-3">3-7 days before check-in</td>
                      <td className="p-3">50% of booking amount</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-3">Less than 3 days before check-in</td>
                      <td className="p-3">100% of booking amount</td>
                    </tr>
                    <tr>
                      <td className="p-3">No-show (without cancellation)</td>
                      <td className="p-3 text-red-600">Full booking amount charged</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">How to Cancel a Booking</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>Log in to your Bookora account</li>
                <li>Go to "My Bookings" section</li>
                <li>Select the booking you want to cancel</li>
                <li>Click on "Cancel Booking" button</li>
                <li>Confirm cancellation</li>
                <li>You'll receive a cancellation confirmation email</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Refund Process</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Once you cancel a booking:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Refund amount is calculated based on the cancellation policy</li>
                <li>Refunds are processed within 5-7 business days</li>
                <li>Amount is credited back to the original payment method</li>
                <li>You'll receive a refund confirmation email</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Non-Refundable Bookings</h2>
              <p className="text-gray-600 leading-relaxed">
                Some special discounted rates may be marked as "Non-Refundable". These bookings cannot be cancelled 
                or modified. Please check the cancellation policy before confirming such bookings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Booking Modifications</h2>
              <p className="text-gray-600 leading-relaxed">
                If you want to change your travel dates instead of cancelling:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                <li>Contact our support team at least 7 days before check-in</li>
                <li>Date changes are subject to hotel availability</li>
                <li>Price differences may apply based on new dates</li>
                <li>No modification fee for standard bookings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Emergency Cancellations</h2>
              <p className="text-gray-600 leading-relaxed">
                In case of medical emergencies, natural disasters, or travel restrictions, please contact our 
                support team immediately. We'll work with hotels to provide maximum flexibility.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Need Help?</h2>
              <p className="text-gray-600 leading-relaxed">
                For cancellation assistance or questions, contact our 24/7 support:
              </p>
              <ul className="text-gray-600 space-y-1 mt-2">
                <li>📞 Phone: +91 98765 43210</li>
                <li>✉️ Email: support@bookora.com</li>
                <li>💬 Live Chat: Available on our website</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4 flex-wrap">
            <Link to="/" className="text-yellow-500 hover:underline">← Back to Home</Link>
            <Link to="/mybookings" className="text-yellow-500 hover:underline">View My Bookings →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cancellation;