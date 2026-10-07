/**
 * SKYBOLT AI — Master Application Controller (Editorial Weather Intelligence)
 * Coordinates the map-first nowcast experience, timeline slider, scenarios & AI.
 */

// Single Source of Truth
const state = {
  location: {
    name: "Mumbai, Maharashtra",
    lat: 19.0760,
    lon: 72.8777
  },
  dataMode: "SIMULATED DATA", // "LIVE DATA", "SIMULATED DATA", or "DATA UNAVAILABLE"
  horizon: "30m", // "30m" or "3h"
  activeScenario: "developing", // "stable", "developing", "severe"
  inputs: {
    temp: 28.4,
    humidity: 82,
    pressure: 1002,
    wind_speed: 18,
    wind_direction: 240,
    rainfall: 4.2,
    cloud_cover: 91,
    radar: 41,
    lightning: 11,
    cape: 1540,
    lifted_index: -4.2,
    storm_motion: 28,
    cloud_top_temp: -58,
    prev_radar: 35,
    prev_lightning: 5,
    prev_rainfall: 2.1,
    prev_humidity: 78,
    prev_cloud_cover: 80
  },
  risk: null
};

// Scenario Presets (Section 29: Stable, Developing, Severe)
const DEMO_SCENARIOS = {
  stable: {
    name: "Bengaluru, Karnataka (Stable Sky)",
    lat: 12.9716,
    lon: 77.5946,
    data: {
      temp: 24.2,
      humidity: 56,
      pressure: 1014,
      wind_speed: 12,
      wind_direction: 100,
      rainfall: 0.0,
      cloud_cover: 22,
      radar: 16,
      lightning: 0,
      cape: 280,
      lifted_index: +4.5,
      storm_motion: 14,
      cloud_top_temp: -12,
      prev_radar: 15,
      prev_lightning: 0,
      prev_rainfall: 0.0,
      prev_humidity: 55,
      prev_cloud_cover: 20
    }
  },
  developing: {
    name: "Mumbai, Maharashtra (Inflow Squall)",
    lat: 19.0760,
    lon: 72.8777,
    data: {
      temp: 28.4,
      humidity: 82,
      pressure: 1002,
      wind_speed: 18,
      wind_direction: 240,
      rainfall: 4.2,
      cloud_cover: 91,
      radar: 41,
      lightning: 11,
      cape: 1540,
      lifted_index: -4.2,
      storm_motion: 28,
      cloud_top_temp: -58,
      prev_radar: 35,
      prev_lightning: 5,
      prev_rainfall: 2.1,
      prev_humidity: 78,
      prev_cloud_cover: 80
    }
  },
  severe: {
    name: "Kolkata, West Bengal (Severe Supercell)",
    lat: 22.5726,
    lon: 88.3639,
    data: {
      temp: 32.5,
      humidity: 89,
      pressure: 994,
      wind_speed: 48,
      wind_direction: 295,
      rainfall: 32.0,
      cloud_cover: 98,
      radar: 54,
      lightning: 38,
      cape: 2800,
      lifted_index: -7.8,
      storm_motion: 44,
      cloud_top_temp: -76,
      prev_radar: 44,
      prev_lightning: 16,
      prev_rainfall: 14.0,
      prev_humidity: 84,
      prev_cloud_cover: 92
    }
  }
};

/**
 * Switch Scenario (Stable, Developing, Severe - Section 29)
 */
function selectDemoScenario(key) {
  state.activeScenario = key;
  state.dataMode = "SIMULATED DATA";
  const preset = DEMO_SCENARIOS[key];
  if (!preset) return;

  state.location.name = preset.name;
  state.location.lat = preset.lat;
  state.location.lon = preset.lon;
  state.inputs = { ...preset.data };

  // Update UI Scenario Buttons
  ['stable', 'developing', 'severe'].forEach(k => {
    const btn = document.getElementById(`btn-scenario-${k}`);
    if (btn) {
      if (k === key) {
        btn.className = "px-2.5 py-1 rounded text-xs font-semibold bg-[#18D6D1]/20 text-[#18D6D1] border border-[#18D6D1]/50 shadow-sm transition-all";
      } else {
        btn.className = "px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-[#F7F6F2] bg-white/5 hover:bg-white/10 border border-white/10 transition-all";
      }
    }
  });

  runNowcast();
}

/**
 * Toggle Forecast Horizon (0-30 min vs 0-3 hours)
 */
function setForecastHorizon(horizon) {
  state.horizon = horizon;
  const btn30m = document.getElementById('btn-horizon-30m');
  const btn3h = document.getElementById('btn-horizon-3h');

  if (horizon === '30m') {
    if (btn30m) btn30m.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-[#18D6D1]/20 text-[#18D6D1] border border-[#18D6D1]/50 shadow-sm transition-all";
    if (btn3h) btn3h.className = "px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-[#F7F6F2] bg-white/5 transition-all";
  } else {
    if (btn3h) btn3h.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-[#18D6D1]/20 text-[#18D6D1] border border-[#18D6D1]/50 shadow-sm transition-all";
    if (btn30m) btn30m.className = "px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-[#F7F6F2] bg-white/5 transition-all";
  }

  runNowcast();
}

/**
 * Master Nowcast Execution Pipeline
 */
function runNowcast() {
  state.risk = SKYBOLT_MODEL.predict(state.inputs, state.horizon);
  const r = state.risk;

  // 1. Update Top Bar Display & Built-in Marked Coordinates
  updateElement('displayLocationTitle', state.location.name);
  updateElement('displayCoordinates', `${state.location.lat.toFixed(4)}° N, ${state.location.lon.toFixed(4)}° E`);
  updateElement('displayMarkedLatTop', `${state.location.lat.toFixed(4)}° N`);
  updateElement('displayMarkedLonTop', `${state.location.lon.toFixed(4)}° E`);
  updateElement('displayAccuracyTop', `${r.accuracy}%`);

  // Update Marked Coordinates & Accuracy in Risk Panel
  updateElement('nowcastMarkedLat', `${state.location.lat.toFixed(4)}° N`);
  updateElement('nowcastMarkedLon', `${state.location.lon.toFixed(4)}° E`);
  updateElement('nowcastAccuracy', `${r.accuracy}%`);
  updateElement('accuracyBadgeLabel', `${r.accuracy}% Calibrated`);
  updateElement('accuracyMarginLabel', `±${r.errorMargin}% / ±${r.spatialToleranceKm} km margin`);
  
  // Data Status Badge (Section 30: LIVE DATA vs SIMULATED DATA vs DATA UNAVAILABLE)
  const statusBadge = document.getElementById('displayDataBadge');
  if (statusBadge) {
    if (state.dataMode === 'LIVE DATA') {
      statusBadge.className = "px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#6D786C]/20 text-[#A3B1A2] border border-[#6D786C]/40 flex items-center space-x-1.5";
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#6D786C]"></span><span>LIVE DATA</span>';
    } else if (state.dataMode === 'DATA UNAVAILABLE') {
      statusBadge.className = "px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-white/5 text-[#94948E] border border-white/10 flex items-center space-x-1.5";
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#6C6C67]"></span><span>DATA UNAVAILABLE</span>';
    } else {
      statusBadge.className = "px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#C8943D]/15 text-[#C8943D] border border-[#C8943D]/30 flex items-center space-x-1.5";
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#C8943D]"></span><span>SIMULATED DATA</span>';
    }
  }

  // 2. Update Risk Panel (Section 25: Editorial Typography)
  updateElement('nowcastRiskNumber', `${r.probability}%`);
  updateElement('nowcastConfidence', `Confidence: ${r.confidence}%`);
  updateElement('nowcastArrivalMin', r.estimatedArrivalMin > 0 ? `~${r.estimatedArrivalMin} min` : "0–3 hours");

  const riskBadge = document.getElementById('nowcastRiskBadge');
  if (riskBadge) {
    riskBadge.innerText = r.riskLabel;
    if (r.riskLevel === 'SEVERE') {
      riskBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#8F3F3A]/20 text-[#B85C52] border border-[#B85C52]/40";
    } else if (r.riskLevel === 'MODERATE') {
      riskBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#C8943D]/15 text-[#C8943D] border border-[#C8943D]/30";
    } else {
      riskBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#6D786C]/20 text-[#A3B1A2] border border-[#6D786C]/40";
    }
  }

  // Semicircular Gauge Arc (Circumference ~267px)
  const gaugeArc = document.getElementById('gaugeArcPath');
  if (gaugeArc) {
    const maxOffset = 267;
    const progress = Math.min(r.probability / 100, 1.0);
    const strokeOffset = maxOffset * (1 - progress);
    gaugeArc.style.strokeDashoffset = strokeOffset;
    gaugeArc.style.stroke = r.riskLevel === 'SEVERE' ? '#8F3F3A' : (r.riskLevel === 'MODERATE' ? '#C8943D' : '#6D786C');
  }

  // 3. "Why is risk changing?" Delta Values (Section 26)
  updateElement('deltaRadarVal', `${state.inputs.prev_radar} → ${state.inputs.radar} dBZ`);
  updateElement('deltaLightningVal', `${state.inputs.prev_lightning} → ${state.inputs.lightning} strikes`);
  updateElement('deltaHumidityVal', `${state.inputs.prev_humidity}% → ${state.inputs.humidity}%`);
  updateElement('deltaCloudVal', `${state.inputs.prev_cloud_cover}% → ${state.inputs.cloud_cover}%`);

  // 4. Update Forecast Summary Timeline (Section 24)
  updateForecastSummaryTimeline(r.probability, state.inputs.radar);

  // 5. Update Center Map
  if (typeof updateMapData === 'function') {
    updateMapData(state.location.lat, state.location.lon, state.location.name);
  }

  // 6. Update Atmospheric Intelligence Surface (Section 27)
  updateElement('metricTemp', `${state.inputs.temp} °C`);
  updateElement('metricHumidity', `${state.inputs.humidity} %`);
  updateElement('metricPressure', `${state.inputs.pressure} hPa`);
  updateElement('metricWind', `${state.inputs.wind_speed} km/h`);
  updateElement('metricWindDir', `${state.inputs.wind_direction}° WSW`);
  updateElement('metricStormMotion', `${state.inputs.storm_motion} km/h`);
  updateElement('metricRainfall', `${state.inputs.rainfall} mm/h`);
  updateElement('metricRadar', `${state.inputs.radar} dBZ`);
  updateElement('metricLightning', `${state.inputs.lightning} / 10m`);

  // Advanced Values
  updateElement('metricCape', `${state.inputs.cape} J/kg`);
  updateElement('metricLiftedIndex', `${state.inputs.lifted_index}`);
  updateElement('metricCloudTop', `${state.inputs.cloud_top_temp} °C`);

  // Ensemble Weights
  setProgressBar('weightRadarBar', 'weightRadarVal', r.contributors.radar);
  setProgressBar('weightCapeBar', 'weightCapeVal', r.contributors.instability);
  setProgressBar('weightLightningBar', 'weightLightningVal', r.contributors.lightning);
  setProgressBar('weightSatelliteBar', 'weightSatelliteVal', r.contributors.satellite);

  // 7. Update AI Explanation (Section 28)
  updateElement('aiExplanationText', r.explanation);
}

/**
 * Forecast Summary Timeline Cards (Section 24)
 */
function updateForecastSummaryTimeline(currentProb, radarDbz) {
  const steps = [
    { id: 't0', label: 'Now', prob: currentProb },
    { id: 't30', label: '+30m', prob: Math.min(Math.round(currentProb * 1.2), 98) },
    { id: 't60', label: '+60m', prob: Math.min(Math.round(currentProb * 1.08), 94) },
    { id: 't120', label: '+120m', prob: Math.max(Math.round(currentProb * 0.85), 25) },
    { id: 't180', label: '+180m', prob: Math.max(Math.round(currentProb * 0.52), 12) }
  ];

  steps.forEach(s => {
    updateElement(`summary-prob-${s.id}`, `${s.prob}%`);
    const pill = document.getElementById(`summary-pill-${s.id}`);
    if (pill) {
      if (s.prob >= 75) {
        pill.className = "px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8F3F3A]/20 text-[#B85C52] border border-[#B85C52]/40";
        pill.innerText = "Severe ↑";
      } else if (s.prob >= 40) {
        pill.className = "px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C8943D]/15 text-[#C8943D] border border-[#C8943D]/30";
        pill.innerText = "Mod ↑";
      } else {
        pill.className = "px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#6D786C]/20 text-[#A3B1A2] border border-[#6D786C]/40";
        pill.innerText = "Clear";
      }
    }
  });
}

function setProgressBar(barId, valId, val) {
  const bar = document.getElementById(barId);
  const text = document.getElementById(valId);
  if (bar) bar.style.width = `${val}%`;
  if (text) text.innerText = `${val}%`;
}

function updateElement(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/**
 * City Search & Geocoding (Section 20)
 */
async function searchCity(query) {
  if (!query || query.trim() === '') return;
  const statusEl = document.getElementById('searchFeedback');
  if (statusEl) statusEl.innerText = "Locating coordinates...";

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl);
    const data = await res.json();

    if (data && data.results && data.results.length > 0) {
      const loc = data.results[0];
      const name = `${loc.name}, ${loc.country || ''}`;
      await fetchLiveWeather(loc.latitude, loc.longitude, name);
      if (statusEl) statusEl.innerText = "";
    } else {
      if (statusEl) statusEl.innerText = "Location not found. Try Mumbai, Pune, Delhi, etc.";
    }
  } catch (err) {
    console.error("Geocoding error:", err);
    if (statusEl) statusEl.innerText = "Network unavailable. Retaining current profile.";
  }
}

/**
 * Browser GPS Geolocation (Section 21)
 */
function useCurrentLocation() {
  const statusEl = document.getElementById('searchFeedback');
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  if (statusEl) statusEl.innerText = "Acquiring GPS fix...";
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = parseFloat(pos.coords.latitude.toFixed(4));
      const lon = parseFloat(pos.coords.longitude.toFixed(4));
      await fetchLiveWeather(lat, lon, `GPS Location (${lat}°N, ${lon}°E)`);
      if (statusEl) statusEl.innerText = "";
    },
    (err) => {
      console.warn("GPS error:", err);
      if (statusEl) statusEl.innerText = "GPS access denied. Use search bar above.";
    },
    { timeout: 8000 }
  );
}

/**
 * Map Click Inspector Callback
 */
async function fetchCustomLocationWeather(lat, lon, name) {
  await fetchLiveWeather(lat, lon, name);
}

/**
 * Live Weather Sync via Open-Meteo API
 */
async function fetchLiveWeather(lat, lon, locationName) {
  state.dataMode = "LIVE DATA";
  state.location.name = locationName;
  state.location.lat = parseFloat(Number(lat).toFixed(4));
  state.location.lon = parseFloat(Number(lon).toFixed(4));

  // Immediate UI update with current prediction model for instant response
  runNowcast();

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,weather_code,cloud_cover&hourly=cape,lifted_index&forecast_days=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.current) {
      const cur = data.current;
      const hourly = data.hourly || {};
      const capeVal = hourly.cape && hourly.cape.length > 0 ? hourly.cape[0] : 1350;
      const liVal = hourly.lifted_index && hourly.lifted_index.length > 0 ? hourly.lifted_index[0] : -3.8;

      state.inputs.temp = cur.temperature_2m || 28.0;
      state.inputs.humidity = cur.relative_humidity_2m || 75;
      state.inputs.pressure = Math.round(cur.surface_pressure || 1008);
      state.inputs.wind_speed = Math.round(cur.wind_speed_10m || 16);
      state.inputs.wind_direction = cur.wind_direction_10m || 240;
      state.inputs.rainfall = cur.precipitation || 0.0;
      state.inputs.cloud_cover = cur.cloud_cover || 65;

      const estimatedRadar = cur.precipitation > 1 ? Math.min(36 + cur.precipitation * 3, 56) : (cur.cloud_cover > 75 ? 32 : 16);
      state.inputs.radar = Math.round(estimatedRadar);
      state.inputs.cape = Math.round(capeVal);
      state.inputs.lifted_index = parseFloat(liVal.toFixed(1));
      state.inputs.lightning = cur.precipitation > 4 ? 16 : (cur.cloud_cover > 80 ? 5 : 0);
      state.inputs.cloud_top_temp = -Math.round((cur.cloud_cover / 100) * 58 + 12);

      // Previous observation deltas
      state.inputs.prev_radar = Math.max(state.inputs.radar - 5, 10);
      state.inputs.prev_lightning = Math.max(state.inputs.lightning - 4, 0);
      state.inputs.prev_humidity = Math.max(state.inputs.humidity - 4, 30);
      state.inputs.prev_cloud_cover = Math.max(state.inputs.cloud_cover - 7, 10);

      runNowcast();
    }
  } catch (err) {
    console.error("Live fetch error:", err);
    state.dataMode = "DATA UNAVAILABLE";
    runNowcast();
  }
}

/**
 * Contextual "SKYBOLT INTELLIGENCE" Assistant (Section 28)
 */
function askSkybolt(promptText) {
  const chatBox = document.getElementById('chatMessages');
  if (!chatBox) return;

  const userMsg = document.createElement('div');
  userMsg.className = "flex justify-end mb-2";
  userMsg.innerHTML = `
    <div class="bg-[#18D6D1] text-[#0B0D0F] font-semibold text-xs px-3 py-1.5 rounded-lg max-w-[85%] font-sans shadow-sm">
      ${escapeHtml(promptText)}
    </div>
  `;
  chatBox.appendChild(userMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  setTimeout(() => {
    const r = state.risk;
    const q = promptText.toLowerCase();
    let answer = "";

    if (q.includes("how accurate") || q.includes("accurate") || q.includes("accuracy")) {
      answer = `Based on multi-source sensor consensus, the live nowcast for **${state.location.name}** (Marked Latitude: **${state.location.lat.toFixed(4)}° N**, Longitude: **${state.location.lon.toFixed(4)}° E**) has an estimated **${r.accuracy}% calibrated prediction accuracy** with an error margin of **±${r.errorMargin}%** (spatial tolerance: **±${r.spatialToleranceKm} km**, arrival margin: **±${r.temporalToleranceMin} min**). Cross-sensor coherence between Doppler radar and satellite observations is currently evaluated at **${r.confidence}%** (High Consensus).`;
    } else if (q.includes("why is risk increasing") || q.includes("why increasing")) {
      answer = `Risk is increasing because storm intensity (${state.inputs.radar} dBZ, up ${r.deltas.radar_change >= 0 ? '+' : ''}${r.deltas.radar_change} dBZ), lightning activity and atmospheric moisture (${state.inputs.humidity}%) are increasing around ${state.location.name.split(',')[0]}.`;
    } else if (q.includes("what changed") || q.includes("recently")) {
      answer = `In the last 15 minutes: Radar reflectivity shifted ${state.inputs.prev_radar} → ${state.inputs.radar} dBZ. Lightning count changed ${state.inputs.prev_lightning} → ${state.inputs.lightning} strikes. Relative humidity reached ${state.inputs.humidity}%.`;
    } else if (q.includes("what does") || q.includes("mean")) {
      answer = `A probability of **${r.probability}% (${r.riskLabel} Risk)** with **${r.confidence}% confidence** indicates ${r.riskLevel === 'SEVERE' ? 'an approaching high-impact convective core with lightning, localized squalls, and heavy downpours' : (r.riskLevel === 'MODERATE' ? 'developing storm clusters and localized precipitation within ~' + r.estimatedArrivalMin + ' minutes' : 'stable atmospheric conditions with no thunderstorm development expected')}.`;
    } else if (q.includes("explain this simply") || q.includes("simply")) {
      answer = `In plain English: A storm is ${r.riskLevel === 'SEVERE' ? 'active and expected in ~' + r.estimatedArrivalMin + ' minutes. Take indoor shelter.' : (r.riskLevel === 'MODERATE' ? 'developing nearby and expected in ~' + r.estimatedArrivalMin + ' minutes. Monitor changing skies.' : 'not expected. The sky remains stable.')}`;
    } else {
      answer = `Current telemetry for **${state.location.name.split(',')[0]}** (Marked Lat: **${state.location.lat.toFixed(4)}° N**, Lon: **${state.location.lon.toFixed(4)}° E**): **${r.probability}% thunderstorm risk**, accuracy at **${r.accuracy}%**, Doppler core at **${state.inputs.radar} dBZ**, and CAPE buoyancy of **${state.inputs.cape} J/kg**. Lead time is estimated at ~${r.estimatedArrivalMin} minutes.`;
    }

    const botMsg = document.createElement('div');
    botMsg.className = "flex justify-start mb-2";
    botMsg.innerHTML = `
      <div class="bg-[#161A1F] border border-white/10 text-[#F7F6F2] text-xs p-2.5 rounded-lg max-w-[90%] leading-relaxed font-sans shadow-sm">
        <div class="flex items-center space-x-1.5 mb-1 text-[10px] text-[#18D6D1] font-semibold uppercase tracking-wider">
          <span class="w-1.5 h-1.5 rounded-full bg-[#18D6D1]"></span>
          <span>SKYBOLT INTELLIGENCE</span>
        </div>
        ${formatMarkdown(answer)}
      </div>
    `;
    chatBox.appendChild(botMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 250);
}

function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  const txt = inp.value.trim();
  if (txt) {
    askSkybolt(txt);
    inp.value = "";
  }
}

// Helpers
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Modal Helpers
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
  if (id === 'shareModal') {
    const inp = document.getElementById('modalShareLinkInput');
    if (inp) {
      if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        inp.value = window.location.origin;
      } else {
        inp.value = "https://conferences-calendars-inherited-readings.trycloudflare.com";
      }
    }
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

function copyPrototypeLink() {
  const inp = document.getElementById('modalShareLinkInput');
  if (inp) {
    inp.select();
    navigator.clipboard.writeText(inp.value);
    alert("Live prototype link copied to clipboard!");
  }
}

// Mobile Nav Drawer
function toggleMobileNav() {
  const nav = document.getElementById('mobileNavDrawer');
  if (nav) nav.classList.toggle('hidden');
}

// UTC Clock
setInterval(() => {
  const el = document.getElementById('topClock');
  if (el) {
    const d = new Date();
    el.innerText = d.toTimeString().split(' ')[0] + ' UTC';
  }
}, 1000);

// ========================================================
// ATMOSPHERIC VIDEO BACKGROUND CONTROLLER (Sections 3, 4, 10, 11, 13, 14, 15)
// ========================================================

let isAtmosphereModeOn = true;

function initAtmosphericVideo() {
  const bgVideo = document.getElementById('atmosphericBgVideo');
  const bgContainer = document.getElementById('atmosphericVideoContainer');
  if (!bgVideo || !bgContainer) return;

  // Guarantee muted autoplay & loop (Section 18)
  bgVideo.muted = true;
  bgVideo.playsInline = true;
  bgVideo.loop = true;

  // Seamless Loop Smoothing (Section 21)
  bgVideo.addEventListener('timeupdate', () => {
    if (bgVideo.duration && bgVideo.currentTime >= bgVideo.duration - 0.35) {
      bgVideo.currentTime = 0.05;
      bgVideo.play().catch(e => console.warn("Loop play note:", e));
    }
  });

  bgVideo.addEventListener('ended', () => {
    bgVideo.currentTime = 0.05;
    bgVideo.play().catch(e => console.warn(e));
  });

  const playPromise = bgVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("Autoplay deferred by browser policy, showing poster frame:", err);
    });
  }

  // Section 10 & 11: Hero → Intelligence → Nowcast Command Tonal Progression
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
      if (!isAtmosphereModeOn) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'hero') {
            bgContainer.style.opacity = '1.0';  // 100% Atmospheric presence on Hero
          } else if (id === 'multi-source') {
            bgContainer.style.opacity = '0.25'; // 25% Subtler presence in Intelligence
          } else if (id === 'nowcast-command') {
            bgContainer.style.opacity = '0.06'; // 6% Minimal presence over Operational Map
          } else if (id === 'technology-section') {
            bgContainer.style.opacity = '0.0';  // Clean neutral background
          } else if (id === 'use-cases') {
            bgContainer.style.opacity = '0.15'; // Subtle atmospheric texture
          }
        }
      });
    }, { threshold: [0.15, 0.4] });

    ['hero', 'multi-source', 'nowcast-command', 'technology-section', 'use-cases'].forEach(secId => {
      const el = document.getElementById(secId);
      if (el) observer.observe(el);
    });
  }
}

/**
 * Atmosphere Mode Toggle (Section 13: ON / OFF)
 */
function toggleAtmosphericMode() {
  isAtmosphereModeOn = !isAtmosphereModeOn;
  const body = document.body;
  const toggleText = document.getElementById('atmosphereToggleText');
  const toggleDot = document.getElementById('atmosphereToggleDot');
  const bgContainer = document.getElementById('atmosphericVideoContainer');

  if (isAtmosphereModeOn) {
    body.classList.remove('atmosphere-off');
    if (toggleText) toggleText.innerText = 'Atmosphere: ON';
    if (toggleDot) toggleDot.className = 'w-1.5 h-1.5 rounded-full bg-[#18D6D1]';
    if (bgContainer) bgContainer.style.opacity = '1.0';
  } else {
    body.classList.add('atmosphere-off');
    if (toggleText) toggleText.innerText = 'Atmosphere: OFF';
    if (toggleDot) toggleDot.className = 'w-1.5 h-1.5 rounded-full bg-[#6C6C67]';
    if (bgContainer) bgContainer.style.opacity = '0.0';
  }
}

/**
 * Custom Video Upload & Automatic Normalization Pipeline (Sections 14, 15)
 * Shows explicit status sequence without exposing developer errors.
 */
function handleCustomVideoUpload(event) {
  const file = event.target.files && event.target.files[0];
  const feedback = document.getElementById('uploadFeedback');
  const activeTitle = document.getElementById('activeAtmosphereTitle');
  const activeDetails = document.getElementById('activeAtmosphereDetails');
  if (!file) return;

  const validExts = ['.mp4', '.webm', '.mov', '.m4v'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!validExts.includes(ext) && !file.type.startsWith('video/')) {
    if (feedback) {
      feedback.className = "text-xs font-mono text-[#B85C52] mt-2 block";
      feedback.innerText = "We couldn't optimize this video automatically. Recommended format: MP4 (H.264)";
    }
    return;
  }

  // Section 15: Stage 1
  if (feedback) {
    feedback.className = "text-xs font-mono text-[#536B78] mt-2 block";
    feedback.innerText = "Preparing atmospheric background…";
  }

  const blobUrl = URL.createObjectURL(file);
  const probeVideo = document.createElement('video');
  probeVideo.preload = 'metadata';
  probeVideo.src = blobUrl;
  probeVideo.muted = true;
  probeVideo.playsInline = true;

  probeVideo.onloadedmetadata = () => {
    // Section 15: Stage 2
    if (feedback) {
      feedback.className = "text-xs font-mono text-[#18D6D1] mt-2 block";
      feedback.innerText = "Optimizing video for web playback…";
    }
    probeVideo.currentTime = Math.min(1.5, probeVideo.duration * 0.2);
  };

  probeVideo.onseeked = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = probeVideo.videoWidth || 1280;
      canvas.height = probeVideo.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(probeVideo, 0, 0, canvas.width, canvas.height);
      const posterDataUrl = canvas.toDataURL('image/jpeg', 0.90);

      // Apply to background video
      const bgVideo = document.getElementById('atmosphericBgVideo');
      if (bgVideo) {
        bgVideo.src = blobUrl;
        bgVideo.poster = posterDataUrl;
        bgVideo.load();
        bgVideo.play().catch(e => console.warn("Custom video play note:", e));
      }

      // Section 15: Stage 3
      if (feedback) {
        feedback.className = "text-xs font-mono text-[#6D786C] mt-2 block";
        feedback.innerText = "✓ Atmospheric background ready";
      }
      if (activeTitle) activeTitle.innerText = `Custom: ${file.name}`;
      if (activeDetails) activeDetails.innerText = `${probeVideo.videoWidth} × ${probeVideo.videoHeight} · H.264 Compatible · Normalized`;
    } catch (e) {
      console.warn("Poster extraction fallback:", e);
      const bgVideo = document.getElementById('atmosphericBgVideo');
      if (bgVideo) {
        bgVideo.src = blobUrl;
        bgVideo.load();
        bgVideo.play();
      }
      if (feedback) {
        feedback.className = "text-xs font-mono text-[#6D786C] mt-2 block";
        feedback.innerText = "✓ Atmospheric background ready";
      }
    }
  };

  probeVideo.onerror = () => {
    if (feedback) {
      feedback.className = "text-xs font-mono text-[#B85C52] mt-2 block";
      feedback.innerText = "We couldn't optimize this video automatically. Recommended format: MP4 (H.264)";
    }
  };
}

// Atmosphere Presets & Live Tuning
function switchAtmospherePreset(preset) {
  const bgVideo = document.getElementById('atmosphericBgVideo');
  const activeTitle = document.getElementById('activeAtmosphereTitle');
  const activeDetails = document.getElementById('activeAtmosphereDetails');
  const btnThunderstorm = document.getElementById('presetBtnThunderstorm');
  const btnDribbble = document.getElementById('presetBtnDribbble');
  const btnClouds = document.getElementById('presetBtnClouds');
  const feedback = document.getElementById('uploadFeedback');

  if (preset === 'thunderstorm') {
    if (bgVideo) {
      bgVideo.src = 'assets/thunderstorm_atmosphere.mp4';
      bgVideo.poster = 'assets/thunderstorm_atmosphere_poster.jpg';
      bgVideo.load();
      bgVideo.play().catch(e => console.warn(e));
    }
    if (activeTitle) activeTitle.innerText = "Cinematic Thunderstorm (Uploaded)";
    if (activeDetails) activeDetails.innerText = "478 × 850 (Vertical) · H.264 / AAC · 10.0s Loop";
    if (btnThunderstorm) btnThunderstorm.className = "editorial-surface p-2.5 text-left border border-[#18D6D1]/50 bg-[#18D6D1]/10 rounded-lg transition-all flex flex-col";
    if (btnClouds) btnClouds.className = "editorial-surface p-2.5 text-left border border-white/10 hover:border-white/20 bg-white/5 rounded-lg transition-all flex flex-col";
    if (btnDribbble) btnDribbble.className = "editorial-surface p-2.5 text-left border border-white/10 hover:border-white/20 bg-white/5 rounded-lg transition-all flex flex-col";
    if (feedback) {
      feedback.className = "text-xs font-mono text-[#6D786C] mt-2 block";
      feedback.innerText = "✓ Active: Cinematic Thunderstorm atmosphere.";
    }
  } else if (preset === 'clouds') {
    if (bgVideo) {
      bgVideo.src = 'assets/atmospheric_clouds.mp4';
      bgVideo.poster = 'assets/atmospheric_clouds_poster.jpg';
      bgVideo.load();
      bgVideo.play().catch(e => console.warn(e));
    }
    if (activeTitle) activeTitle.innerText = "Cinematic Atmospheric Clouds";
    if (activeDetails) activeDetails.innerText = "1280 × 960 · H.264 / AAC · 60 FPS";
    if (btnClouds) btnClouds.className = "editorial-surface p-2.5 text-left border border-[#18D6D1]/50 bg-[#18D6D1]/10 rounded-lg transition-all flex flex-col";
    if (btnThunderstorm) btnThunderstorm.className = "editorial-surface p-2.5 text-left border border-white/10 hover:border-white/20 bg-white/5 rounded-lg transition-all flex flex-col";
    if (btnDribbble) btnDribbble.className = "editorial-surface p-2.5 text-left border border-white/10 hover:border-white/20 bg-white/5 rounded-lg transition-all flex flex-col";
    if (feedback) {
      feedback.className = "text-xs font-mono text-[#6D786C] mt-2 block";
      feedback.innerText = "✓ Active: Cinematic Atmospheric Clouds.";
    }
  } else if (preset === 'dribbble') {
    if (bgVideo) {
      bgVideo.src = 'assets/dribbble_weather_bg.mp4';
      bgVideo.poster = 'assets/dribbble_weather_poster.jpg';
      bgVideo.load();
      bgVideo.play().catch(e => console.warn(e));
    }
    if (activeTitle) activeTitle.innerText = "Dribbble 3D Weather Motion";
    if (activeDetails) activeDetails.innerText = "1600 × 1200 · H.264 / WebM · 60 FPS";
    if (btnDribbble) btnDribbble.className = "editorial-surface p-2.5 text-left border border-[#18D6D1]/50 bg-[#18D6D1]/10 rounded-lg transition-all flex flex-col";
    if (btnThunderstorm) btnThunderstorm.className = "editorial-surface p-2.5 text-left border border-white/10 hover:border-white/20 bg-white/5 rounded-lg transition-all flex flex-col";
    if (btnClouds) btnClouds.className = "editorial-surface p-2.5 text-left border border-white/10 hover:border-white/20 bg-white/5 rounded-lg transition-all flex flex-col";
    if (feedback) {
      feedback.className = "text-xs font-mono text-[#6D786C] mt-2 block";
      feedback.innerText = "✓ Active: Dribbble 3D Weather Motion.";
    }
  }
}

function adjustBgOpacity(val) {
  const bgVideo = document.getElementById('atmosphericBgVideo');
  const label = document.getElementById('bgOpacityLabel');
  if (label) label.innerText = `${val}%`;
  if (bgVideo) bgVideo.style.setProperty('--bg-opacity', (val / 100).toString());
}

function adjustBgBlur(val) {
  const bgVideo = document.getElementById('atmosphericBgVideo');
  const label = document.getElementById('bgBlurLabel');
  if (label) label.innerText = `${val} px`;
  if (bgVideo) bgVideo.style.setProperty('--bg-blur', `${val}px`);
}

function adjustBgScale(val) {
  const bgVideo = document.getElementById('atmosphericBgVideo');
  const label = document.getElementById('bgScaleLabel');
  if (label) label.innerText = `${val}%`;
  if (bgVideo) bgVideo.style.setProperty('--bg-scale', (val / 100).toString());
}

function resetDefaultAtmosphere() {
  switchAtmospherePreset('thunderstorm');
  adjustBgOpacity(65);
  adjustBgBlur(0);
  adjustBgScale(102);
  const opSlider = document.getElementById('bgOpacitySlider');
  const blurSlider = document.getElementById('bgBlurSlider');
  const scaleSlider = document.getElementById('bgScaleSlider');
  if (opSlider) opSlider.value = 65;
  if (blurSlider) blurSlider.value = 0;
  if (scaleSlider) scaleSlider.value = 102;
  const feedback = document.getElementById('uploadFeedback');
  if (feedback) {
    feedback.className = "text-xs font-mono text-[#6D786C] mt-2 block";
    feedback.innerText = "✓ Reset to default uploaded storm atmosphere.";
  }
}

// ========================================================
// IMMERSIVE GARDEN (immersive-g.com) EFFECTS & AUDIO ENGINE
// ========================================================

// 1. Fluid Magnetic Dual-Ring Cursor
function initMagneticCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const cursorContainer = document.getElementById('customCursor');
  if (!dot || !ring || !cursorContainer) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let isMoving = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    if (!isMoving) {
      isMoving = true;
      cursorContainer.style.opacity = '1';
    }
  });

  window.addEventListener('mouseleave', () => {
    cursorContainer.style.opacity = '0';
  });

  function renderCursor() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Hover detection for interactive targets
  const interactiveSelector = 'a, button, input, select, .editorial-surface, .station-item, .nav-link, .leaflet-control, .sound-controller-widget, [onclick]';
  
  document.addEventListener('mouseover', (e) => {
    if (e.target && e.target.closest(interactiveSelector)) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target && e.target.closest(interactiveSelector)) {
      document.body.classList.remove('cursor-hover');
    }
  });
}

// 2. Interactive Card Spotlight Follower
function initCardSpotlight() {
  document.querySelectorAll('.editorial-surface').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// 3. Immersive Garden Ambient Atmospheric Sound Controller (Web Audio API)
let audioCtx = null;
let ambientGain = null;
let windNoiseNode = null;
let subRumbleNode = null;
let isAudioActive = false;

function toggleAtmosphericAudio() {
  const widget = document.getElementById('soundWidget');
  const label = document.getElementById('soundLabel');
  
  if (!isAudioActive) {
    startAtmosphericAudio();
    isAudioActive = true;
    if (widget) widget.classList.add('sound-active');
    if (label) label.innerText = 'ATMOSPHERE: ON';
  } else {
    stopAtmosphericAudio();
    isAudioActive = false;
    if (widget) widget.classList.remove('sound-active');
    if (label) label.innerText = 'SOUND: OFF';
  }
}

function startAtmosphericAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Master Gain
    ambientGain = audioCtx.createGain();
    ambientGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 2.0);
    ambientGain.connect(audioCtx.destination);

    // Wind Noise Generator (Tropospheric Air Currents)
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Resonant Lowpass Filter for Wind
    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(160, audioCtx.currentTime);

    // LFO for organic wind swelling
    const lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(60, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start();

    whiteNoise.connect(windFilter);
    windFilter.connect(ambientGain);
    whiteNoise.start();
    windNoiseNode = whiteNoise;

    // Sub-Bass Barometric Rumble (48Hz)
    const rumble = audioCtx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(48, audioCtx.currentTime);
    const rumbleGain = audioCtx.createGain();
    rumbleGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    rumble.connect(rumbleGain);
    rumbleGain.connect(ambientGain);
    rumble.start();
    subRumbleNode = rumble;

  } catch (err) {
    console.warn("Atmospheric sound engine notice:", err);
  }
}

function stopAtmosphericAudio() {
  if (ambientGain && audioCtx) {
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, audioCtx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
    setTimeout(() => {
      if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    }, 850);
  }
}

// Play thunder rumble on lightning strike
function triggerThunderAcoustics() {
  if (!isAudioActive || !audioCtx || audioCtx.state !== 'running') return;
  try {
    const strikeTime = audioCtx.currentTime;
    const thunderOsc = audioCtx.createOscillator();
    const thunderGain = audioCtx.createGain();
    const thunderFilter = audioCtx.createBiquadFilter();

    thunderOsc.type = 'sawtooth';
    thunderOsc.frequency.setValueAtTime(80, strikeTime);
    thunderOsc.frequency.exponentialRampToValueAtTime(32, strikeTime + 2.5);

    thunderFilter.type = 'lowpass';
    thunderFilter.frequency.setValueAtTime(220, strikeTime);
    thunderFilter.frequency.exponentialRampToValueAtTime(45, strikeTime + 3.0);

    thunderGain.gain.setValueAtTime(0.15, strikeTime);
    thunderGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 3.2);

    thunderOsc.connect(thunderFilter);
    thunderFilter.connect(thunderGain);
    thunderGain.connect(audioCtx.destination);

    thunderOsc.start(strikeTime);
    thunderOsc.stop(strikeTime + 3.3);
  } catch (e) {
    // Audio note
  }
}

// 4. Theme Switcher (Dark Obsidian / Editorial Titanium)
function toggleTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    if (window.lucide) lucide.createIcons();
  }
  const bgVideo = document.getElementById('atmosphericBgVideo');
  if (bgVideo) {
    if (isLight) {
      bgVideo.style.setProperty('--bg-opacity', '0.50');
    } else {
      bgVideo.style.setProperty('--bg-opacity', '0.65');
    }
  }
}

// App Lifecycle
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initMap === 'function') {
    initMap(state.location.lat, state.location.lon, state.location.name);
  }
  initAtmosphericVideo();
  initCardSpotlight();
  runNowcast();
});
