# SwastyaConnect — Comprehensive Project Report

**Project Name:** `SwastyaConnect`  
**System Classification:** AI-Powered Personal Health Companion & Disaster-Resilient Early Warning Platform  
**Target Hardware:** Wearable Health Sensor Suite (Heart Rate, SpO₂, Skin Temperature, Galvanic Skin Response)  
**Backend Framework:** FastAPI (Python 3.13)  
**Frontend Architecture:** React 18, Vite, Vanilla CSS Clinical Slate Design System  
**Edge AI & Privacy Model:** On-Device Inference, Zero Unconsented Telemetry Egress, Offline-First  

---

## 1. Project Overview

**SwastyaConnect** is a secure, AI-powered Personal Health Companion designed to work with existing wearable hardware (Heart Rate, Blood Oxygen/SpO₂, Skin Temperature, and Galvanic Skin Response/GSR) to deliver real-time, privacy-preserving health monitoring and early warning capabilities.

Rather than acting as a passive dashboard displaying raw sensor figures or using crude static thresholds (e.g. $HR > 100 \rightarrow Danger$), SwastyaConnect operates as an **Intelligent Personal Health Risk Engine**. It establishes a dynamic personal baseline ("Your Normal") for each individual, extracts physiological features, fuses multi-sensor telemetry with real-time ambient environmental context (such as extreme heat, toxic AQI smog, floods, or cyclones), and generates explainable risk assessments with cautious, non-diagnostic guidance and progressive emergency escalation.

---

## 2. Problem Statement Alignment

The table below maps each requirement from the build specification to the implemented capability in SwastyaConnect:

| # | Problem Statement Requirement | SwastyaConnect Implementation |
|---|-------------------------------|-------------------------------|
| 1 | **Strict Project Naming** (`SwastyaConnect`) | Named strictly and consistently as `SwastyaConnect` across all code, UI, metadata, routes, tests, and documentation. |
| 2 | **Existing Hardware Adaptation** (HR, SpO₂, Skin Temp, GSR) | Implemented `WearableDataProvider` interface and signal processor around the 4 primary sensors with no fictitious sensors. |
| 3 | **Personal Health Risk Engine Concept** | Engineered multi-stage pipeline: Sensor Acquisition $\rightarrow$ Signal Processing $\rightarrow$ Baseline Deviation $\rightarrow$ Multi-Sensor AI Fusion $\rightarrow$ Explainable Alert $\rightarrow$ Actionable Triage $\rightarrow$ Emergency SOS. |
| 4 | **Personal Baseline Engine ("Your Normal")** | Built `BaselineEngine` computing continuous dynamic baseline ranges (e.g., HR: 60–84 BPM, SpO₂: ≥95%, Skin Temp: 36.1–37.1°C, GSR: ~4.5 µS) and calculating relative % deviations. |
| 5 | **Multi-Sensor Anomaly Detection & Risk Engine** | Modular AI inference layer outputting Overall Risk (0–100, LOW/MODERATE/HIGH/CRITICAL) with transparent feature weights. |
| 6 | **Heat-Stress Risk Engine** (0–100) | Dedicated sub-engine fusing skin temperature delta, thermal tachycardia, GSR thermoregulatory sweating conductance, and ambient Heat Index. |
| 7 | **Respiratory Risk Engine** (0–100) | Dedicated sub-engine fusing SpO₂ desaturation, compensatory tachycardia, and environmental particulate air pollution (AQI / PM2.5). |
| 8 | **Cardiovascular Stress Engine** (0–100) | Assesses relative heart rate surge above personal baseline, thermal coupling, and hypoxic cardiac workload (strictly non-diagnostic). |
| 9 | **Fatigue Risk Engine** (0–100) | Evaluates cardiac drift during resting states, sustained electrodermal arousal, and thermal drift. |
| 10 | **Environmental Awareness & Disaster Mode** | Comprehensive monitoring with realistic Indian disaster profiles: Indian Heat Waves, Delhi-NCR Toxic Smog, Coastal Cyclones, Monsoon Urban Floods, and Dust Storms. |
| 11 | **Offline-First Architecture** | Local client-side `OfflineEdgeEngine` and `storageService` enabling 100% offline functionality without internet or backend availability. |
| 12 | **Privacy-Preserving Edge AI** | Raw physiological data is parsed and evaluated locally. Zero raw telemetry transmission. Cloud sync is strictly opt-in and disabled by default. |
| 13 | **Explainable AI ("Why is my risk elevated?")** | Deconstructs every score into human-readable contributing factors with exact percentage contributions. |
| 14 | **False-Positive Reduction & Alert Escalation** | Temporal persistence verification requiring consecutive abnormal windows before advancing from `NORMAL` $\rightarrow$ `ANOMALY` $\rightarrow$ `MODERATE` $\rightarrow$ `HIGH` $\rightarrow$ `USER_CONFIRMATION` $\rightarrow$ `SOS_TRIGGERED`. |
| 15 | **Emergency Assistance & SOS Workflow** | Interactive 30-second audible/visual countdown timer, emergency contacts manager, caregiver linkage, and privacy-respecting dispatch payloads. |
| 16 | **Emergency Location Privacy** | Explicit opt-in toggle; location coordinates are omitted unless the user explicitly grants permission. |
| 17 | **Historical Trends & Longitudinal Analytics** | Multi-timeframe interactive graphs (Today 24h, 7 Days, 30 Days) with multi-vital overlay and anomaly markers. |
| 18 | **Daily Health Summary** | Formatted daily report with diurnal thermal curves, peak stress intervals, and holistic AI insight. |
| 19 | **User Profile & Vulnerability Modes** | Support for Elderly, Outdoor Worker, Disaster Responder, and General modes to adjust sensitivity multipliers safely. |
| 20 | **Simulation & Demo Controller** | Predefined scenario presets (Normal, Heat Stress, Pollution Crisis, Fatigue, Multi-Sensor Distress) and live interactive sliders for presentations. |
| 21 | **Medical Disclaimer** | Prominently displayed ethics and wellness disclaimer on every view. |

---

## 3. Features Implemented

1. **Live Telemetry Stream**: Real-time 1Hz ingestion with Signal Quality Index (SQI) monitoring and outlier rejection.
2. **Dynamic Baseline Tracking**: Dynamic calculation of resting mean, standard deviation, and dynamic tolerance bounds.
3. **5-Engine Risk Scoring Architecture**: Overall Health Risk, Heat Stress Risk, Respiratory Risk, Cardiovascular Stress, and Fatigue Risk.
4. **Disaster Intelligence Feed**: Live meteorological tracking with Indian disaster scenarios and actionable survival protocols.
5. **Interactive Explainable AI**: Detailed factor contribution tables explaining the exact reasons for risk changes.
6. **Actionable Non-Diagnostic Triage**: Practical, wellness-oriented guidance (hydration, shaded rest, respiratory protection).
7. **Emergency SOS Countdown & Telephony Dispatch**: Auto-dispatch timer with user cancellation ("I Am Okay"). When confirmed or timed out, automatically initiates an outbound automated IVRS voice phone call (TwiML / TTS audio) and broadcasts emergency SMS text messages with real-time vital telemetry to designated contacts.
8. **Contact & Caregiver Management**: Add, view, set primary, and remove emergency contacts.
9. **Visual Privacy Dashboard**: 4 core privacy pillars detailing on-device processing and opt-in settings.
10. **Automated Telephony Engine (`telephony_service.py`)**: Outbound IVRS synthetic voice alerts and structured SMS notifications with Twilio Cloud Telephony integration.

10. **Vulnerability Profiles**: Mode toggles for Elderly, Outdoor Workers, and First Responders.
11. **Longitudinal Trends & Analytics**: Time-series charts for 24h, 7D, and 30D intervals.
12. **Daily Health Briefing**: Comprehensive daily summary card with peak stress times.
13. **Developer Simulation Dock**: Floating console with 5 scenario presets and manual sliders.
14. **Offline Edge Engine**: JavaScript on-device inference fallback guaranteeing zero-cloud operation.

---

## 4. System Architecture

```
                                SwastyaConnect System
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
[FastAPI Backend :8000]                                       [React Client :5173]
├─ main.py (App & CORS)                                       ├─ App.jsx (State & Lifecycle)
├─ models/schemas.py (Pydantic Models)                        ├─ index.css (Clinical Slate Theme)
├─ services/                                                  ├─ services/
│  ├─ baseline_engine.py (Your Normal)                        │  ├─ apiService.js (Unified REST/WS)
│  ├─ risk_engine.py (AI Multi-Sensor Fusion)                 │  ├─ offlineEdgeEngine.js (Edge AI Fallback)
│  ├─ disaster_service.py (Indian Profiles)                   │  └─ storageService.js (LocalStorage)
│  ├─ alert_service.py (Escalation Machine)                   ├─ components/
│  ├─ sensor_provider.py (Signal Filter & SQI)                │  ├─ Header.jsx (Status & Quick SOS)
│  └─ simulation_service.py (Telemetry Generator)             │  ├─ Navigation.jsx (10 View Tabs)
└─ routers/                                                   │  ├─ SparklineChart.jsx (SVG Waveforms)
   ├─ sensors.py (REST & WebSocket Feeds)                     │  ├─ DemoControlPanel.jsx (Simulation Dials)
   ├─ health.py (Inference & Trends)                          │  ├─ AlertModal.jsx (Countdown Overlay)
   ├─ disaster.py (Weather & Protocols)                       │  └─ HealthDisclaimer.jsx (Medical Notice)
   ├─ emergency.py (SOS & Contacts)                           └─ pages/
   └─ simulation.py (Scenario Controllers)                       ├─ DashboardView.jsx (Hero Status)
                                                                 ├─ VitalsView.jsx (Telemetry & Baselines)
                                                                 ├─ RisksView.jsx (4 Sub-Engines)
                                                                 ├─ InsightsView.jsx (Explainable AI)
                                                                 ├─ DisasterView.jsx (Indian Scenarios)
                                                                 ├─ TrendsView.jsx (24h/7D/30D Graphs)
                                                                 ├─ DailySummaryView.jsx (Daily Brief)
                                                                 ├─ EmergencyView.jsx (SOS & Privacy)
                                                                 ├─ PrivacyDashboard.jsx (Local Edge)
                                                                 └─ ProfileView.jsx (Vulnerability Mode)
```

---

## 5. Folder & File Structure

```
SwastyaConnect/
├── README.md                                 # High-level overview and run instructions
├── SwastyaConnect_Project_Report.md          # Comprehensive 60-point technical report
├── backend/
│   ├── requirements.txt                      # Python dependencies (FastAPI, Uvicorn, Pydantic, Pytest)
│   ├── .env.example                          # Environment template
│   ├── main.py                               # FastAPI application entrypoint
│   ├── models/
│   │   ├── __init__.py                       # Package exports
│   │   └── schemas.py                        # Strict Pydantic models for all data structures
│   ├── services/
│   │   ├── __init__.py                       # Services exports
│   │   ├── baseline_engine.py                # Dynamic personal baseline engine ("Your Normal")
│   │   ├── risk_engine.py                    # Multi-sensor AI/rule-based risk inference engine
│   │   ├── disaster_service.py               # Indian disaster profiles & offline caching
│   │   ├── alert_service.py                  # False-positive reduced alert escalation state machine
│   │   ├── sensor_provider.py                # Hardware abstraction & signal processor (Hampel/SQI)
│   │   └── simulation_service.py             # Realistic telemetry stream generator & demo presets
│   ├── routers/
│   │   ├── __init__.py                       # Routers exports
│   │   ├── sensors.py                        # Live telemetry REST and WebSocket endpoints
│   │   ├── health.py                         # Risk analysis, baseline, trends, and summary endpoints
│   │   ├── disaster.py                       # Environmental feeds, disaster scenarios, and protocols
│   │   ├── emergency.py                      # SOS triggers, alert state queries, and contact management
│   │   └── simulation.py                     # Demo scenario controls and manual vital sliders
│   └── tests/
│       ├── __init__.py                       # Test package init
│       ├── test_baseline.py                  # Baseline learning and deviation unit tests
│       ├── test_risk_engine.py               # Heat stress, respiratory, cardio, and fatigue tests
│       ├── test_disaster.py                  # Indian disaster scenarios and caching tests
│       ├── test_alert_escalation.py          # Alert state machine and privacy SOS tests
│       └── test_integration.py               # End-to-end full REST API integration tests
└── frontend/
    ├── package.json                          # Node project configuration and scripts
    ├── index.html                            # Application HTML with Google Fonts & metadata
    ├── vite.config.js                        # Vite configuration
    └── src/
        ├── main.jsx                          # React application root mount
        ├── App.jsx                           # Primary application state, polling, and view routing
        ├── index.css                         # Clinical Dark Slate design system (CSS variables & glassmorphism)
        ├── services/
        │   ├── apiService.js                 # Unified API service with automatic offline fallback
        │   ├── offlineEdgeEngine.js          # On-device Edge AI risk engine in JavaScript
        │   └── storageService.js             # LocalStorage persistence manager
        ├── components/
        │   ├── Header.jsx                    # Branding, live status badge, SQI, and quick SOS button
        │   ├── Navigation.jsx                # Responsive tab navigation
        │   ├── HealthDisclaimer.jsx          # Ethics-aligned non-diagnostic medical notice
        │   ├── SparklineChart.jsx            # High-performance SVG sparkline waveforms
        │   ├── DemoControlPanel.jsx          # Docked simulation controls with scenario presets & sliders
        │   └── AlertModal.jsx                # Interactive alert confirmation & countdown modal
        └── pages/
            ├── DashboardView.jsx             # Main health triage overview ("Am I okay?")
            ├── VitalsView.jsx                # Detailed sensor telemetry and baseline bounds
            ├── RisksView.jsx                 # Deep-dive into all 4 risk sub-engines
            ├── InsightsView.jsx              # Explainable AI contributing factor breakdown
            ├── DisasterView.jsx              # Indian environmental monitoring & disaster protocols
            ├── TrendsView.jsx                # Historical 24h, 7D, and 30D vital curves
            ├── DailySummaryView.jsx          # Formatted daily health summary card
            ├── EmergencyView.jsx             # Emergency SOS, location privacy, and contacts editor
            ├── PrivacyDashboard.jsx          # Visual "Your Health Data Stays With You" dashboard
            └── ProfileView.jsx               # Demographics and vulnerability mode settings
```

---

## 6. File-by-File Functionality Documentation

| File Path | Purpose | Main Functionality |
|-----------|---------|--------------------|
| `backend/main.py` | FastAPI Application Root | Configures CORS, loads environment variables, registers sub-routers, and provides health check endpoint `/`. |
| `backend/models/schemas.py` | Core Data Models | Defines Pydantic schemas for `WearableData`, `PersonalBaseline`, `EnvironmentalContext`, `UserProfile`, `RiskAnalysisResult`, `RiskFactor`, `AlertEscalationState`, `EmergencySOSPayload`, and `HistoricalDataPoint`. |
| `backend/services/baseline_engine.py` | Personal Baseline Engine | Computes running dynamic personal baselines ("Your Normal") using Exponential Moving Averages (EMA) on resting data, calculating percentage/z-score deviations. |
| `backend/services/risk_engine.py` | Multi-Sensor AI Risk Engine | Implements modular risk scoring (Heat Stress, Respiratory, Cardio, Fatigue, Composite Overall 0–100), NOAA Heat Index, explainable factor generator, and triage guidance. |
| `backend/services/disaster_service.py` | Disaster Intelligence Service | Manages Indian environmental profiles (Heat Waves, Delhi Smog, Cyclones, Urban Floods), offline environmental caching, and survival protocols. |
| `backend/services/alert_service.py` | Alert Escalation Service | Manages state machine (`NORMAL` $\rightarrow$ `ANOMALY` $\rightarrow$ `MODERATE` $\rightarrow$ `HIGH` $\rightarrow$ `USER_CONFIRMATION` $\rightarrow$ `SOS_TRIGGERED`), persistence tracking, and privacy-filtered SOS payloads. |
| `backend/services/sensor_provider.py` | Hardware & Signal Layer | Defines abstract `WearableDataProvider`, Hampel/moving-average noise filter, and Signal Quality Index (SQI) evaluator. |
| `backend/services/simulation_service.py` | Simulation Telemetry Service | Generates realistic sensor telemetry with micro-jitter (sinus arrhythmia), demo scenarios, and historical trend points. |
| `backend/routers/sensors.py` | Sensors Router | Exposes `/api/sensors/latest`, `/api/sensors/ingest` (BLE bridge), `/api/sensors/status`, and WebSocket feed `/api/sensors/ws`. |
| `backend/routers/health.py` | Health Router | Exposes `/api/health/analyze` (AI inference), `/api/health/baseline`, `/api/health/trends`, and `/api/health/daily-summary`. |
| `backend/routers/disaster.py` | Disaster Router | Exposes `/api/disaster/current`, `/api/disaster/cached`, `/api/disaster/scenario`, and `/api/disaster/protocols`. |
| `backend/routers/emergency.py` | Emergency Router | Exposes `/api/emergency/state`, `/api/emergency/trigger-sos`, `/api/emergency/confirm-ok`, `/api/emergency/dismiss`, and profile updates. |
| `backend/routers/simulation.py` | Simulation Router | Exposes `/api/simulation/scenarios`, `/api/simulation/apply`, and `/api/simulation/custom-vitals`. |
| `backend/tests/test_baseline.py` | Baseline Unit Tests | Validates initial baseline bounds, percentage deviation calculations, and EMA learning updates. |
| `backend/tests/test_risk_engine.py` | Risk Engine Tests | Tests normal state, 44.5°C heatwave scenario, 385 AQI smog crisis, and cardiovascular stress scoring. |
| `backend/tests/test_disaster.py` | Disaster & Escalation Tests | Tests Indian disaster scenario switching, offline caching, and false-positive reduction persistence. |
| `backend/tests/test_integration.py` | REST Integration Tests | End-to-end verification of all FastAPI endpoints, scenario switching, and SOS workflows. |
| `frontend/src/index.css` | Design System | Modern Vanilla CSS stylesheet with Clinical Dark Slate tokens, glassmorphism, responsive grid, and glowing severity states. |
| `frontend/src/services/offlineEdgeEngine.js` | On-Device Edge AI Engine | JavaScript implementation of the risk engine and baseline calculations for 100% offline standalone operation. |
| `frontend/src/services/apiService.js` | Unified Client API Service | Connects to FastAPI backend with automatic graceful fallback to `offlineEdgeEngine` and `storageService` when disconnected. |
| `frontend/src/services/storageService.js` | Local Storage Manager | Manages client-side storage for profile, contacts, baseline, telemetry logs, and cached weather. |
| `frontend/src/components/Header.jsx` | Header Bar | Displays brand name, real-time connection badge (`Connected` / `📴 Offline Mode`), SQI meter, and quick SOS button. |
| `frontend/src/components/Navigation.jsx` | Tab Navigation | Tab buttons for switching between the 10 views. |
| `frontend/src/components/HealthDisclaimer.jsx` | Medical Disclaimer | Prominent banner displaying the non-diagnostic medical notice. |
| `frontend/src/components/SparklineChart.jsx` | Waveform Visualizer | High-performance SVG sparklines with gradient fills for live vital graphs. |
| `frontend/src/components/DemoControlPanel.jsx` | Simulation Console | Floating/docked panel with 5 scenario presets and manual sliders. |
| `frontend/src/components/AlertModal.jsx` | Alert Modal | Countdown overlay (30s) for user confirmation before emergency SOS dispatch. |
| `frontend/src/pages/DashboardView.jsx` | Main Dashboard | Answers "Am I okay?" immediately with hero triage card, live vitals grid, disaster banner, and quick actions. |
| `frontend/src/pages/VitalsView.jsx` | Detailed Vitals | In-depth cards for HR, SpO₂, Skin Temp, and GSR with baseline comparison ranges and physiological stress indicators. |
| `frontend/src/pages/RisksView.jsx` | Risk Engines | Dedicated breakdowns of Heat Stress, Respiratory, Cardio, and Fatigue risk scores with factor checklists. |
| `frontend/src/pages/InsightsView.jsx` | Explainable AI | "Why is my risk elevated?" breakdown with factor weights and personalized triage guidance. |
| `frontend/src/pages/DisasterView.jsx` | Disaster Intelligence | Indian meteorological radar, scenario cards (Heatwave, Smog, Floods, Cyclones), and survival protocols. |
| `frontend/src/pages/TrendsView.jsx` | Health Trends | Time-series graphs for Today (24h), 7 Days, and 30 Days. |
| `frontend/src/pages/DailySummaryView.jsx` | Daily Summary | Formatted daily report with timeline insights and wellness summaries. |
| `frontend/src/pages/EmergencyView.jsx` | Emergency / SOS | Emergency contacts manager, location sharing toggle, SOS dispatcher, and distress message preview. |
| `frontend/src/pages/PrivacyDashboard.jsx` | Privacy & Edge | Visual breakdown of local processing, on-device AI, opt-in sync, and user consent. |
| `frontend/src/pages/ProfileView.jsx` | User Profile | Demographics, vulnerability modes (Elderly, Outdoor Worker, Disaster Responder), and data wipe controls. |

---

## 7. Functionality Maps & Dataflows

### A. Wearable $\rightarrow$ Application
1. Wearable hardware transmits raw samples (PPG, Thermistor, GSR ADC) over BLE or simulated stream.
2. `SignalProcessor` cleans incoming data: applies physical sanity bounds clamping, Hampel/moving-average smoothing, and computes the Signal Quality Index (SQI).

### B. Application $\rightarrow$ AI
1. Cleaned telemetry is passed to `BaselineEngine`.
2. If the user is in a stable resting state with high SQI, the dynamic personal baseline is incrementally updated via Exponential Moving Average (EMA).
3. Relative deviations (% HR change, SpO₂ drop, $\Delta^\circ\text{C}$ temperature, % GSR conductance) are computed.

### C. AI $\rightarrow$ Risk Engine
1. Physiological deviations are combined with ambient environmental factors (Heat Index, AQI, PM2.5, Disaster Status) and User Vulnerability Mode.
2. Individual sub-engines calculate scores (0–100) for **Heat Stress**, **Respiratory Risk**, **Cardiovascular Stress**, and **Fatigue Risk**.
3. Dynamic contextual fusion determines the **Composite Overall Health Risk**.

### D. Risk Engine $\rightarrow$ UI
1. The dashboard immediately updates the primary status card ("Am I okay?"), live vital cards with baseline comparison tags, and sub-engine progress tracks.

### E. Risk Engine $\rightarrow$ Alerts
1. `AlertEscalationService` processes the risk output.
2. If an anomaly is transient (1 sample), the system logs it without triggering alarms.
3. If abnormal readings persist across consecutive windows, the state machine advances: `ANOMALY` $\rightarrow$ `MODERATE` $\rightarrow$ `HIGH` $\rightarrow$ `USER_CONFIRMATION`.

### F. Alerts $\rightarrow$ Emergency
1. In `USER_CONFIRMATION`, an audible and visual 30-second countdown prompt appears.
2. If the user clicks "I Am Okay", the state resets to `NORMAL`.
3. If the timer expires or the user clicks "Trigger SOS Now", `EmergencySOSPayload` is generated (attaching GPS coordinates *only* if the user has opted into location sharing) and dispatched to designated emergency contacts and caregivers.

---

## 8. AI & Risk Scoring Methodology

- **Personal Baseline Deviation Calculation**:
  $$\text{HR Deviation (\%)} = \left(\frac{\text{Current HR} - \text{Baseline HR}}{\text{Baseline HR}}\right) \times 100$$
  $$\Delta \text{Temp} = \text{Current Skin Temp} - \text{Baseline Temp}$$
  $$\text{GSR Deviation (\%)} = \left(\frac{\text{Current GSR} - \text{Baseline GSR}}{\text{Baseline GSR}}\right) \times 100$$

- **Heat Stress Risk Equation (0–100)**:
  $$\text{Heat Risk} = \min\Big(100,\, \big(0.35 \cdot S_{\text{Temp}} + 0.25 \cdot S_{\text{HR}} + 0.15 \cdot S_{\text{GSR}} + 0.25 \cdot S_{\text{EnvHeatIndex}}\big) \times M_{\text{vuln}}\Big)$$

- **Respiratory Risk Equation (0–100)**:
  $$\text{Resp Risk} = \min\Big(100,\, \big(0.50 \cdot S_{\text{SpO2}} + 0.35 \cdot S_{\text{AQI}} + 0.15 \cdot S_{\text{HR\_Comp}}\big) \times M_{\text{vuln}}\Big)$$

- **Overall Health Risk Fusion**:
  $$\text{Overall Score} = \min\Big(100,\, \big(0.70 \cdot \max(S_{\text{sub}}) + 0.30 \cdot \text{mean}(S_{\text{secondary}})\big) \times M_{\text{disaster}}\Big)$$

- **Clinical Integrity & Transparency**:
  The system makes **no diagnostic claims**. All risk outputs represent physiological stress awareness and triage guidance. The architecture is modular and ready for quantized edge models (TinyML / TFLite / ONNX Runtime) via the existing `analyzeHealthState` interface.

---

## 9. Privacy & Security Guarantees

1. **Local Data Processing**: Raw 1Hz sensor streams (PPG, skin thermistor, electrodermal conductance) never leave the user's personal device.
2. **On-Device AI Inference**: The risk inference engine executes locally in Python or directly in client-side JavaScript.
3. **Zero Unconsented Egress**: No third-party tracking, analytics, or background cloud synchronization occurs without explicit opt-in.
4. **Emergency Location Privacy**: GPS coordinates are disabled by default. When enabled, location is included *strictly* in emergency SOS payloads sent to designated contacts.
5. **Granular Data Control**: Users can wipe all historical telemetry logs locally with one click in the Profile view.

---

## 10. Indian Environmental & Disaster Scenarios

SwastyaConnect incorporates localized Indian disaster scenarios:
1. **Severe Heatwaves (North & Central India)**: Ambient temperatures reaching 44.5°C with high solar radiation. The system detects thermal tachycardia and electrodermal conductance spikes before clinical heat exhaustion occurs.
2. **Dense Urban Smog / AQI Crisis (Delhi-NCR)**: Hazardous AQI (385+) and elevated PM2.5 particulate concentrations. The system detects blood oxygen desaturation and advises immediate indoor air filtration and N95 protection.
3. **Tropical Cyclones (Bay of Bengal / Arabian Sea)**: Severe gale winds and coastal rainfall. Prompts users with storm shelter protocols.
4. **Monsoon Urban Inundation & Flash Floods (Mumbai / Assam)**: Monsoonal waterlogging awareness and pathogen safety protocols.
5. **Network Outages**: The application falls back to cached environmental metrics and continues full local physiological monitoring.

---

## 11. How to Run & Verify

### Step 1: Install Dependencies
```bash
# In project root:
pip install -r backend/requirements.txt

# In frontend folder:
cd frontend
npm install
cd ..
```

### Step 2: Start Backend Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

### Step 3: Start Frontend Client
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173/` in your browser.

### Step 4: Run Automated Tests
```bash
python -m pytest backend/tests -v
```

---

## 12. Automated Test Results Summary

The automated test suite in `backend/tests/` verifies all core algorithms:

```
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0
collected 21 items

backend/tests/test_baseline.py::test_initial_baseline PASSED             [  4%]
backend/tests/test_baseline.py::test_deviation_calculation PASSED        [  9%]
backend/tests/test_baseline.py::test_baseline_learning_update PASSED     [ 14%]
backend/tests/test_disaster.py::test_disaster_scenario_switching PASSED  [ 19%]
backend/tests/test_disaster.py::test_disaster_offline_cache PASSED       [ 23%]
backend/tests/test_disaster.py::test_alert_escalation_false_positive_reduction PASSED [ 28%]
backend/tests/test_disaster.py::test_privacy_preserving_emergency_sos PASSED [ 33%]
backend/tests/test_integration.py::test_root_endpoint PASSED             [ 38%]
backend/tests/test_integration.py::test_sensors_endpoint PASSED          [ 42%]
backend/tests/test_integration.py::test_sensor_status PASSED             [ 47%]
backend/tests/test_integration.py::test_baseline_endpoint PASSED         [ 52%]
backend/tests/test_integration.py::test_risk_analysis_endpoint PASSED    [ 57%]
backend/tests/test_integration.py::test_daily_summary_endpoint PASSED    [ 61%]
backend/tests/test_integration.py::test_trends_endpoint PASSED           [ 66%]
backend/tests/test_integration.py::test_disaster_switching_and_protocols PASSED [ 71%]
backend/tests/test_integration.py::test_emergency_workflow PASSED        [ 76%]
backend/tests/test_integration.py::test_simulation_scenarios_listing_and_apply PASSED [ 80%]
backend/tests/test_risk_engine.py::test_normal_risk_assessment PASSED    [ 85%]
backend/tests/test_risk_engine.py::test_heat_stress_scenario PASSED      [ 90%]
backend/tests/test_risk_engine.py::test_respiratory_risk_scenario PASSED [ 95%]
backend/tests/test_risk_engine.py::test_cardiovascular_stress_scenario PASSED [100%]

============================= 21 passed in 5.88s ==============================
```

---

## 13. Medical Disclaimer

*SwastyaConnect is intended for wellness monitoring, risk awareness, and early-warning support. It is not a medical diagnostic device and does not replace professional medical advice, clinical diagnosis, or emergency healthcare services.*
