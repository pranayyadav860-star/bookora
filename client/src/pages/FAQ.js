// client/src/pages/FAQ.js
import { useState } from "react";
import { Link } from "react-router-dom";

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I book a hotel on Bookora?",
      answer: "Booking a hotel on Bookora is simple! Just search for your desired destination, select your preferred hotel, choose your room type, enter guest details, and make payment. You'll receive a confirmation email instantly."
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel your booking. Cancellation policies vary by hotel. Most hotels offer free cancellation up to 7 days before check-in. Check the specific hotel's cancellation policy before booking."
    },
    {
      question: "How do I get a refund?",
      answer: "Refunds are processed automatically upon cancellation based on the hotel's policy. The amount will be credited back to your original payment method within 5-7 business days."
    },
    {
      question: "Is it safe to book on Bookora?",
      answer: "Absolutely! Bookora uses secure SSL encryption for all transactions. Your payment information is protected and never stored on our servers."
    },
    {
      question: "Can I modify my booking dates?",
      answer: "Yes, you can modify your booking dates subject to availability. Contact our support team or the hotel directly to request date changes."
    },
    {
      question: "Do you offer group bookings?",
      answer: "Yes! For group bookings (5+ rooms), please contact our corporate team at groups@bookora.com for special rates and assistance."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit cards (Visa, MasterCard, Amex), debit cards, UPI (Google Pay, PhonePe, Paytm), and net banking."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach our 24/7 customer support via email at support@bookora.com, phone at +91 98765 43210, or live chat on our website."
    },
    {
      question: "Are the hotel photos real?",
      answer: "Yes, all hotel photos are genuine and provided by the hotels. We regularly verify photo authenticity to ensure accurate representations."
    },
    {
      question: "Do hotels charge extra taxes?",
      answer: "GST and other applicable taxes are included in the displayed price. Some cities may charge local taxes which will be mentioned during checkout."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 text-lg">Find answers to common questions about booking on Bookora</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="🔍 Search your question..."
            className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              const faqElements = document.querySelectorAll('.faq-item');
              faqElements.forEach((el, idx) => {
                const question = faqs[idx].question.toLowerCase();
                if (question.includes(searchTerm)) {
                  el.style.display = 'block';
                } else {
                  el.style.display = searchTerm ? 'none' : 'block';
                }
              });
            }}
          />
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item border-b border-gray-100 last:border-0">
              <button
                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-semibold text-gray-800">{faq.question}</span>
                <span className={`text-2xl text-yellow-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
          <p className="mb-4">Can't find the answer you're looking for? Please contact our support team.</p>
          <Link to="/contact" className="inline-block bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FAQ;