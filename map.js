/**
 * SKYBOLT AI — Interactive Weather Map Engine (Windy-Grade Functionality)
 * Designed with editorial restraint and multi-layer meteorological telemetry.
 */

let mapInstance = null;
let currentBasemapLayer = null;
let currentBasemapType = 'standard'; // 'standard', 'terrain', 'satellite'
let weatherOverlayOpacity = 0.75;

// Layer Groups
let locationMarker = null;
let inspectorMarker = null;
let riskPolygonLayer = null;
let stormTrackGroup = null;
let stormCellGroup = null;
let lightningGroup = null;
let radarFieldGroup = null;
let satelliteFieldGroup = null;
let windStreamGroup = null;
let rainFieldGroup = null;

// Timeline Playback State (0m, 30m, 60m, 90m, 120m, 180m)
const TIMELINE_STEPS = [0, 30, 60, 90, 120, 180];
let currentTimelineStep = 0; // minutes
let timelinePlayTimer = null;
let isPlayingForecast = false;

// Layer Visibility State (Default: Risk + Storm Track + Location - Section 11)
const mapLayerState = {
  risk: true,
  track: true,
  location: true,
  cells: false,
  lightning: false,
  radar: false,
  satellite: false,
  wind: false,
  rain: false
};

// Basemap Tile Configurations (Clean, high-reliability, zero key required)
const BASEMAP_CONFIG = {
  standard: {
    name: 'Standard',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    className: 'standard-map-tiles',
    attribution: 'Map &copy; Google'
  },
  terrain: {
    name: 'Terrain',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    className: 'terrain-map-tiles',
    attribution: 'Map &copy; Google'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    className: '',
    attribution: 'Imagery &copy; Google'
  }
};

/**
 * Initialize Interactive Weather Map
 */
function initMap(lat = 19.0760, lon = 72.8777, locationName = "Mumbai, Maharashtra") {
  const container = document.getElementById('leafletMap');
  if (!container) return;

  if (mapInstance) {
    mapInstance.flyTo([lat, lon], 8, { duration: 1.0 });
    updateMapData(lat, lon, locationName);
    setTimeout(() => mapInstance.invalidateSize(), 200);
    return;
  }

  container.style.height = '100%';
  container.style.minHeight = '560px';

  mapInstance = L.map('leafletMap', {
    zoomControl: false,
    attributionControl: false,
    zoomAnimation: true,
    minZoom: 4,
    maxZoom: 18
  }).setView([lat, lon], 8);

  // Initialize Layer Groups
  stormTrackGroup = L.layerGroup().addTo(mapInstance);
  stormCellGroup = L.layerGroup();
  lightningGroup = L.layerGroup();
  radarFieldGroup = L.layerGroup();
  satelliteFieldGroup = L.layerGroup();
  windStreamGroup = L.layerGroup();
  rainFieldGroup = L.layerGroup();

  // Load default Standard Basemap
  setBasemap(currentBasemapType);

  // Map Click Inspector (Section 19: Click anywhere on map)
  mapInstance.on('click', function(e) {
    handleMapClickInspector(e.latlng.lat, e.latlng.lng);
  });

  // Zero Grey Tiles Resize Observer
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      if (mapInstance) mapInstance.invalidateSize();
    });
    ro.observe(container);
  }

  setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(); }, 150);
  setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(); }, 500);

  updateMapData(lat, lon, locationName);
}

/**
 * Switch Basemaps (Standard, Terrain, Satellite - Section 10)
 */
function setBasemap(type) {
  currentBasemapType = type;
  if (!mapInstance) return;

  const cfg = BASEMAP_CONFIG[type] || BASEMAP_CONFIG.standard;

  if (currentBasemapLayer) {
    mapInstance.removeLayer(currentBasemapLayer);
  }

  currentBasemapLayer = L.tileLayer(cfg.url, {
    maxZoom: cfg.maxZoom,
    subdomains: cfg.subdomains,
    className: cfg.className
  }).addTo(mapInstance);

  // Move basemap behind overlays
  currentBasemapLayer.bringToBack();

  // Update Basemap Selector UI
  ['standard', 'terrain', 'satellite'].forEach(t => {
    const btn = document.getElementById(`btn-map-${t}`);
    if (btn) {
      if (t === type) {
        btn.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-[#18D6D1]/20 text-[#18D6D1] border border-[#18D6D1]/50 shadow-sm transition-all";
      } else {
        btn.className = "px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-[#F7F6F2] bg-white/5 hover:bg-white/10 border border-white/10 transition-all";
      }
    }
  });

  mapInstance.invalidateSize();
}

/**
 * Toggle Weather Layer Visibility (Section 11)
 */
function toggleLayer(layerKey) {
  mapLayerState[layerKey] = !mapLayerState[layerKey];
  const isVisible = mapLayerState[layerKey];

  // Update UI Pill/Button
  const btn = document.getElementById(`btn-layer-${layerKey}`);
  if (btn) {
    if (isVisible) {
      btn.className = "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#18D6D1]/20 text-[#18D6D1] border border-[#18D6D1]/50 transition-all flex items-center space-x-1.5";
    } else {
      btn.className = "px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 text-slate-400 border border-white/10 hover:text-[#F7F6F2] transition-all flex items-center space-x-1.5";
    }
  }

  // Update Layer Group in Leaflet
  if (layerKey === 'risk' && riskPolygonLayer) {
    isVisible ? mapInstance.addLayer(riskPolygonLayer) : mapInstance.removeLayer(riskPolygonLayer);
  } else if (layerKey === 'track' && stormTrackGroup) {
    isVisible ? mapInstance.addLayer(stormTrackGroup) : mapInstance.removeLayer(stormTrackGroup);
  } else if (layerKey === 'cells' && stormCellGroup) {
    isVisible ? mapInstance.addLayer(stormCellGroup) : mapInstance.removeLayer(stormCellGroup);
  } else if (layerKey === 'lightning' && lightningGroup) {
    isVisible ? mapInstance.addLayer(lightningGroup) : mapInstance.removeLayer(lightningGroup);
  } else if (layerKey === 'radar' && radarFieldGroup) {
    isVisible ? mapInstance.addLayer(radarFieldGroup) : mapInstance.removeLayer(radarFieldGroup);
  } else if (layerKey === 'satellite' && satelliteFieldGroup) {
    isVisible ? mapInstance.addLayer(satelliteFieldGroup) : mapInstance.removeLayer(satelliteFieldGroup);
  } else if (layerKey === 'wind' && windStreamGroup) {
    isVisible ? mapInstance.addLayer(windStreamGroup) : mapInstance.removeLayer(windStreamGroup);
  } else if (layerKey === 'rain' && rainFieldGroup) {
    isVisible ? mapInstance.addLayer(rainFieldGroup) : mapInstance.removeLayer(rainFieldGroup);
  } else if (layerKey === 'location' && locationMarker) {
    isVisible ? mapInstance.addLayer(locationMarker) : mapInstance.removeLayer(locationMarker);
  }

  updateMapLegend();
}

/**
 * Adjust Weather Overlay Opacity Slider (Section 15)
 */
function setWeatherOverlayOpacity(val) {
  weatherOverlayOpacity = parseFloat(val);
  const opacityValEl = document.getElementById('opacityValueDisplay');
  if (opacityValEl) {
    opacityValEl.innerText = `${Math.round(weatherOverlayOpacity * 100)}%`;
  }

  if (mapInstance && window.state) {
    updateMapData(window.state.location.lat, window.state.location.lon, window.state.location.name);
  }
}

/**
 * Handle Map Click to Mark Location & Instantly Predict (Live Prediction for Marked Point)
 */
function handleMapClickInspector(lat, lon) {
  if (!mapInstance) return;

  const clickLat = parseFloat(lat.toFixed(4));
  const clickLon = parseFloat(lon.toFixed(4));

  if (inspectorMarker) {
    mapInstance.removeLayer(inspectorMarker);
    inspectorMarker = null;
  }

  // Update marked location in global state
  if (window.state) {
    window.state.location.lat = clickLat;
    window.state.location.lon = clickLon;
    window.state.location.name = `Marked Location (${clickLat}° N, ${clickLon}° E)`;
  }

  // Instantly trigger live prediction and telemetry sync for this exact marked coordinate
  if (window.fetchCustomLocationWeather) {
    window.fetchCustomLocationWeather(clickLat, clickLon, `Marked Location (${clickLat}° N, ${clickLon}° E)`);
  } else if (window.runNowcast) {
    window.runNowcast();
  }

  // Immediately render updated location pin at the marked coordinates
  updateMapData(clickLat, clickLon, `Marked Location (${clickLat}° N, ${clickLon}° E)`);
}

function applyInspectedLocation(lat, lon) {
  handleMapClickInspector(lat, lon);
}

/**
 * Re-render All Weather Layers on State or Timeline Update
 */
function updateMapData(lat, lon, locationName = "Observation Point") {
  if (!mapInstance) return;

  const currentRisk = (window.state && window.state.risk) ? window.state.risk.riskLevel : 'MODERATE';
  const prob = (window.state && window.state.risk) ? window.state.risk.probability : 68;
  const currentAccuracy = (window.state && window.state.risk) ? window.state.risk.accuracy : 89;
  const errorMargin = (window.state && window.state.risk) ? window.state.risk.errorMargin : 7.2;
  const radarDbz = (window.state && window.state.inputs) ? window.state.inputs.radar : 41;
  const windDir = (window.state && window.state.inputs) ? window.state.inputs.wind_direction : 240;
  const stormMotion = (window.state && window.state.inputs) ? window.state.inputs.storm_motion : 28;

  // Timeline Advection Offset (advancing storm with timeline step)
  const trackRad = (windDir * Math.PI) / 180;
  const timeProgress = currentTimelineStep / 180; // 0.0 to 1.0
  const advectionDistance = timeProgress * 0.72; // degrees offset
  const currentCellLat = lat + Math.cos(trackRad) * advectionDistance;
  const currentCellLon = lon + Math.sin(trackRad) * advectionDistance;

  // 1. Observation / Marked Location Marker (Draggable)
  if (locationMarker) mapInstance.removeLayer(locationMarker);

  const pinIcon = L.divIcon({
    className: 'custom-location-pin',
    html: `
      <div class="location-pin-pulse">
        <div class="w-4 h-4 rounded-full bg-[#18D6D1] border-2 border-[#0B0D0F] shadow-md flex items-center justify-center cursor-grab">
          <div class="w-1.5 h-1.5 rounded-full bg-[#0B0D0F]"></div>
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  locationMarker = L.marker([lat, lon], { icon: pinIcon, draggable: true, zIndexOffset: 1000 });

  // Re-predict immediately when marker is dragged and dropped
  locationMarker.on('dragend', function(e) {
    const pos = e.target.getLatLng();
    handleMapClickInspector(pos.lat, pos.lng);
  });

  const riskColor = currentRisk === 'SEVERE' ? '#8F3F3A' : currentRisk === 'MODERATE' ? '#C8943D' : '#6D786C';

  locationMarker.bindPopup(`
    <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 175px;">
      <div style="font-size: 13px; font-weight: 700; color: #F7F6F2;">📍 ${locationName}</div>
      <div style="font-size: 11px; font-family: monospace; color: #18D6D1; margin-bottom: 4px;">Marked Lat: ${lat.toFixed(4)}° N, Lon: ${lon.toFixed(4)}° E</div>
      <div style="font-size: 11px; font-weight: 600; color: ${riskColor}; margin-bottom: 2px;">
        Thunderstorm Risk: ${currentRisk} (${prob}%)
      </div>
      <div style="font-size: 11px; color: #94948E; margin-bottom: 4px;">
        Prediction Accuracy: <strong style="color: #F7F6F2;">${currentAccuracy}%</strong> (±${errorMargin}% variance)
      </div>
      <div style="font-size: 10px; color: #6C6C67; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 3px;">
        Drag pin or click map to change marked position
      </div>
    </div>
  `);

  if (mapLayerState.location) {
    locationMarker.addTo(mapInstance);
  }

  const coordDisplay = document.getElementById('mapCoordsDisplay');
  if (coordDisplay) {
    coordDisplay.innerText = `Marked Lat: ${lat.toFixed(4)}° N, Lon: ${lon.toFixed(4)}° E · Accuracy: ${currentAccuracy}%`;
  }

  // 2. Storm Risk Zone Polygon (Soft Contours - Section 12)
  if (riskPolygonLayer) mapInstance.removeLayer(riskPolygonLayer);

  const baseRiskOpacity = currentRisk === 'SEVERE' ? 0.32 : currentRisk === 'MODERATE' ? 0.22 : 0.12;

  const riskOffsets = [
    [0.18, -0.15],
    [0.26, 0.22],
    [0.06, 0.38],
    [-0.18, 0.26],
    [-0.24, -0.08],
    [-0.08, -0.28]
  ];
  const riskPolygonPoints = riskOffsets.map(([dLat, dLon]) => [currentCellLat + dLat, currentCellLon + dLon]);

  riskPolygonLayer = L.polygon(riskPolygonPoints, {
    color: riskColor,
    weight: 1.5,
    dashArray: '4, 4',
    fillColor: riskColor,
    fillOpacity: baseRiskOpacity * weatherOverlayOpacity
  });

  riskPolygonLayer.bindPopup(`
    <div style="font-family: Inter, sans-serif; padding: 3px;">
      <strong style="color: #F7F6F2; font-size: 12px;">Active Thunderstorm Risk Zone</strong><br/>
      <span style="color: ${riskColor}; font-weight: 700;">${currentRisk} (${prob}%)</span><br/>
      <span style="font-size: 11px; color: #94948E;">Timeline: +${currentTimelineStep} min forecast</span>
    </div>
  `);

  if (mapLayerState.risk) {
    riskPolygonLayer.addTo(mapInstance);
  }

  // 3. Thunderstorm Cells Layer (Section 13)
  stormCellGroup.clearLayers();

  const coreCircle = L.circle([currentCellLat, currentCellLon], {
    radius: 9500,
    color: '#8F3F3A',
    fillColor: '#8F3F3A',
    fillOpacity: 0.35 * weatherOverlayOpacity,
    weight: 1.5
  });
  coreCircle.bindPopup(`
    <div style="font-family: Inter, sans-serif; font-size: 12px; color: #F7F6F2;">
      <strong style="color: #8F3F3A;">Convective Storm Core</strong><br/>
      Peak Reflectivity: <strong>${radarDbz} dBZ</strong><br/>
      Advection: ${stormMotion} km/h @ ${windDir}°<br/>
      Development: Actively developing updraft
    </div>
  `);
  stormCellGroup.addLayer(coreCircle);

  // Concentric Cell Rings (15km, 30km, 45km)
  const ring1 = L.circle([currentCellLat, currentCellLon], { radius: 15000, color: '#B85C52', fillColor: '#B85C52', fillOpacity: 0.12 * weatherOverlayOpacity, weight: 1 });
  const ring2 = L.circle([currentCellLat, currentCellLon], { radius: 30000, color: '#C8943D', fillColor: '#C8943D', fillOpacity: 0.08 * weatherOverlayOpacity, weight: 0.8 });
  stormCellGroup.addLayer(ring1);
  stormCellGroup.addLayer(ring2);

  if (mapLayerState.cells) {
    mapInstance.addLayer(stormCellGroup);
  }

  // 4. Storm Track: 0 to 180 Min Path with Uncertainty Cone (Section 17)
  stormTrackGroup.clearLayers();

  const waypoints = [
    { label: 'Now', time: 0, lat: lat, lon: lon },
    { label: '+30m', time: 30, lat: lat + Math.cos(trackRad) * 0.15, lon: lon + Math.sin(trackRad) * 0.15 },
    { label: '+60m', time: 60, lat: lat + Math.cos(trackRad) * 0.30, lon: lon + Math.sin(trackRad) * 0.30 },
    { label: '+90m', time: 90, lat: lat + Math.cos(trackRad) * 0.44, lon: lon + Math.sin(trackRad) * 0.44 },
    { label: '+120m', time: 120, lat: lat + Math.cos(trackRad) * 0.58, lon: lon + Math.sin(trackRad) * 0.58 },
    { label: '+180m', time: 180, lat: lat + Math.cos(trackRad) * 0.84, lon: lon + Math.sin(trackRad) * 0.84 }
  ];

  const trackLine = L.polyline(waypoints.map(w => [w.lat, w.lon]), {
    color: '#C8943D',
    weight: 2.2,
    dashArray: '6, 4',
    opacity: 0.95
  });
  stormTrackGroup.addLayer(trackLine);

  // Uncertainty Cone
  const endPoint = waypoints[5];
  const conePolygon = L.polygon([
    [lat, lon],
    [endPoint.lat + 0.12, endPoint.lon + 0.12],
    [endPoint.lat - 0.12, endPoint.lon - 0.12]
  ], {
    color: '#C8943D',
    fillColor: '#C8943D',
    fillOpacity: 0.08 * weatherOverlayOpacity,
    weight: 1.0
  });
  stormTrackGroup.addLayer(conePolygon);

  // Waypoint milestone badges
  waypoints.forEach((wp, idx) => {
    if (idx === 0) return;
    const isCurrentActive = wp.time === currentTimelineStep;
    const wpIcon = L.divIcon({
      className: 'track-wp-pin',
      html: `
        <div class="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${isCurrentActive ? 'bg-[#18D6D1] text-[#0B0D0F]' : 'bg-[#101316] text-[#F7F6F2] border border-white/20'} shadow-sm">
          ${wp.label}
        </div>
      `,
      iconSize: [36, 16],
      iconAnchor: [18, 8]
    });
    const wpMarker = L.marker([wp.lat, wp.lon], { icon: wpIcon });
    wpMarker.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 11px; color: #F7F6F2;">
        <strong>Trajectory Forecast: ${wp.label}</strong><br/>
        Estimated arrival at +${wp.time} min<br/>
        Ensemble confidence: ${Math.max(94 - idx * 10, 48)}%
      </div>
    `);
    stormTrackGroup.addLayer(wpMarker);
  });

  if (mapLayerState.track) {
    mapInstance.addLayer(stormTrackGroup);
  }

  // 5. Lightning Activity Layer (Section 14)
  lightningGroup.clearLayers();
  const strikeCount = currentRisk === 'SEVERE' ? 9 : (currentRisk === 'MODERATE' ? 5 : 1);

  const strikeOffsets = [
    [0.08, 0.07], [-0.05, 0.11], [0.12, -0.06], [-0.09, -0.08],
    [0.04, 0.16], [-0.14, 0.05], [0.18, 0.09], [-0.02, -0.15], [0.06, -0.12]
  ];

  for (let i = 0; i < strikeCount; i++) {
    const [dLat, dLon] = strikeOffsets[i];
    const sLat = currentCellLat + dLat;
    const sLon = currentCellLon + dLon;

    const sIcon = L.divIcon({
      className: 'lightning-marker',
      html: `
        <div class="lightning-strike-pulse w-4 h-4 rounded-full bg-amber-500/20 border border-amber-600 flex items-center justify-center shadow-sm">
          <span style="font-size: 9px; line-height: 1;">⚡</span>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([sLat, sLon], { icon: sIcon });
    marker.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 11px; color: #F7F6F2;">
        <strong style="color: #C8943D;">Lightning Strike Cluster</strong><br/>
        Polarity: Negative CG (-24 kA)<br/>
        Frequency: High flash density
      </div>
    `);
    lightningGroup.addLayer(marker);
  }

  if (mapLayerState.lightning) {
    mapInstance.addLayer(lightningGroup);
  }

  // 6. Radar Reflectivity Field (Section 15)
  radarFieldGroup.clearLayers();
  const radarRadii = [35000, 24000, 14000, 6000];
  const radarColors = ['#536B78', '#6D786C', '#C8943D', '#8F3F3A'];
  const radarLabels = ['20 dBZ (Light)', '32 dBZ (Moderate)', '44 dBZ (Heavy)', '54 dBZ (Severe Core)'];

  radarRadii.forEach((r, idx) => {
    const circ = L.circle([currentCellLat, currentCellLon], {
      radius: r,
      color: radarColors[idx],
      fillColor: radarColors[idx],
      fillOpacity: (0.16 + idx * 0.08) * weatherOverlayOpacity,
      weight: 1
    });
    circ.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 11px; color: #F7F6F2;">
        <strong>Doppler Radar Reflectivity</strong><br/>
        ${radarLabels[idx]}
      </div>
    `);
    radarFieldGroup.addLayer(circ);
  });

  if (mapLayerState.radar) {
    mapInstance.addLayer(radarFieldGroup);
  }

  // 7. Satellite Infrared Cooling Field (Section 16)
  satelliteFieldGroup.clearLayers();
  const satCirc = L.circle([currentCellLat, currentCellLon], {
    radius: 42000,
    color: '#536B78',
    fillColor: '#536B78',
    fillOpacity: 0.18 * weatherOverlayOpacity,
    dashArray: '3, 6',
    weight: 1.5
  });
  satCirc.bindPopup(`
    <div style="font-family: Inter, sans-serif; font-size: 11px; color: #F7F6F2;">
      <strong>Geostationary IR Cloud Field</strong><br/>
      Brightness Temp: -58°C<br/>
      Vertical Cooling: Rapid convective expansion
    </div>
  `);
  satelliteFieldGroup.addLayer(satCirc);

  if (mapLayerState.satellite) {
    mapInstance.addLayer(satelliteFieldGroup);
  }

  // 8. Wind Streamlines Field
  windStreamGroup.clearLayers();
  const windOffsets = [
    [-0.2, -0.2], [-0.1, -0.1], [0.1, 0.1], [0.2, 0.2],
    [-0.2, 0.1], [0.1, -0.2], [-0.1, 0.2], [0.2, -0.1]
  ];
  windOffsets.forEach(([wLat, wLon]) => {
    const p1 = [lat + wLat, lon + wLon];
    const p2 = [p1[0] + Math.cos(trackRad) * 0.08, p1[1] + Math.sin(trackRad) * 0.08];
    const wLine = L.polyline([p1, p2], {
      color: '#536B78',
      weight: 1.5,
      opacity: 0.65 * weatherOverlayOpacity,
      className: 'wind-particle'
    });
    windStreamGroup.addLayer(wLine);
  });

  if (mapLayerState.wind) {
    mapInstance.addLayer(windStreamGroup);
  }

  // 9. Rain Rate Field
  rainFieldGroup.clearLayers();
  const rainCirc = L.circle([currentCellLat, currentCellLon], {
    radius: 20000,
    color: '#536B78',
    fillColor: '#536B78',
    fillOpacity: 0.24 * weatherOverlayOpacity,
    weight: 1.2
  });
  rainCirc.bindPopup(`
    <div style="font-family: Inter, sans-serif; font-size: 11px; color: #F7F6F2;">
      <strong>Precipitation Rate</strong><br/>
      Instantaneous Rate: 4.2 mm/h<br/>
      Accumulation (1h): ~8.4 mm
    </div>
  `);
  rainFieldGroup.addLayer(rainCirc);

  if (mapLayerState.rain) {
    mapInstance.addLayer(rainFieldGroup);
  }

  updateMapLegend();
}

/**
 * Dynamic Legend Controller (Section 23)
 */
function updateMapLegend() {
  const currentRisk = (window.state && window.state.risk) ? window.state.risk.riskLevel : 'MODERATE';
  const legendTitle = document.getElementById('legendTitle');
  const legendBody = document.getElementById('legendBody');
  if (!legendTitle || !legendBody) return;

  // Determine active visual focus
  if (mapLayerState.radar) {
    legendTitle.innerText = "Radar Reflectivity (dBZ)";
    legendBody.innerHTML = `
      <div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded bg-[#536B78]"></span><span>15–30 dBZ (Light Rain)</span></div>
      <div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded bg-[#6D786C]"></span><span>30–42 dBZ (Moderate)</span></div>
      <div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded bg-[#C8943D]"></span><span>42–50 dBZ (Heavy Rain)</span></div>
      <div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded bg-[#8F3F3A]"></span><span>50+ dBZ (Severe Core / Hail)</span></div>
    `;
  } else if (mapLayerState.lightning) {
    legendTitle.innerText = "Lightning Activity (Strikes/10m)";
    legendBody.innerHTML = `
      <div class="flex items-center space-x-2"><span class="text-[#C8943D]">⚡</span><span>1–3 (Low density)</span></div>
      <div class="flex items-center space-x-2"><span class="text-[#B85C52]">⚡⚡</span><span>4–8 (Moderate flash rate)</span></div>
      <div class="flex items-center space-x-2"><span class="text-[#8F3F3A]">⚡⚡⚡</span><span>9+ (Severe electrical surge)</span></div>
    `;
  } else if (mapLayerState.wind) {
    legendTitle.innerText = "Wind Field & Direction";
    legendBody.innerHTML = `
      <div class="flex items-center space-x-2"><span class="w-3 h-0.5 bg-[#536B78]"></span><span>Streamline direction</span></div>
      <div class="flex items-center space-x-2"><span class="w-2 h-2 rounded-full bg-[#536B78]"></span><span>Velocity: ~18 km/h</span></div>
    `;
  } else {
    legendTitle.innerText = "Thunderstorm Risk (0–3h)";
    legendBody.innerHTML = `
      <div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded-full bg-[#6D786C]"></span><span>Low Risk (< 40%)</span></div>
      <div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded-full bg-[#C8943D]"></span><span>Moderate Risk (40–74%)</span></div>
      <div class="flex items-center space-x-2"><span class="w-2.5 h-2.5 rounded-full bg-[#8F3F3A]"></span><span>High / Severe (75%+)</span></div>
      <div class="flex items-center space-x-2"><span class="w-3 h-0.5 bg-[#C8943D] border-b border-dashed"></span><span>Predicted Motion Track</span></div>
    `;
  }
}

/**
 * Reset Map View to User Center
 */
function resetMapView() {
  if (!mapInstance || !window.state) return;
  mapInstance.flyTo([window.state.location.lat, window.state.location.lon], 8, { duration: 0.8 });
}

/**
 * Forecast Timeline Slider & Automated Playback (Sections 17 & 18)
 */
function setTimelineStep(stepMinutes) {
  currentTimelineStep = parseInt(stepMinutes);
  
  // Update timeline slider element if present
  const slider = document.getElementById('forecastTimelineSlider');
  if (slider && parseInt(slider.value) !== currentTimelineStep) {
    slider.value = currentTimelineStep;
  }

  // Update text label
  const stepLabel = document.getElementById('timelineStepLabel');
  if (stepLabel) {
    stepLabel.innerText = currentTimelineStep === 0 ? "NOW" : `+${currentTimelineStep} min`;
  }

  // Highlight active milestone button
  TIMELINE_STEPS.forEach(st => {
    const btn = document.getElementById(`btn-timeline-${st}`);
    if (btn) {
      if (st === currentTimelineStep) {
        btn.className = "px-2.5 py-1 rounded text-xs font-bold bg-[#18D6D1] text-[#0B0D0F] transition-all";
      } else {
        btn.className = "px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-[#F7F6F2] bg-white/5 hover:bg-white/10 border border-white/10 transition-all";
      }
    }
  });

  // Re-render map with advection
  if (window.state) {
    updateMapData(window.state.location.lat, window.state.location.lon, window.state.location.name);
  }
}

function toggleForecastPlayback() {
  if (isPlayingForecast) {
    pauseForecast();
  } else {
    playForecast();
  }
}

function playForecast() {
  isPlayingForecast = true;
  const playBtn = document.getElementById('btnPlayForecast');
  if (playBtn) {
    playBtn.innerHTML = '<i data-lucide="pause" class="w-3.5 h-3.5"></i><span>Pause</span>';
    if (window.lucide) window.lucide.createIcons();
  }

  if (timelinePlayTimer) clearInterval(timelinePlayTimer);

  timelinePlayTimer = setInterval(() => {
    let nextIdx = TIMELINE_STEPS.indexOf(currentTimelineStep) + 1;
    if (nextIdx >= TIMELINE_STEPS.length) {
      nextIdx = 0; // loop back to Now
    }
    setTimelineStep(TIMELINE_STEPS[nextIdx]);
  }, 1600);
}

function pauseForecast() {
  isPlayingForecast = false;
  if (timelinePlayTimer) {
    clearInterval(timelinePlayTimer);
    timelinePlayTimer = null;
  }
  const playBtn = document.getElementById('btnPlayForecast');
  if (playBtn) {
    playBtn.innerHTML = '<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Play</span>';
    if (window.lucide) window.lucide.createIcons();
  }
}

function resetForecast() {
  pauseForecast();
  setTimelineStep(0);
}
