/**
 * SkyBolt AI - Weather & Nowcasting Copilot Knowledge Engine v2
 * Comprehensive knowledge base on SIH26072, 4-Stream Ingestion, ConvLSTM + Transformer, and Sector Protocols
 */

const COPILOT_KNOWLEDGE = {
  streams: "SkyBolt AI fuses 4 official data streams: 1) IMD Doppler Weather Radar (reflectivity dBZ & radial storm movement); 2) INSAT-3D/3DR via ISRO MOSDAC (cloud growth, IR brightness & cloud-top cooling); 3) Lightning Observation Network via IITM/Damini (flash density & electrical trends); 4) NWP / Model data (convective instability, CAPE, Lifted Index, and moisture context).",
  architecture: "The deep learning core combines ConvLSTM with a Spatiotemporal Transformer. ConvLSTM captures rapid localized convective cell growth and cloud vertical development from radar echo sequences, while the Transformer models synoptic atmospheric shear and environmental dependencies over a 0–3 hour horizon.",
  radar: "In Doppler radar nowcasting, reflectivity above 40 dBZ indicates intense convective cores with heavy precipitation and hail potential. Reflectivity above 48 dBZ signals severe supercells with violent vertical updrafts.",
  cape: "CAPE (Convective Available Potential Energy) measures positive buoyant energy. Values between 1,000–2,500 J/kg represent moderate-to-severe atmospheric instability, providing the thermodynamic fuel for violent updrafts.",
  lifted_index: "Lifted Index (LI) measures the temperature differential of an air parcel lifted to 500 hPa. An LI of -4 or lower indicates strong convective instability, while values below -6 indicate extreme severe thunderstorm potential.",
  aviation: "Under an ORANGE or RED alert, aviation ground handling and apron refueling must be halted immediately. Flights are placed on 25-45 minute holding patterns or diverted due to windshear and lightning strike hazards.",
  disaster: "For Disaster Management (NDMA/SDMA), SkyBolt AI triggers automated CAP alerts to mobilize high-capacity dewatering pumps in low-lying urban areas and alerts State Disaster Response Forces (SDRF).",
  agriculture: "For rural communities and farmers, localized SMS and sirens alert agricultural workers to evacuate open fields, secure livestock under grounded shelter, and prepare hail nets for sensitive crops.",
  sih: "SkyBolt AI is built by Team AGORA for Smart India Hackathon (Problem Statement SIH26072, Theme: Disaster Management). It achieves 92.27% accuracy on tested observation timeframes with an end-to-end latency under 3.8 seconds."
};

function handleChatSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  addChatMessage("user", text);
  input.value = "";

  setTimeout(() => {
    const response = generateCopilotResponse(text);
    addChatMessage("assistant", response);
  }, 350);
}

function sendQuickPrompt(promptText) {
  const container = document.getElementById('copilotExpanded');
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
  }
  addChatMessage("user", promptText);
  setTimeout(() => {
    const response = generateCopilotResponse(promptText);
    addChatMessage("assistant", response);
  }, 350);
}

function generateCopilotResponse(query) {
  const q = query.toLowerCase();

  const cape = document.getElementById('inp_cape').value;
  const radar = document.getElementById('inp_radar').value;
  const li = document.getElementById('inp_lifted_index').value;
  const prob = document.getElementById('resProbability').innerText;
  const risk = document.getElementById('resRiskBadge').innerText;
  const alertLevel = document.getElementById('resAlertBadge').innerText;

  if (q.includes("stream") || q.includes("4 data") || q.includes("source") || q.includes("insat")) {
    return `${COPILOT_KNOWLEDGE.streams}`;
  }
  if (q.includes("convlstm") || q.includes("transformer") || q.includes("architecture") || q.includes("model")) {
    return `${COPILOT_KNOWLEDGE.architecture}`;
  }
  if (q.includes("aviation") || q.includes("airport") || q.includes("flight") || q.includes("runway")) {
    return `Currently under ${alertLevel}: ${COPILOT_KNOWLEDGE.aviation}`;
  }
  if (q.includes("disaster") || q.includes("ndma") || q.includes("sdma") || q.includes("pump")) {
    return `${COPILOT_KNOWLEDGE.disaster}`;
  }
  if (q.includes("farmer") || q.includes("agriculture") || q.includes("crop") || q.includes("cattle")) {
    return `${COPILOT_KNOWLEDGE.agriculture}`;
  }
  if (q.includes("radar") || q.includes("dbz") || q.includes("reflectivity")) {
    return `Current radar reflectivity is set to ${radar} dBZ. ${COPILOT_KNOWLEDGE.radar}`;
  }
  if (q.includes("cape") || q.includes("energy")) {
    return `Current CAPE is ${cape} J/kg. ${COPILOT_KNOWLEDGE.cape}`;
  }
  if (q.includes("lifted index") || q.includes("li")) {
    return `Current Lifted Index is ${li}. ${COPILOT_KNOWLEDGE.lifted_index}`;
  }
  if (q.includes("sih") || q.includes("agora") || q.includes("hackathon") || q.includes("problem statement")) {
    return `${COPILOT_KNOWLEDGE.sih}`;
  }

  return `Currently monitoring station conditions: Probability is ${prob} (${risk}, ${alertLevel}). CAPE is at ${cape} J/kg, Radar Reflectivity is ${radar} dBZ, and Lifted Index is ${li}. Let me know if you would like me to analyze specific atmospheric parameters or sector early warnings!`;
}

function addChatMessage(sender, message) {
  const container = document.getElementById('copilotExpanded');
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
  }

  const messagesDiv = document.getElementById('chatMessages');
  const msgEl = document.createElement('div');

  if (sender === "user") {
    msgEl.className = "p-2.5 rounded-xl bg-purple-900/40 border border-purple-800/40 text-slate-100 text-right";
    msgEl.innerHTML = `<span class="text-purple-300 font-semibold">You:</span> ${escapeHtml(message)}`;
  } else {
    msgEl.className = "p-3 rounded-xl bg-brand-deep border border-white/10 text-slate-200 leading-relaxed shadow";
    msgEl.innerHTML = `<strong class="text-cyan-400 block mb-1">⚡ SkyBolt AI Assistant:</strong> ${message}`;
  }

  messagesDiv.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

function clearChat() {
  const messagesDiv = document.getElementById('chatMessages');
  messagesDiv.innerHTML = `
    <div class="p-2.5 rounded-xl bg-brand-deep/80 border border-white/5 text-slate-300">
      <strong class="text-purple-400">SkyBolt AI:</strong> Chat history cleared. Inquire about the 4 data streams, ConvLSTM + Transformer architecture, or sector action protocols!
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
