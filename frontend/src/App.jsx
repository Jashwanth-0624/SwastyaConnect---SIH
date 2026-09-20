import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HealthDisclaimer from './components/HealthDisclaimer';
import DemoControlPanel from './components/DemoControlPanel';
import AlertModal from './components/AlertModal';

import DashboardView from './pages/DashboardView';
import VitalsView from './pages/VitalsView';
import RisksView from './pages/RisksView';
import InsightsView from './pages/InsightsView';
import DisasterView from './pages/DisasterView';
import TrendsView from './pages/TrendsView';
import DailySummaryView from './pages/DailySummaryView';
import EmergencyView from './pages/EmergencyView';
import PrivacyDashboard from './pages/PrivacyDashboard';
import ProfileView from './pages/ProfileView';

import { apiService } from './services/apiService';
import { storageService } from './services/storageService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [vitals, setVitals] = useState({
    hr: 72.0,
    spo2: 98.0,
    skin_temp: 36.6,
    gsr: 4.5,
    timestamp: Date.now() / 1000,
    is_simulated: true,
    signal_quality: 0.98,
    motion_intensity: 0.05
  });
  const [baseline, setBaseline] = useState({
    hr_baseline: 72.0,
    hr_min: 60.0,
    hr_max: 84.0,
    spo2_baseline: 98.0,
    spo2_min: 95.0,
    skin_temp_baseline: 36.5,
    skin_temp_min: 36.1,
    skin_temp_max: 37.1,
    gsr_baseline: 4.5
  });
  const [environment, setEnvironment] = useState({
    ambient_temp: 33.5,
    humidity: 52.0,
    aqi: 110,
    pm25: 42.0,
    weather_condition: 'Hazy Sunshine',
    disaster_type: 'NONE',
    disaster_severity: 'NONE',
    location_name: 'New Delhi, India',
    is_cached: false
  });
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [alertState, setAlertState] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeScenario, setActiveScenario] = useState('SCENARIO_NORMAL');

  const historyRef = useRef([]);

  // Subscribe to network connectivity
  useEffect(() => {
    const unsub = apiService.subscribeNetworkStatus((online) => {
      setIsOnline(online);
    });
    return unsub;
  }, []);

  // Main real-time polling loop (1.5s interval)
  useEffect(() => {
    let isMounted = true;

    async function tick() {
      try {
        const latestVitals = await apiService.getLatestVitals();
        const currentEnv = await apiService.getEnvironment();
        const currentProfile = storageService.getProfile();
        const risk = await apiService.analyzeHealth(latestVitals, currentEnv, currentProfile);
        const base = await apiService.getBaseline();
        const alert = await apiService.getAlertState();

        if (isMounted) {
          setVitals(latestVitals);
          setEnvironment(currentEnv);
          setRiskAnalysis(risk);
          setBaseline(base);
          setAlertState(alert);

          // Update local rolling history
          const newPoint = {
            timestamp: latestVitals.timestamp,
            hr: latestVitals.hr,
            spo2: latestVitals.spo2,
            skin_temp: latestVitals.skin_temp,
            gsr: latestVitals.gsr,
            overall_risk: risk.overall_risk
          };
          historyRef.current = [...historyRef.current.slice(-30), newPoint];
          setHistory([...historyRef.current]);
          storageService.appendTelemetryPoint(newPoint);
        }
      } catch (err) {
        console.warn('Telemetry cycle error:', err);
      }
    }

    // Initial sync of profile & emergency contacts
    apiService.updateUserProfile(storageService.getProfile());

    tick();
    const interval = setInterval(tick, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Scenario Switch Handler
  const handleSelectScenario = async (scenarioId) => {
    setActiveScenario(scenarioId);
    await apiService.applySimulationScenario(scenarioId);
    // Trigger immediate refresh
    const latestVitals = await apiService.getLatestVitals();
    const currentEnv = await apiService.getEnvironment();
    const risk = await apiService.analyzeHealth(latestVitals, currentEnv);
    setVitals(latestVitals);
    setEnvironment(currentEnv);
    setRiskAnalysis(risk);
  };

  // Custom Slider adjustments
  const handleCustomVitalsChange = async (newVitals) => {
    setVitals(newVitals);
    await apiService.setCustomVitals(newVitals);
    const risk = await apiService.analyzeHealth(newVitals, environment);
    setRiskAnalysis(risk);
  };

  const handleCustomEnvChange = async (newEnv) => {
    setEnvironment(newEnv);
    const risk = await apiService.analyzeHealth(vitals, newEnv);
    setRiskAnalysis(risk);
  };

  // Disaster Scenario Switch
  const handleSelectDisaster = async (disasterType) => {
    const updated = await apiService.setDisasterScenario(disasterType);
    setEnvironment(updated);
    const risk = await apiService.analyzeHealth(vitals, updated);
    setRiskAnalysis(risk);
  };

  // SOS Triggers & Confirmations
  const handleTriggerSOS = async () => {
    const prof = storageService.getProfile();
    await apiService.updateUserProfile(prof);
    const payload = await apiService.triggerEmergencySOS({ latitude: 28.6139, longitude: 77.2090 });
    
    // Explicitly dispatch Twilio IVRS voice call & SMS to every configured contact
    if (prof.emergencyContacts && prof.emergencyContacts.length > 0) {
      for (const c of prof.emergencyContacts) {
        if (c.phone) {
          apiService.dispatchIVRSCall(c.name, c.phone);
          apiService.dispatchSMS(c.name, c.phone);
        }
      }
    }

    setAlertState({
      current_stage: 'SOS_TRIGGERED',
      message: `🚨 Emergency SOS Dispatched to ${prof.emergencyContacts?.map(c => c.name).join(', ') || 'Emergency Network'}!`
    });
  };


  const handleConfirmSafe = async () => {
    const state = await apiService.confirmUserSafe();
    setAlertState(state);
  };

  const handleDismissAlert = async () => {
    const state = await apiService.dismissAlert();
    setAlertState(state);
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header 
        isOnline={isOnline}
        onTriggerSOS={handleTriggerSOS}
        signalQuality={Math.round((vitals?.signal_quality || 0.98) * 100)}
      />

      {/* Navigation Tabs */}
      <Navigation 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
      />

      {/* Main Content Viewport */}
      <main className="content-area">
        <HealthDisclaimer />

        {activeTab === 'dashboard' && (
          <DashboardView
            vitals={vitals}
            baseline={baseline}
            riskAnalysis={riskAnalysis}
            environment={environment}
            history={history}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'vitals' && (
          <VitalsView
            vitals={vitals}
            baseline={baseline}
            riskAnalysis={riskAnalysis}
            history={history}
          />
        )}

        {activeTab === 'risks' && (
          <RisksView
            riskAnalysis={riskAnalysis}
            environment={environment}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView
            riskAnalysis={riskAnalysis}
            vitals={vitals}
            baseline={baseline}
            environment={environment}
          />
        )}

        {activeTab === 'disaster' && (
          <DisasterView
            environment={environment}
            onSelectDisaster={handleSelectDisaster}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsView />
        )}

        {activeTab === 'summary' && (
          <DailySummaryView
            vitals={vitals}
            baseline={baseline}
            riskAnalysis={riskAnalysis}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyView
            riskAnalysis={riskAnalysis}
            vitals={vitals}
            onTriggerSOS={handleTriggerSOS}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacyDashboard />
        )}

        {activeTab === 'profile' && (
          <ProfileView onProfileUpdated={() => {}} />
        )}
      </main>

      {/* Simulation / Demo Controller */}
      <DemoControlPanel
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        vitals={vitals}
        environment={environment}
        onCustomVitalsChange={handleCustomVitalsChange}
        onCustomEnvChange={handleCustomEnvChange}
      />

      {/* Alert Escalation / SOS Countdown Modal */}
      <AlertModal
        alertState={alertState}
        onConfirmSafe={handleConfirmSafe}
        onTriggerSOS={handleTriggerSOS}
        onDismiss={handleDismissAlert}
        vitals={vitals}
        profile={storageService.getProfile()}
      />

    </div>
  );
}
