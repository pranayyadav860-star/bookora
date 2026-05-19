import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LanguageSelector = ({ onLanguageChange }) => {
  const [languages, setLanguages] = useState({
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
    bn: 'Bengali',
    te: 'Telugu',
    ta: 'Tamil'
  });
  const [selectedLang, setSelectedLang] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ai-features/languages');
      if (response.data && response.data.languages) {
        setLanguages(response.data.languages);
      }
    } catch (error) {
      console.error('Failed to fetch languages, using defaults:', error);
      // Keep default languages
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
  };

  if (loading) {
    return (
      <select className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm" disabled>
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={selectedLang}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {Object.entries(languages).map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;