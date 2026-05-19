// client/src/pages/Terms.js
import { Link } from "react-router-dom";

function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: January 1, 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Bookora's website and services, you agree to be bound by these Terms of Service. 
                If you disagree with any part of the terms, you may not access our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">2. Booking and Payments</h2>
              <p className="text-gray-600 leading-relaxed">
                When you make a booking through Bookora, you agree to pay all charges associated with your booking, 
                including the displayed room rates, taxes, and any additional fees specified during checkout.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">3. Cancellation and Refunds</h2>
              <p className="text-gray-600 leading-relaxed">
                Cancellation policies vary by hotel. You agree to review the specific cancellation policy before 
                completing your booking. Refunds are processed according to the hotel's policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">4. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account. Notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">5. Hotel Listings</h2>
              <p className="text-gray-600 leading-relaxed">
                Hotel information, photos, and amenities are provided by the hotels. While we strive for accuracy, 
                we cannot guarantee that all information is current or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">6. User Conduct</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree not to misuse our services, attempt to gain unauthorized access, or interfere with 
                the proper functioning of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">7. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content on Bookora, including logos, designs, and software, is our intellectual property and 
                protected by copyright laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Bookora is not liable for any indirect, incidental, or consequential damages arising from your use 
                of our services or any hotel stay.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">9. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of our services constitutes 
                acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">10. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about these Terms, contact us at legal@bookora.com.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link to="/" className="text-yellow-500 hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;