// client/src/hooks/useHotels.js
// Custom hook — replaces repeated fetch logic inside Hotels.js, Home.js, etc.
// Usage: const { hotels, loading, error, refetch } = useHotels({ city, maxPrice, minRating });

import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useHotels = (filters = {}) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { city, maxPrice, minRating, sort, featured } = filters;

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (minRating) params.set('minRating', minRating);
      if (sort) params.set('sort', sort);
      if (featured) params.set('featured', 'true');

      const { data } = await api.get(`/hotels?${params}`);
      setHotels(Array.isArray(data) ? data : data.hotels || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  }, [city, maxPrice, minRating, sort, featured]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  return { hotels, loading, error, refetch: fetchHotels };
};

// ─────────────────────────────────────────────────────────────────────────────

// client/src/hooks/useBookings.js
// Usage: const { bookings, loading, error } = useBookings();

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/bookings/mybookings');
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return { bookings, loading, error, refetch: fetchBookings };
};

// ─────────────────────────────────────────────────────────────────────────────

// client/src/hooks/useLoyalty.js
// Usage: const { loyalty, loading } = useLoyalty();

export const useLoyalty = () => {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/loyalty')
      .then(({ data }) => setLoyalty(data))
      .catch(() => setLoyalty(null))
      .finally(() => setLoading(false));
  }, []);

  return { loyalty, loading };
};
