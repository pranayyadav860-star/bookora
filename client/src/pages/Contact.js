import { useState } from "react";

function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl font-bold text-center mb-8">Contact Us</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-4">📞 +91 98765 43210</p>
            <p className="text-gray-600 mb-4">✉️ support@bookora.com</p>
            <p className="text-gray-600">📍 India</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Your Name" className="w-full p-3 border rounded-xl mb-4" required
                onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="email" placeholder="Your Email" className="w-full p-3 border rounded-xl mb-4" required
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <textarea placeholder="Your Message" rows="4" className="w-full p-3 border rounded-xl mb-4" required
                onChange={(e) => setFormData({...formData, message: e.target.value})} />
              <button type="submit" className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold">
                Send Message
              </button>
            </form>
            {submitted && <p className="text-green-500 mt-4">Message sent! We'll get back to you soon.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;