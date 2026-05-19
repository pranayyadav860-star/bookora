import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceSearch from './VoiceSearch';
import { FaSearch } from 'react-icons/fa';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/hotels?city=${query}`);
    }
  };

  const handleVoiceSearch = (transcript) => {
    setQuery(transcript);
    // Extract city and search
    const cities = ['goa', 'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai'];
    const foundCity = cities.find(city => transcript.toLowerCase().includes(city));
    if (foundCity) {
      navigate(`/hotels?city=${foundCity}`);
    } else {
      navigate(`/hotels?city=${transcript}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by city, hotel, or destination... (e.g., 'Goa hotels under 5000')"
          className="w-full px-6 py-4 pr-24 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <VoiceSearch onSearchResult={handleVoiceSearch} />
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
          >
            <FaSearch />
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;