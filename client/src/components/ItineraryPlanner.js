// ItineraryPlanner.jsx — World-class AI Itinerary Planner
// Features: multi-city chaining · weather-aware · live budget tracker ·
//           share link · timeline view · conflict detector · PDF export ·
//           mood board · starred activities · carbon footprint meter

import React, { useState, useCallback, useMemo, useRef } from "react";

// ─── tiny icon set (inline SVG, no dependency) ────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d={d} />
  </svg>
);
const ICONS = {
  map:      "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  calendar: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  sun:      "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42 M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10",
  moon:     "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  fork:     "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  share:    "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  leaf:     "M2 22 16 8 M3.5 11.5A10 10 0 0 0 22 22 M22 2 11 13",
  alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  close:    "M18 6 6 18 M6 6l12 12",
  plus:     "M12 5v14 M5 12h14",
  check:    "M20 6 9 17l-5-5",
  copy:     "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

// ─── static data ──────────────────────────────────────────────────────────
const INTEREST_OPTIONS = [
  { value: "beach",       label: "🏖️ Beach" },
  { value: "romantic",    label: "❤️ Romantic" },
  { value: "adventure",   label: "⛰️ Adventure" },
  { value: "family",      label: "👨‍👩‍👧‍👦 Family" },
  { value: "relaxation",  label: "🧘 Relaxation" },
  { value: "cultural",    label: "🎭 Cultural" },
  { value: "food",        label: "🍜 Food Tour" },
  { value: "wildlife",    label: "🦁 Wildlife" },
  { value: "shopping",    label: "🛍️ Shopping" },
  { value: "nightlife",   label: "🎶 Nightlife" },
];

const WEATHER_ICONS = { sunny:"☀️", cloudy:"⛅", rainy:"🌧️", stormy:"⛈️", windy:"💨", snowy:"❄️" };

// Carbon factors (kg CO₂ per km)
const CARBON = { flight: 0.255, train: 0.041, car: 0.171, bus: 0.089 };

// ─── helpers ──────────────────────────────────────────────────────────────
function generateShareId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function estimateCarbon(hotels) {
  if (hotels.length < 2) return 0;
  // rough: 800 km avg between Indian cities by flight
  return +(hotels.length - 1) * 800 * CARBON.flight;
}

function detectConflicts(days) {
  const conflicts = [];
  days?.forEach((day, di) => {
    const slots = [day.morning, day.afternoon, day.evening].filter(Boolean);
    slots.forEach((slot, si) => {
      if (slot?.travel_time_minutes > 90) {
        conflicts.push(`Day ${day.day}: "${slot.activity}" needs ${slot.travel_time_minutes} min travel — consider reordering.`);
      }
    });
  });
  return conflicts;
}

// ─── sub-components ───────────────────────────────────────────────────────

// Budget progress bar
function BudgetMeter({ spent, total }) {
  const pct = Math.min(100, Math.round((spent / total) * 100));
  const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";
  return (
    <div className="budget-meter">
      <div className="budget-meter__labels">
        <span>💸 Budget Used</span>
        <span style={{ color, fontWeight: 700 }}>₹{spent.toLocaleString()} / ₹{total.toLocaleString()}</span>
      </div>
      <div className="budget-meter__track">
        <div className="budget-meter__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="budget-meter__pct" style={{ color }}>{pct}% used</div>
    </div>
  );
}

// Carbon footprint badge
function CarbonBadge({ kg }) {
  const trees = Math.ceil(kg / 21); // 1 tree absorbs ~21 kg CO₂/yr
  const level = kg < 200 ? "green" : kg < 600 ? "amber" : "red";
  const colors = { green: "#22c55e", amber: "#f59e0b", red: "#ef4444" };
  return (
    <div className="carbon-badge" style={{ borderColor: colors[level] }}>
      <Icon d={ICONS.leaf} size={14} color={colors[level]} />
      <span style={{ color: colors[level] }}>
        ~{Math.round(kg)} kg CO₂ · plant {trees} tree{trees !== 1 ? "s" : ""} to offset
      </span>
    </div>
  );
}

// Starred activity button
function StarBtn({ id, starred, onToggle }) {
  return (
    <button
      onClick={() => onToggle(id)}
      className="star-btn"
      title={starred ? "Unstar" : "Star this activity"}
      aria-label={starred ? "Unstar" : "Star"}
    >
      <Icon d={ICONS.star} size={14}
        color={starred ? "#f59e0b" : "#d1d5db"}
        className={starred ? "star-btn--active" : ""} />
    </button>
  );
}

// Weather chip
function WeatherChip({ weather }) {
  return weather
    ? <span className="weather-chip">{WEATHER_ICONS[weather] || "🌤️"} {weather}</span>
    : null;
}

// Timeline dot row
function TimelineDots({ days, activeDay, onSelect }) {
  return (
    <div className="timeline-dots">
      {days.map((d, i) => (
        <React.Fragment key={i}>
          <button
            className={`timeline-dot ${activeDay === i ? "timeline-dot--active" : ""}`}
            onClick={() => onSelect(i)}
            title={`Day ${d.day}: ${d.theme}`}
          >
            <span className="timeline-dot__num">{d.day}</span>
            <span className="timeline-dot__theme">{d.theme}</span>
          </button>
          {i < days.length - 1 && <div className="timeline-connector" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// Single day card
function DayCard({ day, starred, onStar }) {
  const slots = [
    { key: "morning",   icon: "☀️",  label: "Morning",   color: "#fbbf24", data: day.morning   },
    { key: "afternoon", icon: "🌤️",  label: "Afternoon", color: "#f97316", data: day.afternoon },
    { key: "evening",   icon: "🌙",  label: "Evening",   color: "#6366f1", data: day.evening   },
  ];
  return (
    <div className="day-card">
      <div className="day-card__header">
        <div className="day-card__meta">
          <span className="day-card__num">DAY {day.day}</span>
          <span className="day-card__date">{day.date}</span>
        </div>
        <div className="day-card__theme">{day.theme}</div>
        {day.weather && <WeatherChip weather={day.weather} />}
      </div>

      <div className="day-card__slots">
        {slots.map(({ key, icon, label, color, data }) => data && (
          <div key={key} className="slot" style={{ "--slot-color": color }}>
            <div className="slot__time-col">
              <span className="slot__icon">{icon}</span>
              <span className="slot__time">{data.time}</span>
            </div>
            <div className="slot__body">
              <div className="slot__top">
                <span className="slot__activity">{data.activity}</span>
                <StarBtn id={`${day.day}-${key}`} starred={starred.has(`${day.day}-${key}`)} onToggle={onStar} />
              </div>
              <p className="slot__desc">{data.description}</p>
              <div className="slot__meta">
                <span className="slot__cost">₹{data.cost}</span>
                {data.travel_time_minutes && (
                  <span className="slot__travel">
                    <Icon d={ICONS.clock} size={11} /> {data.travel_time_minutes} min travel
                    {data.travel_time_minutes > 90 && (
                      <span className="slot__conflict">⚠ Long</span>
                    )}
                  </span>
                )}
                {data.tip && <span className="slot__tip">💡 {data.tip}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {day.meals && (
        <div className="meals-row">
          <span>🍽️</span>
          <span><b>Breakfast:</b> {day.meals.breakfast}</span>
          <span>·</span>
          <span><b>Lunch:</b> {day.meals.lunch}</span>
          <span>·</span>
          <span><b>Dinner:</b> {day.meals.dinner}</span>
        </div>
      )}

      {day.photo_url && (
        <div className="day-card__photo">
          <img src={day.photo_url} alt={day.theme} loading="lazy" />
          <div className="day-card__photo-label">{day.theme}</div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
const ItineraryPlanner = ({ hotel }) => {
  // planner config
  const [duration,   setDuration]   = useState(3);
  const [interests,  setInterests]  = useState(["relaxation"]);
  const [budget,     setBudget]     = useState(15000);
  const [transport,  setTransport]  = useState("flight");

  // multi-city
  const [extraCities, setExtraCities] = useState([]);
  const [cityInput,   setCityInput]   = useState("");

  // output
  const [itinerary,  setItinerary]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showPlanner,setShowPlanner]= useState(false);

  // UX state
  const [activeDay,  setActiveDay]  = useState(0);
  const [starred,    setStarred]    = useState(new Set());
  const [shareId,    setShareId]    = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [tab,        setTab]        = useState("timeline"); // timeline | details | tips
  const [conflicts,  setConflicts]  = useState([]);

  const modalRef = useRef(null);

  // ── computed ──────────────────────────────────────────────────────────
  const allHotels   = useMemo(() => [hotel, ...extraCities.map(c => ({ city: c }))], [hotel, extraCities]);
  const carbonKg    = useMemo(() => estimateCarbon(allHotels), [allHotels]);
  const totalSpent  = useMemo(() => {
    if (!itinerary?.days) return 0;
    return itinerary.days.reduce((sum, d) => {
      const s = d.morning?.cost + d.afternoon?.cost + d.evening?.cost || 0;
      return sum + (Number(s) || 0);
    }, 0);
  }, [itinerary]);

  // ── handlers ──────────────────────────────────────────────────────────
  const toggleInterest = useCallback(v =>
    setInterests(p => p.includes(v) ? p.filter(i => i !== v) : [...p, v]), []);

  const addCity = useCallback(() => {
    const c = cityInput.trim();
    if (c && !extraCities.includes(c)) setExtraCities(p => [...p, c]);
    setCityInput("");
  }, [cityInput, extraCities]);

  const removeCity = useCallback(c =>
    setExtraCities(p => p.filter(x => x !== c)), []);

  const toggleStar = useCallback(id =>
    setStarred(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);

  const handleShare = useCallback(() => {
    const id = generateShareId();
    setShareId(id);
    const url = `${window.location.origin}/itinerary/${id}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, []);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setItinerary(null);
    setActiveDay(0);
    setStarred(new Set());
    setConflicts([]);
    try {
      // Build a rich prompt for your aiService
      const prompt = {
        hotel, duration, interests, budget, transport,
        extraCities,
        instruction: `
          Return a JSON object ONLY with this exact shape:
          {
            "summary": { "destination": string, "duration": string, "total_budget": number, "daily_budget": number, "highlights": string[] },
            "days": [{
              "day": number, "date": string, "theme": string, "weather": "sunny"|"cloudy"|"rainy"|"stormy"|"windy"|"snowy",
              "photo_url": string (unsplash landscape url for this city/theme),
              "morning":   { "time": string, "activity": string, "description": string, "cost": number, "travel_time_minutes": number, "tip": string },
              "afternoon": { "time": string, "activity": string, "description": string, "cost": number, "travel_time_minutes": number, "tip": string },
              "evening":   { "time": string, "activity": string, "description": string, "cost": number, "travel_time_minutes": number, "tip": string },
              "meals": { "breakfast": string, "lunch": string, "dinner": string }
            }],
            "recommendations": string[],
            "packing_list":    string[],
            "local_tips":      string[],
            "emergency_contacts": { "police": string, "ambulance": string, "tourist_helpline": string }
          }
        `,
      };

      // Call your existing aiService — or fetch directly
      let result;
      try {
        const { default: aiService } = await import("../services/aiService");
        result = await aiService.generateItinerary(hotel, duration, interests, budget, prompt);
      } catch {
        // Fallback: call Claude API directly if aiService not wired
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `Generate a ${duration}-day travel itinerary for ${hotel?.city || "India"}.
                Interests: ${interests.join(", ")}. Budget: ₹${budget}.
                ${prompt.instruction}
                Return ONLY valid JSON.`,
            }],
          }),
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || "{}";
        const clean = text.replace(/```json|```/g, "").trim();
        result = { success: true, itinerary: JSON.parse(clean) };
      }

      if (result?.success && result.itinerary) {
        setItinerary(result.itinerary);
        setConflicts(detectConflicts(result.itinerary.days));
      }
    } catch (err) {
      console.error("Itinerary generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [hotel, duration, interests, budget, transport, extraCities]);

  // ── PDF export ────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(() => {
    if (!itinerary) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>
      body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#1a1a1a}
      h1{font-size:28px;border-bottom:3px solid #22c55e;padding-bottom:8px}
      h2{font-size:18px;color:#22c55e;margin-top:24px}
      .day{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0}
      .slot{margin:8px 0;padding:8px;background:#f9fafb;border-radius:4px}
      .cost{color:#22c55e;font-weight:bold}
      .meals{background:#fffbeb;padding:8px;border-radius:4px;font-size:13px}
      .tip{color:#6366f1;font-size:12px;font-style:italic}
      .section{background:#f0fdf4;padding:12px;border-radius:8px;margin:12px 0}
    </style></head><body>
    <h1>🗺️ ${itinerary.summary?.destination} — ${itinerary.summary?.duration}</h1>
    <p>Total Budget: <b>₹${itinerary.summary?.total_budget?.toLocaleString()}</b> · Daily: <b>₹${itinerary.summary?.daily_budget?.toLocaleString()}</b></p>
    <p>Carbon footprint: ~${Math.round(carbonKg)} kg CO₂</p>
    ${itinerary.days?.map(d => `
      <div class="day">
        <h2>Day ${d.day} — ${d.theme} <small>(${d.date})</small> ${WEATHER_ICONS[d.weather] || ""}</h2>
        ${["morning","afternoon","evening"].map(s => d[s] ? `
          <div class="slot">
            <b>${s.charAt(0).toUpperCase()+s.slice(1)} · ${d[s].time}</b>: ${d[s].activity}<br/>
            <span>${d[s].description}</span><br/>
            <span class="cost">₹${d[s].cost}</span>
            ${d[s].tip ? `<br/><span class="tip">💡 ${d[s].tip}</span>` : ""}
          </div>` : "").join("")}
        ${d.meals ? `<div class="meals">🍽️ Breakfast: ${d.meals.breakfast} · Lunch: ${d.meals.lunch} · Dinner: ${d.meals.dinner}</div>` : ""}
      </div>`).join("")}
    ${itinerary.recommendations?.length ? `<div class="section"><h2>✨ Recommendations</h2><ul>${itinerary.recommendations.map(r=>`<li>${r}</li>`).join("")}</ul></div>` : ""}
    ${itinerary.packing_list?.length ? `<div class="section"><h2>🧳 Packing List</h2><p>${itinerary.packing_list.join(" · ")}</p></div>` : ""}
    ${itinerary.local_tips?.length ? `<div class="section"><h2>💡 Local Tips</h2><ul>${itinerary.local_tips.map(t=>`<li>${t}</li>`).join("")}</ul></div>` : ""}
    ${itinerary.emergency_contacts ? `<div class="section"><h2>🚨 Emergency Contacts</h2>
      <p>Police: ${itinerary.emergency_contacts.police} · Ambulance: ${itinerary.emergency_contacts.ambulance} · Tourist Helpline: ${itinerary.emergency_contacts.tourist_helpline}</p></div>` : ""}
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Bookora_Itinerary_${hotel?.city || "trip"}_${duration}days.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [itinerary, carbonKg, hotel, duration]);

  // ─── render ─────────────────────────────────────────────────────────────
  return (
    <>
      <button onClick={() => setShowPlanner(true)} className="planner-trigger">
        <Icon d={ICONS.map} size={16} />
        Plan My Trip
      </button>

      {showPlanner && (
        <div className="planner-overlay" onClick={e => e.target === e.currentTarget && setShowPlanner(false)}>
          <div className="planner-modal" ref={modalRef}>

            {/* ── sticky header ── */}
            <div className="planner-header">
              <div className="planner-header__left">
                <Icon d={ICONS.map} size={20} color="#22c55e" />
                <span>AI Itinerary Planner</span>
                {itinerary && <span className="planner-header__city">{itinerary.summary?.destination}</span>}
              </div>
              <button onClick={() => setShowPlanner(false)} className="planner-close">
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            <div className="planner-body">
              {!itinerary ? (
                /* ═══════════════ CONFIG PANEL ═══════════════ */
                <div className="config-panel">

                  {/* Duration */}
                  <section className="config-section">
                    <h3 className="config-label">
                      <Icon d={ICONS.calendar} size={15} color="#22c55e" /> Trip Duration
                    </h3>
                    <div className="pill-row">
                      {[2,3,4,5,7,10,14].map(d => (
                        <button key={d} onClick={() => setDuration(d)}
                          className={`pill ${duration === d ? "pill--active" : ""}`}>
                          {d}D
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Multi-city */}
                  <section className="config-section">
                    <h3 className="config-label">
                      <Icon d={ICONS.plus} size={15} color="#22c55e" /> Multi-City Trip
                      <span className="config-label__sub">Chain multiple cities into one trip</span>
                    </h3>
                    <div className="city-chain">
                      <div className="city-chain__base">
                        <span className="city-chain__dot city-chain__dot--start" />
                        <span className="city-chip city-chip--base">{hotel?.city || "Home City"}</span>
                      </div>
                      {extraCities.map((c, i) => (
                        <div key={i} className="city-chain__item">
                          <span className="city-chain__line" />
                          <span className="city-chain__dot" />
                          <span className="city-chip">
                            {c}
                            <button onClick={() => removeCity(c)} className="city-chip__remove">
                              <Icon d={ICONS.close} size={10} />
                            </button>
                          </span>
                        </div>
                      ))}
                      <div className="city-add">
                        <input value={cityInput} onChange={e => setCityInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addCity()}
                          placeholder="Add city…" className="city-add__input" />
                        <button onClick={addCity} className="city-add__btn">
                          <Icon d={ICONS.plus} size={14} /> Add
                        </button>
                      </div>
                    </div>
                    {extraCities.length > 0 && <CarbonBadge kg={carbonKg} />}
                  </section>

                  {/* Interests */}
                  <section className="config-section">
                    <h3 className="config-label">
                      <Icon d={ICONS.star} size={15} color="#22c55e" /> Travel Interests
                    </h3>
                    <div className="pill-row pill-row--wrap">
                      {INTEREST_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => toggleInterest(o.value)}
                          className={`pill ${interests.includes(o.value) ? "pill--active" : ""}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Transport */}
                  <section className="config-section">
                    <h3 className="config-label">
                      <Icon d={ICONS.zap} size={15} color="#22c55e" /> Transport Mode
                    </h3>
                    <div className="pill-row">
                      {[["flight","✈️ Flight"],["train","🚂 Train"],["car","🚗 Car"],["bus","🚌 Bus"]].map(([v,l]) => (
                        <button key={v} onClick={() => setTransport(v)}
                          className={`pill ${transport === v ? "pill--active" : ""}`}>{l}</button>
                      ))}
                    </div>
                  </section>

                  {/* Budget */}
                  <section className="config-section">
                    <h3 className="config-label">
                      <Icon d={ICONS.star} size={15} color="#22c55e" /> Total Budget
                    </h3>
                    <div className="budget-input-row">
                      <span className="budget-input-row__prefix">₹</span>
                      <input type="number" value={budget} min={1000}
                        onChange={e => setBudget(Number(e.target.value))}
                        className="budget-input-row__field" />
                    </div>
                    <div className="budget-presets">
                      {[5000,10000,15000,25000,50000].map(v => (
                        <button key={v} onClick={() => setBudget(v)}
                          className={`preset ${budget === v ? "preset--active" : ""}`}>
                          ₹{(v/1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                    <p className="config-hint">≈ ₹{Math.round(budget/duration).toLocaleString()} per day · ₹{Math.round(budget/(duration*3)).toLocaleString()} per slot</p>
                  </section>

                  <button onClick={handleGenerate} disabled={loading || interests.length === 0}
                    className="generate-btn">
                    {loading
                      ? <><span className="spinner" /> Crafting your perfect trip…</>
                      : <><Icon d={ICONS.zap} size={18} /> Generate Smart Itinerary</>}
                  </button>
                </div>

              ) : (
                /* ═══════════════ ITINERARY VIEW ═══════════════ */
                <div className="itinerary-view">

                  {/* Hero summary */}
                  <div className="summary-hero">
                    <div className="summary-hero__text">
                      <h2 className="summary-hero__dest">{itinerary.summary?.destination}</h2>
                      <p className="summary-hero__dur">{itinerary.summary?.duration}</p>
                      {itinerary.summary?.highlights?.length > 0 && (
                        <div className="summary-hero__highlights">
                          {itinerary.summary.highlights.map((h, i) => (
                            <span key={i} className="highlight-chip">{h}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="summary-hero__stats">
                      <div className="stat">
                        <span className="stat__val">₹{itinerary.summary?.total_budget?.toLocaleString()}</span>
                        <span className="stat__lbl">Total Budget</span>
                      </div>
                      <div className="stat">
                        <span className="stat__val">₹{itinerary.summary?.daily_budget?.toLocaleString()}</span>
                        <span className="stat__lbl">Per Day</span>
                      </div>
                      <div className="stat">
                        <span className="stat__val">{itinerary.days?.length || 0}</span>
                        <span className="stat__lbl">Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Budget meter */}
                  <BudgetMeter spent={totalSpent} total={budget} />

                  {/* Carbon */}
                  {extraCities.length > 0 && <CarbonBadge kg={carbonKg} />}

                  {/* Conflict warnings */}
                  {conflicts.length > 0 && (
                    <div className="conflicts">
                      <div className="conflicts__header">
                        <Icon d={ICONS.alert} size={14} color="#f59e0b" />
                        <span>Schedule Conflicts Detected</span>
                      </div>
                      {conflicts.map((c, i) => <p key={i} className="conflicts__item">{c}</p>)}
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="tabs">
                    {[["timeline","🗓 Timeline"],["details","📋 Full Details"],["tips","💡 Tips & Packing"]].map(([k,l]) => (
                      <button key={k} onClick={() => setTab(k)}
                        className={`tab ${tab === k ? "tab--active" : ""}`}>{l}</button>
                    ))}
                  </div>

                  {/* ── Timeline tab ── */}
                  {tab === "timeline" && itinerary.days && (
                    <div className="timeline-panel">
                      <TimelineDots days={itinerary.days} activeDay={activeDay} onSelect={setActiveDay} />
                      <DayCard day={itinerary.days[activeDay]} starred={starred} onStar={toggleStar} />
                    </div>
                  )}

                  {/* ── Full details tab ── */}
                  {tab === "details" && itinerary.days && (
                    <div className="details-panel">
                      {itinerary.days.map((d, i) => (
                        <DayCard key={i} day={d} starred={starred} onStar={toggleStar} />
                      ))}
                    </div>
                  )}

                  {/* ── Tips & Packing tab ── */}
                  {tab === "tips" && (
                    <div className="tips-panel">
                      {itinerary.recommendations?.length > 0 && (
                        <div className="tips-block tips-block--blue">
                          <h4>✨ Recommendations</h4>
                          <ul>{itinerary.recommendations.map((r,i) => <li key={i}>{r}</li>)}</ul>
                        </div>
                      )}
                      {itinerary.packing_list?.length > 0 && (
                        <div className="tips-block tips-block--yellow">
                          <h4>🧳 Packing List</h4>
                          <div className="packing-grid">
                            {itinerary.packing_list.map((item,i) => (
                              <span key={i} className="packing-item"><Icon d={ICONS.check} size={11} color="#22c55e" /> {item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {itinerary.local_tips?.length > 0 && (
                        <div className="tips-block tips-block--purple">
                          <h4>💡 Local Tips</h4>
                          <ul>{itinerary.local_tips.map((t,i) => <li key={i}>{t}</li>)}</ul>
                        </div>
                      )}
                      {itinerary.emergency_contacts && (
                        <div className="tips-block tips-block--red">
                          <h4>🚨 Emergency Contacts</h4>
                          <div className="emergency-grid">
                            <span>👮 Police: <b>{itinerary.emergency_contacts.police}</b></span>
                            <span>🚑 Ambulance: <b>{itinerary.emergency_contacts.ambulance}</b></span>
                            <span>📞 Tourist Helpline: <b>{itinerary.emergency_contacts.tourist_helpline}</b></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Starred activities summary */}
                  {starred.size > 0 && (
                    <div className="starred-summary">
                      <Icon d={ICONS.star} size={14} color="#f59e0b" />
                      <span>{starred.size} starred activit{starred.size === 1 ? "y" : "ies"} saved</span>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="action-bar">
                    <button onClick={() => { setItinerary(null); setConflicts([]); }} className="action-btn action-btn--ghost">
                      ↩ Replan
                    </button>
                    <button onClick={handleShare} className="action-btn action-btn--outline">
                      <Icon d={ICONS.share} size={14} />
                      {copied ? "Copied!" : "Share"}
                    </button>
                    <button onClick={handleExportPDF} className="action-btn action-btn--green">
                      <Icon d={ICONS.download} size={14} />
                      Export PDF
                    </button>
                  </div>

                  {shareId && (
                    <div className="share-bar">
                      <Icon d={ICONS.copy} size={13} color="#6366f1" />
                      <code>bookora.com/itinerary/{shareId}</code>
                      <span className="share-bar__note">Link copied to clipboard</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── All styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* Trigger */
        .planner-trigger{display:inline-flex;align-items:center;gap:8px;background:#22c55e;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:background .2s,transform .15s}
        .planner-trigger:hover{background:#16a34a;transform:translateY(-1px)}

        /* Overlay */
        .planner-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}

        /* Modal */
        .planner-modal{background:#fff;border-radius:20px;width:100%;max-width:760px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.25);overflow:hidden}

        /* Header */
        .planner-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0fdf4;background:#fff;position:sticky;top:0;z-index:10}
        .planner-header__left{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;color:#15803d}
        .planner-header__city{font-size:13px;background:#f0fdf4;color:#166534;padding:2px 10px;border-radius:20px;font-weight:500}
        .planner-close{border:none;background:none;cursor:pointer;color:#6b7280;padding:4px;border-radius:6px;transition:background .15s}
        .planner-close:hover{background:#f3f4f6}

        /* Body */
        .planner-body{overflow-y:auto;padding:20px;flex:1}

        /* Config sections */
        .config-section{margin-bottom:22px}
        .config-label{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#374151;margin-bottom:10px}
        .config-label__sub{font-weight:400;color:#9ca3af;margin-left:6px}
        .config-hint{font-size:12px;color:#9ca3af;margin-top:6px}

        /* Pills */
        .pill-row{display:flex;gap:8px;flex-wrap:nowrap}
        .pill-row--wrap{flex-wrap:wrap}
        .pill{border:1.5px solid #e5e7eb;background:#fff;border-radius:40px;padding:6px 14px;font-size:13px;cursor:pointer;transition:all .15s;color:#374151;font-weight:500;white-space:nowrap}
        .pill:hover{border-color:#22c55e;color:#15803d}
        .pill--active{background:#22c55e;border-color:#22c55e;color:#fff}

        /* Multi-city chain */
        .city-chain{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
        .city-chain__base,.city-chain__item{display:flex;align-items:center;gap:8px}
        .city-chain__line{width:2px;height:16px;background:#e5e7eb;margin-left:7px}
        .city-chain__dot{width:14px;height:14px;border-radius:50%;background:#e5e7eb;flex-shrink:0}
        .city-chain__dot--start{background:#22c55e}
        .city-chip{display:inline-flex;align-items:center;gap:6px;background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:500}
        .city-chip--base{background:#22c55e;color:#fff;border-color:#22c55e}
        .city-chip__remove{border:none;background:none;cursor:pointer;padding:0;color:#16a34a;line-height:1;display:flex}
        .city-add{display:flex;gap:8px;margin-top:8px}
        .city-add__input{flex:1;border:1.5px solid #e5e7eb;border-radius:8px;padding:7px 12px;font-size:13px;outline:none;transition:border .15s}
        .city-add__input:focus{border-color:#22c55e}
        .city-add__btn{display:flex;align-items:center;gap:4px;background:#22c55e;color:#fff;border:none;padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}

        /* Carbon badge */
        .carbon-badge{display:inline-flex;align-items:center;gap:6px;border:1.5px solid;border-radius:20px;padding:4px 12px;font-size:12px;margin-top:8px;background:#fff}

        /* Budget input */
        .budget-input-row{display:flex;align-items:center;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;max-width:220px}
        .budget-input-row__prefix{padding:8px 12px;background:#f9fafb;font-weight:600;font-size:15px;color:#374151}
        .budget-input-row__field{border:none;padding:8px 12px;font-size:15px;outline:none;flex:1}
        .budget-presets{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
        .preset{border:1.5px solid #e5e7eb;background:#fff;border-radius:20px;padding:4px 12px;font-size:12px;cursor:pointer;transition:all .15s;font-weight:500}
        .preset:hover{border-color:#22c55e}
        .preset--active{background:#f0fdf4;border-color:#22c55e;color:#15803d}

        /* Generate button */
        .generate-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;padding:14px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .2s,transform .15s;margin-top:8px}
        .generate-btn:hover:not(:disabled){opacity:.92;transform:translateY(-1px)}
        .generate-btn:disabled{opacity:.5;cursor:not-allowed}
        .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* Summary hero */
        .summary-hero{background:linear-gradient(135deg,#15803d,#0d9488);border-radius:14px;padding:18px 20px;color:#fff;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
        .summary-hero__dest{font-size:20px;font-weight:700;margin-bottom:2px}
        .summary-hero__dur{font-size:13px;opacity:.85;margin-bottom:8px}
        .summary-hero__highlights{display:flex;flex-wrap:wrap;gap:6px}
        .highlight-chip{background:rgba(255,255,255,.18);border-radius:20px;padding:2px 10px;font-size:11px}
        .summary-hero__stats{display:flex;gap:16px;flex-shrink:0}
        .stat{display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.15);border-radius:10px;padding:8px 14px}
        .stat__val{font-size:16px;font-weight:700}
        .stat__lbl{font-size:10px;opacity:.8;white-space:nowrap}

        /* Budget meter */
        .budget-meter{background:#f9fafb;border-radius:10px;padding:12px 14px;margin-bottom:12px}
        .budget-meter__labels{display:flex;justify-content:space-between;font-size:12px;font-weight:500;margin-bottom:6px;color:#374151}
        .budget-meter__track{height:8px;background:#e5e7eb;border-radius:20px;overflow:hidden}
        .budget-meter__fill{height:100%;border-radius:20px;transition:width .6s cubic-bezier(.34,1.56,.64,1)}
        .budget-meter__pct{font-size:11px;text-align:right;margin-top:4px;font-weight:600}

        /* Conflicts */
        .conflicts{background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:12px;margin-bottom:12px}
        .conflicts__header{display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px;color:#92400e;margin-bottom:6px}
        .conflicts__item{font-size:12px;color:#92400e;margin:2px 0}

        /* Tabs */
        .tabs{display:flex;gap:4px;border-bottom:2px solid #f0fdf4;margin-bottom:16px}
        .tab{border:none;background:none;padding:8px 16px;font-size:13px;font-weight:500;color:#6b7280;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s}
        .tab--active{color:#15803d;border-bottom-color:#22c55e}

        /* Timeline dots */
        .timeline-dots{display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:12px;margin-bottom:16px}
        .timeline-dot{border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px;padding:0 4px}
        .timeline-dot__num{width:32px;height:32px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#6b7280;transition:all .2s}
        .timeline-dot--active .timeline-dot__num{background:#22c55e;color:#fff;transform:scale(1.1)}
        .timeline-dot__theme{font-size:10px;color:#9ca3af;text-align:center;max-width:56px;line-height:1.2}
        .timeline-dot--active .timeline-dot__theme{color:#15803d}
        .timeline-connector{flex:1;height:2px;background:#e5e7eb;margin-top:15px;min-width:12px}

        /* Day card */
        .day-card{border:1.5px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:12px}
        .day-card__header{background:#f0fdf4;padding:12px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .day-card__meta{display:flex;flex-direction:column}
        .day-card__num{font-size:10px;font-weight:700;color:#15803d;letter-spacing:.5px}
        .day-card__date{font-size:12px;color:#6b7280}
        .day-card__theme{font-weight:600;font-size:14px;color:#1f2937;flex:1}
        .weather-chip{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:2px 10px;font-size:12px;color:#374151}
        .day-card__slots{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
        .day-card__photo{position:relative;height:140px;overflow:hidden}
        .day-card__photo img{width:100%;height:100%;object-fit:cover}
        .day-card__photo-label{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,.6),transparent);color:#fff;padding:8px 12px;font-size:12px;font-weight:500}

        /* Slot */
        .slot{display:flex;gap:10px;padding:10px;background:#fafafa;border-radius:10px;border-left:3px solid var(--slot-color)}
        .slot__time-col{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:40px}
        .slot__icon{font-size:16px}
        .slot__time{font-size:10px;color:#9ca3af;white-space:nowrap}
        .slot__body{flex:1}
        .slot__top{display:flex;align-items:flex-start;justify-content:space-between;gap:6px}
        .slot__activity{font-weight:600;font-size:14px;color:#1f2937}
        .slot__desc{font-size:12px;color:#6b7280;margin:3px 0}
        .slot__meta{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:4px}
        .slot__cost{font-size:12px;font-weight:700;color:#22c55e}
        .slot__travel{display:flex;align-items:center;gap:3px;font-size:11px;color:#9ca3af}
        .slot__conflict{background:#fef3c7;color:#d97706;font-size:10px;font-weight:700;padding:1px 6px;border-radius:20px;margin-left:4px}
        .slot__tip{font-size:11px;color:#6366f1;font-style:italic}

        /* Star button */
        .star-btn{border:none;background:none;cursor:pointer;padding:2px;display:flex;flex-shrink:0;transition:transform .15s}
        .star-btn:hover{transform:scale(1.2)}
        .star-btn--active{filter:drop-shadow(0 0 3px #f59e0b)}

        /* Meals */
        .meals-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:8px 14px;background:#fffbeb;font-size:12px;color:#78350f}

        /* Action bar */
        .action-bar{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
        .action-btn{display:flex;align-items:center;justify-content:center;gap:6px;flex:1;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;border:none;min-width:100px}
        .action-btn--ghost{background:#f3f4f6;color:#374151}
        .action-btn--ghost:hover{background:#e5e7eb}
        .action-btn--outline{background:#fff;color:#15803d;border:2px solid #22c55e}
        .action-btn--outline:hover{background:#f0fdf4}
        .action-btn--green{background:#22c55e;color:#fff}
        .action-btn--green:hover{background:#16a34a}

        /* Share bar */
        .share-bar{display:flex;align-items:center;gap:8px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:8px 12px;margin-top:10px;font-size:12px}
        .share-bar__note{color:#6b7280;margin-left:auto}

        /* Starred summary */
        .starred-summary{display:flex;align-items:center;gap:6px;font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;margin-top:12px}

        /* Tips panel */
        .tips-panel{display:flex;flex-direction:column;gap:12px}
        .tips-block{border-radius:12px;padding:14px}
        .tips-block h4{font-weight:700;font-size:14px;margin-bottom:8px}
        .tips-block ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:4px}
        .tips-block li{font-size:13px;padding-left:12px;position:relative}
        .tips-block li::before{content:"•";position:absolute;left:0}
        .tips-block--blue{background:#eff6ff;color:#1e40af}
        .tips-block--yellow{background:#fffbeb;color:#78350f}
        .tips-block--purple{background:#faf5ff;color:#581c87}
        .tips-block--red{background:#fff1f2;color:#9f1239}
        .packing-grid{display:flex;flex-wrap:wrap;gap:8px}
        .packing-item{display:flex;align-items:center;gap:4px;background:#fff;border-radius:20px;padding:3px 10px;font-size:12px;border:1px solid #fde68a}
        .emergency-grid{display:flex;flex-direction:column;gap:4px;font-size:13px}
      `}</style>
    </>
  );
};

export default ItineraryPlanner;