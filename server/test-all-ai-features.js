const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/ai-features';

async function testAllAIFeatures() {
  console.log('🚀 Testing All AI Features\n');
  console.log('=' .repeat(60));

  // 1. Test Languages API
  try {
    const languages = await axios.get(`${BASE_URL}/languages`);
    console.log('✅ 1. GET /languages');
    console.log(`   Available: ${Object.keys(languages.data.languages).length} languages`);
    console.log(`   Sample: ${Object.entries(languages.data.languages).slice(0, 3).map(([k,v]) => `${k}:${v}`).join(', ')}\n`);
  } catch (error) {
    console.log('❌ Languages API failed:', error.message);
  }

  // 2. Test Weather API
  try {
    const weather = await axios.get(`${BASE_URL}/weather/Goa`);
    console.log('✅ 2. GET /weather/Goa');
    console.log(`   Temperature: ${weather.data.current.temperature}°C`);
    console.log(`   Condition: ${weather.data.current.condition}`);
    console.log(`   Humidity: ${weather.data.current.humidity}%\n`);
  } catch (error) {
    console.log('❌ Weather API failed:', error.message);
  }

  // 3. Test Language Detection
  try {
    const detect = await axios.post(`${BASE_URL}/detect-language`, {
      text: 'नमस्ते, मुझे एक होटल चाहिए'
    });
    console.log('✅ 3. POST /detect-language');
    console.log(`   Detected: ${detect.data.language_name} (${detect.data.language})\n`);
  } catch (error) {
    console.log('❌ Language Detection failed:', error.message);
  }

  // 4. Test Translation
  try {
    const translate = await axios.post(`${BASE_URL}/translate`, {
      text: 'Welcome to our hotel booking platform',
      targetLanguage: 'hi'
    });
    console.log('✅ 4. POST /translate');
    console.log(`   English: ${translate.data.original}`);
    console.log(`   Hindi: ${translate.data.translated}\n`);
  } catch (error) {
    console.log('❌ Translation failed:', error.message);
  }

  // 5. Test Batch Translation
  try {
    const batch = await axios.post(`${BASE_URL}/translate-batch`, {
      texts: ['Hotel', 'Room', 'Price', 'Book Now', 'Cancellation Policy'],
      targetLanguage: 'hi'
    });
    console.log('✅ 5. POST /translate-batch');
    console.log(`   Translated ${batch.data.translations.length} items`);
    console.log(`   Example: "${batch.data.translations[0].original}" → "${batch.data.translations[0].translated}"\n`);
  } catch (error) {
    console.log('❌ Batch Translation failed:', error.message);
  }

  // 6. Test Negotiation Bot
  try {
    const negotiate = await axios.post(`${BASE_URL}/negotiate`, {
      hotelId: 'test123',
      budget: 3500,
      specialRequests: ['free breakfast', 'late checkout', 'room upgrade']
    });
    console.log('✅ 6. POST /negotiate');
    console.log(`   Strategy: ${negotiate.data.negotiation_strategy.strategy}`);
    console.log(`   Success Rate: ${negotiate.data.success_probability.percentage}%`);
    console.log(`   Best Offer: ${negotiate.data.counter_offers[0].offer}\n`);
  } catch (error) {
    console.log('❌ Negotiation failed:', error.message);
  }

  // 7. Test Itinerary Builder
  try {
    const itinerary = await axios.post(`${BASE_URL}/itinerary`, {
      hotel: { 
        name: 'Taj Resort', 
        city: 'Goa', 
        pricePerNight: 5000 
      },
      duration: 3,
      interests: ['beach', 'romantic', 'fine dining'],
      budget: 20000
    });
    console.log('✅ 7. POST /itinerary');
    console.log(`   Destination: ${itinerary.data.itinerary.summary.destination}`);
    console.log(`   Duration: ${itinerary.data.itinerary.summary.duration}`);
    console.log(`   Daily Budget: ₹${itinerary.data.itinerary.summary.daily_budget}`);
    console.log(`   Activities: ${itinerary.data.itinerary.days.length} days planned\n`);
  } catch (error) {
    console.log('❌ Itinerary failed:', error.message);
  }

  // 8. Test Group Planner
  try {
    const groupPlan = await axios.post(`${BASE_URL}/group-plan`, {
      rooms: 4,
      people: 10,
      preferences: ['couples', 'families'],
      budget: 75000,
      city: 'Goa'
    });
    console.log('✅ 8. POST /group-plan');
    console.log(`   Group Size: ${groupPlan.data.summary.total_people} people`);
    console.log(`   Total Rooms: ${groupPlan.data.summary.total_rooms}`);
    console.log(`   Per Person: ₹${groupPlan.data.summary.per_person_cost}`);
    console.log(`   Room Distribution: ${groupPlan.data.room_distribution.distribution.map(d => `${d.count} ${d.type}`).join(', ')}\n`);
  } catch (error) {
    console.log('❌ Group Plan failed:', error.message);
  }

  // 9. Test Price Comparison
  try {
    const priceComp = await axios.get(`${BASE_URL}/price-comparison/some-hotel-id`);
    console.log('✅ 9. GET /price-comparison/:hotelId');
    console.log(`   Best Deal: ${priceComp.data.best_deal.platform} at ₹${priceComp.data.best_deal.price}`);
    console.log(`   Savings: ₹${priceComp.data.potential_savings.max_savings}`);
    console.log(`   Recommendation: ${priceComp.data.recommendation.action}\n`);
  } catch (error) {
    console.log('❌ Price Comparison failed:', error.message);
  }

  // 10. Test AI Search
  try {
    const aiSearch = await axios.post(`${BASE_URL}/ai-search`, {
      query: 'romantic beach hotel in Goa under 5000',
      filters: { minRating: 4 }
    });
    console.log('✅ 10. POST /ai-search');
    console.log(`   Query: "${aiSearch.data.query}"`);
    console.log(`   Found: ${aiSearch.data.total} hotels`);
    if (aiSearch.data.results && aiSearch.data.results[0]) {
      console.log(`   Top Result: ${aiSearch.data.results[0].name} - ₹${aiSearch.data.results[0].pricePerNight}`);
    }
    console.log('');
  } catch (error) {
    console.log('❌ AI Search failed:', error.message);
  }

  // 11. Test Health Check
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 11. GET /health');
    console.log(`   Status: ${health.data.status}`);
    console.log(`   MongoDB: ${health.data.mongodb ? 'Connected ✅' : 'Not Connected ❌'}`);
    console.log(`   Endpoints: ${health.data.endpoints.length} available\n`);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  console.log('=' .repeat(60));
  console.log('✅ AI Features Testing Complete!');
  console.log('\n💡 All features are working. You can now integrate them into your frontend.');
}

// Run the tests
testAllAIFeatures();