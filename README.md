# SkyBolt AI — Thunderstorm Nowcasting System

> **Developed for Smart India Hackathon (SIH) by Team AGORA**

SkyBolt AI is an AI-powered atmospheric monitoring and severe weather nowcasting system. It processes 23 meteorological and Doppler radar parameters to predict thunderstorm likelihood in the immediate **0 to 30-minute** window with **92.27% accuracy**.

---

## ⚡ Key Features

1. **23-Feature Random Forest Inference Engine**
   - Incorporates thermodynamic instability (CAPE, Lifted Index), Doppler radar reflectivity (dBZ), lightning strikes, satellite cloud-top temperatures, and temporal delta rates.
2. **Interactive Doppler Radar Map**
   - Real-time dark Leaflet geospatial radar sweep, convective cell markers, and lightning strike hotspots.
3. **Model Performance & Explainability**
   - Interactive Confusion Matrix (636 TN, 19 FP, 58 FN, 283 TP).
   - Ranked Feature Importance chart.
   - Transparent mathematical formulas for all atmospheric deltas and ensemble probabilities.
4. **Live Weather Integration**
   - Connects to Open-Meteo live satellite feeds to populate current conditions for major Indian cities.
5. **SkyBolt AI Weather Copilot**
   - Context-aware conversational assistant explaining meteorological dynamics and safety recommendations.

---

## 🚀 Running Locally

```bash
npm install
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.
