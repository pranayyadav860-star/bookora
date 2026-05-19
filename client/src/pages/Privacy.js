// client/src/pages/Privacy.js
import { Link } from "react-router-dom";

function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: January 1, 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">1. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, make a booking, 
                or contact customer support. This may include your name, email address, phone number, payment information, 
                and travel preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed">
                We use your information to process bookings, communicate with you about your reservations, 
                provide customer support, improve our services, and send promotional offers (with your consent).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">3. Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed">
                We share your information with hotels to fulfill your booking. We do not sell your personal information 
                to third parties. We may share data with trusted service providers who assist in our operations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">4. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement industry-standard security measures including SSL encryption, secure servers, 
                and regular security audits to protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">5. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. 
                You can disable cookies in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">6. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed">
                You have the right to access, correct, or delete your personal information. You can manage your 
                preferences in your account settings or by contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">7. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our services are not directed to children under 13. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">8. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at privacy@bookora.com or 
                call +91 98765 43210.
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

export default Privacy;