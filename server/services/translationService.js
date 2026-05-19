class TranslationService {
  constructor() {
    this.supportedLanguages = {
      hi: 'Hindi',
      mr: 'Marathi', 
      bn: 'Bengali',
      te: 'Telugu',
      ta: 'Tamil',
      kn: 'Kannada',
      ml: 'Malayalam',
      gu: 'Gujarati',
      pa: 'Punjabi'
    };
    
    this.phrases = {
      welcome: {
        en: 'Welcome! How can I help you?',
        hi: 'स्वागत है! मैं आपकी कैसे मदद कर सकता हूँ?',
        mr: 'स्वागत आहे! मी तुम्हाला कशी मदत करू शकतो?'
      },
      search_hotel: {
        en: 'Search for hotels',
        hi: 'होटल खोजें',
        mr: 'होटल शोधा'
      },
      book_now: {
        en: 'Book Now',
        hi: 'अभी बुक करें',
        mr: 'आत्ता बुक करा'
      },
      price: {
        en: 'Price',
        hi: 'कीमत',
        mr: 'किंमत'
      },
      location: {
        en: 'Location',
        hi: 'स्थान',
        mr: 'स्थान'
      },
      amenities: {
        en: 'Amenities',
        hi: 'सुविधाएं',
        mr: 'सुविधा'
      },
      rating: {
        en: 'Rating',
        hi: 'रेटिंग',
        mr: 'रेटिंग'
      },
      cancel: {
        en: 'Cancel',
        hi: 'रद्द करें',
        mr: 'रद्द करा'
      },
      confirm: {
        en: 'Confirm',
        hi: 'पुष्टि करें',
        mr: 'पुष्टी करा'
      }
    };
  }

  async translate(text, targetLanguage) {
    try {
      // In production, use Google Translate API or similar
      // For now, use phrase-based translation with fallback
      
      const translated = await this.translatePhrase(text, targetLanguage);
      
      return {
        original: text,
        translated: translated,
        target_language: this.supportedLanguages[targetLanguage],
        confidence: 0.85
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        original: text,
        translated: text,
        error: 'Translation service unavailable'
      };
    }
  }

  translatePhrase(text, targetLang) {
    // Check if the phrase exists in dictionary
    for (const [key, translations] of Object.entries(this.phrases)) {
      if (translations.en.toLowerCase() === text.toLowerCase()) {
        return translations[targetLang] || text;
      }
    }
    
    // Simple word replacement for common travel terms
    const translations = {
      hi: {
        'hotel': 'होटल',
        'room': 'कमरा',
        'beach': 'समुद्र तट',
        'price': 'कीमत',
        'book': 'बुक करें',
        'search': 'खोजें',
        'filter': 'फ़िल्टर',
        'sort': 'क्रमबद्ध करें'
      },
      mr: {
        'hotel': 'होटल',
        'room': 'खोली',
        'beach': 'समुद्रकिनारा',
        'price': 'किंमत',
        'book': 'बुक करा',
        'search': 'शोधा'
      }
    };
    
    let translated = text;
    const dict = translations[targetLang];
    if (dict) {
      for (const [eng, trans] of Object.entries(dict)) {
        translated = translated.replace(new RegExp(eng, 'gi'), trans);
      }
    }
    
    return translated;
  }

  detectLanguage(text) {
    // Simple language detection based on script
    const hindiRange = /[\u0900-\u097F]/;
    const marathiRange = /[\u0900-\u097F]/;
    const tamilRange = /[\u0B80-\u0BFF]/;
    
    if (hindiRange.test(text)) return 'hi';
    if (tamilRange.test(text)) return 'ta';
    return 'en';
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

module.exports = new TranslationService();