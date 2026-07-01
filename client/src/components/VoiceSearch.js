import React, { useState, useEffect, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import {
  FaMicrophone,
  FaStop,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaMicrophoneAlt,
  FaLanguage,
  FaMapMarkerAlt,
} from "react-icons/fa";

const VoiceSearch = ({ onSearchResult, onListeningChange }) => {
  const recognitionRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");

  const [allHotels, setAllHotels] = useState([]);
  const [verifiedHotel, setVerifiedHotel] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [verifyingHotel, setVerifyingHotel] = useState(false);

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // =========================
  // LOAD HOTELS
  // =========================

  const loadAllHotels = useCallback(async () => {
    try {
      const response = await fetch("https://bookora-server-22ox.onrender.com/api/hotels");

      const data = await response.json();

      setAllHotels(data);

      console.log("Hotels Loaded:", data.length);

      return data;
    } catch (error) {
      console.error(error);
      setError("Failed to load hotels");
      return [];
    }
  }, []);

  // =========================
  // INIT SPEECH RECOGNITION
  // =========================

  useEffect(() => {
    loadAllHotels();

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;
    recognition.maxAlternatives = 3;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);

      setTranscript("");
      setInterimTranscript("");
      setVerifiedHotel(null);
      setSuggestions([]);

      if (onListeningChange) {
        onListeningChange(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);

      if (onListeningChange) {
        onListeningChange(false);
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);

      // IGNORE ABORTED ERROR
      if (event.error === "aborted") {
        return;
      }

      setError(event.error);

      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onresult = async (event) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const currentTranscript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += currentTranscript;
        } else {
          interim += currentTranscript;
        }
      }

      setInterimTranscript(interim);

      if (finalTranscript) {
        setTranscript(finalTranscript);

        console.log("User Said:", finalTranscript);

        setIsProcessing(true);

        const parsed = parseVoiceInput(finalTranscript);

        // CHECK HOTEL
        if (parsed.hotelName) {
          const verification = await checkHotelExists(parsed.hotelName);

          if (verification.found) {

            parsed.verified = true;

            parsed.hotelData = verification.hotel;

          } else {

            if (verification.suggestions) {

              parsed.suggestions =
                verification.suggestions;

            }

          }
        }

        if (onSearchResult) {
          onSearchResult(parsed);
        }

        setIsProcessing(false);
      }
    };

    return () => {};
  }, [selectedLanguage, loadAllHotels]);

  // =========================
  // START LISTENING
  // =========================

  const startListening = () => {
    try {

      if (
        recognitionRef.current &&
        !isListening
      ) {

        recognitionRef.current.start();

      }

    } catch (error) {

      console.error(error);

    }
  };

  // =========================
  // STOP LISTENING
  // =========================

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // =========================
  // PARSE VOICE INPUT
  // =========================

  const parseVoiceInput = (text) => {
    const lower = text.toLowerCase();

    const result = {
      original: text,
      hotelName: null,
      city: null,
      price: null,
      type: "general",
    };

    // REMOVE COMMON WORDS

    let cleaned = lower
      .replace(/find/g, "")
      .replace(/search/g, "")
      .replace(/book/g, "")
      .replace(/show/g, "")
      .replace(/looking for/g, "")
      .replace(/i want/g, "")
      .trim();

    if (cleaned.length > 2) {
      result.hotelName = cleaned;
      result.type = "hotel_name";
    }

    // CITY DETECTION

    const cities = [
      "goa",
      "hyderabad",
      "mumbai",
      "delhi",
      "bangalore",
      "chennai",
      "vizag",
    ];

    cities.forEach((city) => {
      if (lower.includes(city)) {
        result.city = city;
      }
    });

    // PRICE DETECTION

    const priceMatch = lower.match(/\d+/);

    if (priceMatch) {
      result.price = parseInt(priceMatch[0]);
    }

    return result;
  };

  // =========================
  // HOTEL VERIFICATION
  // =========================

  const checkHotelExists = useCallback(
    async (spokenText) => {
      setVerifyingHotel(true);

      try {
        let hotels = allHotels;

        if (hotels.length === 0) {
          hotels = await loadAllHotels();
        }

        const fuse = new Fuse(hotels, {
          keys: ["hotelName", "name", "city"],
          threshold: 0.4,
          includeScore: true,
          ignoreLocation: true,
          minMatchCharLength: 2,
        });

        const results = fuse.search(spokenText.trim());

        if (results.length > 0) {
          const bestMatch = results[0].item;

          setVerifiedHotel(bestMatch);

          return {
            found: true,
            hotel: bestMatch,
            suggestions: results.slice(0, 5).map((r) => r.item),
          };
        }

        return {
          found: false,
          suggestions: [],
        };
      } catch (error) {
        console.error(error);

        return {
          found: false,
          suggestions: [],
        };
      } finally {
        setVerifyingHotel(false);
      }
    },
    [allHotels, loadAllHotels]
  );

  // =========================
  // EXAMPLE SEARCH
  // =========================

  const handleExampleSearch = async (text) => {
    const parsed = parseVoiceInput(text);

    const verification = await checkHotelExists(parsed.hotelName);

    if (verification.found) {
      parsed.verified = true;
      parsed.hotelData = verification.hotel;
    }

    if (onSearchResult) {
      onSearchResult(parsed);
    }
  };

  // =========================
  // LANGUAGES
  // =========================

  const supportedLanguages = [
    {
      code: "en-IN",
      name: "English India",
      flag: "🇮🇳",
    },
    {
      code: "hi-IN",
      name: "Hindi",
      flag: "🇮🇳",
    },
    {
      code: "te-IN",
      name: "Telugu",
      flag: "🇮🇳",
    },
  ];

  // =========================
  // NOT SUPPORTED
  // =========================

  if (!isSupported) {
    return (
      <button className="bg-gray-300 p-3 rounded-full">
        <FaMicrophone />
      </button>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="relative">

      {/* MIC BUTTON */}

      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing || verifyingHotel}
        className={`p-3 rounded-full transition-all duration-300 ${
          isListening
            ? "bg-red-500 text-white animate-pulse"
            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
        }`}
      >
        {isProcessing || verifyingHotel ? (
          <FaSpinner className="animate-spin" />
        ) : isListening ? (
          <FaStop />
        ) : (
          <FaMicrophoneAlt />
        )}
      </button>

      {/* LANGUAGE */}

      <button
        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
        className="absolute -top-1 -right-1 bg-gray-700 text-white p-1 rounded-full"
      >
        <FaLanguage size={10} />
      </button>

      {/* LANGUAGE MENU */}

      {showLanguageMenu && (
        <div className="absolute bottom-full right-0 bg-white rounded-xl shadow-xl p-2 w-48 z-50">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLanguage(lang.code);

                if (recognitionRef.current) {
                  recognitionRef.current.lang = lang.code;
                }

                setShowLanguageMenu(false);
              }}
              className="w-full text-left p-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2"
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* LISTENING UI */}

      {isListening && (
        <div className="absolute bottom-full right-0 mb-2 bg-white p-4 rounded-xl shadow-2xl w-80 z-50 border">

          <div className="text-center">

            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaMicrophone className="text-red-500 text-xl" />
            </div>

            <p className="font-semibold">Listening...</p>

            {interimTranscript && (
              <div className="bg-purple-50 mt-2 p-2 rounded-lg">
                <p className="text-sm">{interimTranscript}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VERIFIED HOTEL */}

      {verifiedHotel && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl p-4 w-72 border-2 border-green-500 z-50">

          <div className="flex gap-2">

            <FaCheck className="text-green-500 mt-1" />

            <div>

              <p className="font-bold text-green-700">
                Hotel Found
              </p>

              <p className="font-semibold">
                {verifiedHotel.hotelName || verifiedHotel.name}
              </p>

              <p className="text-sm text-gray-500 flex items-center gap-1">
                <FaMapMarkerAlt size={10} />
                {verifiedHotel.city}
              </p>

              <p className="text-sm text-purple-600">
                ₹{verifiedHotel.price}/night
              </p>

            </div>
          </div>
        </div>
      )}

      {/* SUGGESTIONS */}

      {suggestions.length > 0 && !verifiedHotel && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl p-4 w-80 z-50 border">

          <p className="font-semibold mb-2">
            Did you mean?
          </p>

          {suggestions.map((hotel, index) => (
            <button
              key={index}
              onClick={() => {

                setVerifiedHotel(hotel);

                if (onSearchResult) {
                  onSearchResult({
                    type: "hotel_name",
                    verified: true,
                    hotelData: hotel,
                  });
                }

                setSuggestions([]);

              }}
              className="w-full text-left p-2 hover:bg-gray-100 rounded-lg"
            >
              <p className="font-medium">
                {hotel.hotelName || hotel.name}
              </p>

              <p className="text-xs text-gray-500">
                {hotel.city}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* HELP */}

      <div className="absolute -bottom-1 -right-1">
        <button
          onClick={() => handleExampleSearch("Sai Prema")}
          className="bg-gray-300 text-xs p-1 rounded-full"
        >
          ?
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="absolute bottom-full right-0 mb-2 bg-red-100 border border-red-300 rounded-xl p-2 text-sm text-red-600 z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;