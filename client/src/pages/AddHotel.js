import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function AddHotel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", city: "", address: "", description: "",
    price: "", category: "Budget", amenities: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/hotels", {
        ...form,
        price: Number(form.price),
        amenities: form.amenities.split(",").map((a) => a.trim()),
      });
      alert("Hotel added successfully!");
      navigate("/admin/hotels");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add hotel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Hotel</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
        {[
          { label: "Hotel Name", name: "name", type: "text" },
          { label: "City", name: "city", type: "text" },
          { label: "Address", name: "address", type: "text" },
          { label: "Price per night (₹)", name: "price", type: "number" },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type} name={name} value={form[name]}
              onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" value={form.category} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["Budget", "Standard", "Deluxe", "Luxury", "Resort"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma separated)</label>
          <input type="text" name="amenities" value={form.amenities} onChange={handleChange}
            placeholder="WiFi, Pool, Gym, Parking"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? "Adding..." : "Add Hotel"}
        </button>
      </form>
    </div>
  );
}