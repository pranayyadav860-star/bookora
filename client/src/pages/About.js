import { Link } from "react-router-dom";

function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl font-bold text-center mb-8">About Bookora</h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600 leading-relaxed mb-4">
            Bookora is India's premier luxury hotel booking platform, dedicated to providing travelers with unforgettable experiences.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Founded in 2024, we've partnered with over 500+ premium hotels across 50+ cities to offer the best stays at competitive prices.
          </p>
          <h2 className="text-2xl font-bold mt-6 mb-3">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            To make luxury travel accessible, affordable, and hassle-free for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;