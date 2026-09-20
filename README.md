# SwastyaConnect — AI-Powered Personal Health Companion & Disaster-Resilient Risk Engine

> **Important:** The project name is strictly **`SwastyaConnect`**.

**SwastyaConnect** is a secure, privacy-preserving, edge-intelligent Personal Health Companion designed to work with existing wearable hardware (Heart Rate, Blood Oxygen / SpO₂, Skin Temperature, and Galvanic Skin Response / GSR) alongside ambient environmental intelligence (Indian heatwaves, urban air pollution / AQI smog, cyclones, floods).

---

## 🌟 Key Features

1. **Hardware Telemetry Integration**:
   - Primary physiological sensors: Heart Rate (HR), Blood Oxygen (SpO₂), Skin Temperature, and Galvanic Skin Response (GSR).
   - Signal preprocessing: Outlier filtering, Hampel smoothing, and Signal Quality Index (SQI) monitoring.
   - Extensible BLE-ready data provider architecture.

2. **Personal Baseline Engine ("Your Normal")**:
   - Calculates personalized dynamic physiological baseline ranges rather than crude static thresholds.
   - Computes percentage and standard-deviation shifts (e.g. HR +45% above personal baseline).
   - Continual asymptotic confidence learning from resting windows.

3. **Context-Aware Multi-Sensor Risk Engines (0–100)**:
   - 🔥 **Heat Stress Risk Engine**: Fuses skin temperature elevation, thermal tachycardia, GSR sweating conductance, and ambient Heat Index.
   - 🫁 **Respiratory Risk Engine**: Fuses SpO₂ desaturation, compensatory tachycardia, and ambient AQI / PM2.5 levels.
   - ❤️ **Cardiovascular Stress Engine**: Evaluates relative heart rate deviations, thermal load coupling, and hypoxic cardiac workload.
   - 😴 **Fatigue Risk Engine**: Tracks resting cardiac drift, sympathetic electrodermal conductance, and thermal load.
   - 🛡 **Composite Overall Risk**: Contextually weighted dominant stress assessment with environmental disaster boosting.

4. **Disaster Intelligence & Indian Meteorological Profiles**:
   - Severe Heat Waves (North / Central India: Rajasthan, Nagpur).
   - Severe Urban Smog / Stubble Burning Crisis (Delhi-NCR).
   - Coastal Tropical Cyclones (Odisha / Andhra Pradesh).
   - Monsoon Urban Floods (Mumbai / Assam).
   - Offline environmental caching for zero-connectivity scenarios.

5. **Explainable AI & Actionable Triage**:
   - Transparent "Why is my risk evaluated as...?" breakdown showing exact contributing factors and percentage weights.
   - Cautious, non-diagnostic wellness and triage safety guidance.

6. **False-Positive Reduced Alert Escalation & Emergency SOS**:
   - State machine: `NORMAL` → `ANOMALY` → `MODERATE` → `HIGH` → `USER_CONFIRMATION` (30s countdown) → `SOS_TRIGGERED`.
   - Rejects single-sample noisy spikes; requires persistent consecutive windows.
   - Emergency contact manager, designated caregiver linkage, and opt-in GPS sharing.

7. **Privacy-First & Offline-First Architecture**:
   - Raw physiological signals processed locally on-device.
   - Edge AI inference operates 100% offline with zero cloud dependency.
   - Opt-in, encrypted cloud sync and user-controlled emergency telemetry sharing.

8. **Presentation Simulation Console**:
   - 5 scenario presets: Normal Baseline, Heat Stress, Pollution Crisis, Fatigue / Exertion, Multi-Vital Critical Distress.
   - Real-time interactive dials for HR, SpO₂, Skin Temp, GSR, Ambient Temp, Humidity, and AQI.

---

## 🏗 System Architecture

```
                                 SwastyaConnect
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
  FastAPI Backend (:8000)                                React Client (:5173)
  - REST & WebSocket Telemetry                          - Responsive Vanilla CSS Design System
  - Baseline & Risk Inference Engine                    - On-Device Offline Edge AI Engine
  - Disaster & Weather Intelligence                     - LocalStorage Privacy Sandbox
  - Alert Escalation State Machine                      - Live Sparkline Waveforms & Charts
  - Demo Scenario Controllers                           - Interactive Demo Simulation Console
           │                                                         │
           └────────────────────────────┬────────────────────────────┘
                                        ▼
                            Wearable Hardware Layer
                     (HR, SpO₂, Skin Temp, GSR, BLE Bridge)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup (FastAPI)
```bash
# In project root directory
pip install -r backend/requirements.txt

# Start FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite)
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173/` in your web browser.

---

## 🧪 Running Automated Tests

Run the complete 21-test pytest suite covering baseline calculation, risk engines, disaster switching, alert escalation, and REST integration:

```bash
# In project root directory
python -m pytest backend/tests -v
```

---

## ⚖️ Medical Disclaimer

*SwastyaConnect is intended for wellness monitoring, risk awareness, and early-warning support. It is not a medical diagnostic device and does not replace professional medical advice, clinical diagnosis, or emergency healthcare services.*
