import React, { useState, useEffect } from 'react';
import { Slider } from './Slider';

const Filters = ({ onFilterChange, initialFilters, className = '' }) => {
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    propertyType: [],
    minRating: 0,
    amenities: [],
    distance: 10,
    sortBy: 'price_low',
    ...initialFilters
  });

  const [isOpen, setIsOpen] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(50000);

  const propertyTypes = [
    { id: 'hotel', name: 'Hotel', icon: '🏨' },
    { id: 'villa', name: 'Villa', icon: '🏠' },
    { id: 'apartment', name: 'Apartment', icon: '🏢' },
    { id: 'resort', name: 'Resort', icon: '🌴' },
    { id: 'homestay', name: 'Homestay', icon: '🏡' },
    { id: 'cabin', name: 'Cabin', icon: '🪵' }
  ];

  const amenitiesList = [
    { id: 'wifi', name: 'WiFi', icon: '📶' },
    { id: 'parking', name: 'Free Parking', icon: '🅿️' },
    { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
    { id: 'pool', name: 'Swimming Pool', icon: '🏊' },
    { id: 'gym', name: 'Gym', icon: '💪' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { id: 'roomService', name: 'Room Service', icon: '🛎️' },
    { id: 'petFriendly', name: 'Pet Friendly', icon: '🐕' },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
    { id: 'washer', name: 'Washer', icon: '🧺' },
    { id: 'tv', name: 'TV', icon: '📺' },
    { id: 'breakfast', name: 'Breakfast Included', icon: '🍳' }
  ];

  const sortOptions = [
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating: High to Low' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'newest', label: 'Newest First' }
  ];

  const handlePriceChange = (values) => {
    setPriceMin(values[0]);
    setPriceMax(values[1]);
    setFilters({ ...filters, priceRange: values });
  };

  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const defaultFilters = {
      priceRange: [0, 50000],
      propertyType: [],
      minRating: 0,
      amenities: [],
      distance: 10,
      sortBy: 'price_low'
    };
    setFilters(defaultFilters);
    setPriceMin(0);
    setPriceMax(50000);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return filters.priceRange[0] > 0 || 
           filters.priceRange[1] < 50000 ||
           filters.propertyType.length > 0 ||
           filters.minRating > 0 ||
           filters.amenities.length > 0 ||
           filters.distance !== 10;
  };

  return (
    <div className={`${className}`}>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-white border rounded-lg py-3 px-4 flex items-center justify-between shadow-sm"
        >
          <span className="font-semibold">Filters & Sort</span>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        </button>
      </div>

      {/* Filter Sidebar - Desktop */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border p-5 sticky top-24">
        <FilterContent 
          filters={filters}
          setFilters={setFilters}
          priceMin={priceMin}
          priceMax={priceMax}
          onPriceChange={handlePriceChange}
          propertyTypes={propertyTypes}
          amenitiesList={amenitiesList}
          sortOptions={sortOptions}
          onApply={applyFilters}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters()}
        />
      </div>

      {/* Mobile Filter Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Filters</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <FilterContent 
                filters={filters}
                setFilters={setFilters}
                priceMin={priceMin}
                priceMax={priceMax}
                onPriceChange={handlePriceChange}
                propertyTypes={propertyTypes}
                amenitiesList={amenitiesList}
                sortOptions={sortOptions}
                onApply={() => {
                  applyFilters();
                  setIsOpen(false);
                }}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterContent = ({ filters, setFilters, priceMin, priceMax, onPriceChange, propertyTypes, amenitiesList, sortOptions, onApply, onClear, hasActiveFilters }) => {
  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <label className="font-semibold text-gray-700 block mb-2">Sort By</label>
        <select 
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="font-semibold text-gray-700 block mb-2">Price per night</label>
        <Slider
          min={0}
          max={50000}
          step={500}
          value={[priceMin, priceMax]}
          onChange={onPriceChange}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>₹{priceMin}</span>
          <span>₹{priceMax}+</span>
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="font-semibold text-gray-700 block mb-2">Property Type</label>
        <div className="grid grid-cols-2 gap-2">
          {propertyTypes.map(type => (
            <label key={type.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input 
                type="checkbox" 
                checked={filters.propertyType.includes(type.id)}
                onChange={() => {
                  const updated = filters.propertyType.includes(type.id)
                    ? filters.propertyType.filter(t => t !== type.id)
                    : [...filters.propertyType, type.id];
                  setFilters({ ...filters, propertyType: updated });
                }}
                className="rounded text-blue-600"
              />
              <span>{type.icon} {type.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="font-semibold text-gray-700 block mb-2">Minimum Rating</label>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map(rating => (
            <button
              key={rating}
              onClick={() => setFilters({ ...filters, minRating: rating })}
              className={`px-3 py-2 rounded-lg border transition ${
                filters.minRating === rating 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              {rating === 0 ? 'Any' : `${rating}+ ⭐`}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="font-semibold text-gray-700 block mb-2">Amenities</label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {amenitiesList.map(amenity => (
            <label key={amenity.id} className="flex items-center gap-2 text-sm p-1">
              <input 
                type="checkbox" 
                checked={filters.amenities.includes(amenity.id)}
                onChange={() => {
                  const updated = filters.amenities.includes(amenity.id)
                    ? filters.amenities.filter(a => a !== amenity.id)
                    : [...filters.amenities, amenity.id];
                  setFilters({ ...filters, amenities: updated });
                }}
                className="rounded text-blue-600"
              />
              <span>{amenity.icon} {amenity.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div>
        <label className="font-semibold text-gray-700 block mb-2">
          Within <span className="text-blue-600">{filters.distance}</span> km
        </label>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={filters.distance} 
          onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 km</span>
          <span>25 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button 
          onClick={onApply}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button 
            onClick={onClear}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default Filters;