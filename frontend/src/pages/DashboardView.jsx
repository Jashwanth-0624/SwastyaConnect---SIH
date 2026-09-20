import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Wind, 
  Thermometer, 
  Droplet, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  CloudLightning, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Sparkles,
  PhoneCall,
  Wifi,
  Usb,
  RefreshCw,
  Sliders,
  Send,
  HelpCircle,
  Database
} from 'lucide-react';
import SparklineChart from '../components/SparklineChart';
import { apiService } from '../services/apiService';

export default function DashboardView({
  vitals,
  baseline,
  riskAnalysis,
  environment,
  history,
  onNavigate
}) {
  const level = riskAnalysis?.overall_level || 'LOW';
  const score = Math.round(riskAnalysis?.overall_risk || 0);

  // ML Risk Detection States
  const [mlResult, setMlResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hardwareStatus, setHardwareStatus] = useState({ is_hardware_active: false, source: 'SIMULATED' });
  const [showHardwareDrawer, setShowHardwareDrawer] = useState(false);
  const [serialPorts, setSerialPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [serialConnecting, setSerialConnecting] = useState(false);

  // PostgreSQL Persistence States
  const [dbStatus, setDbStatus] = useState(null);
  const [dbHistory, setDbHistory] = useState([]);
  const [showDbHistory, setShowDbHistory] = useState(false);

  // Extract sparklines from history
  const hrSeries = history.slice(-20).map(h => h.hr || 72);
  const spo2Series = history.slice(-20).map(h => h.spo2 || 98);
  const tempSeries = history.slice(-20).map(h => h.skin_temp || 36.6);
  const gsrSeries = history.slice(-20).map(h => h.gsr || 4.5);

  // Poll hardware status
  useEffect(() => {
    let mounted = true;
    const fetchHw = async () => {
      try {
        const hw = await apiService.getHardwareStatus();
        if (mounted) setHardwareStatus(hw);
      } catch (e) {
        // ignore
      }
    };
    fetchHw();
    const interval = setInterval(fetchHw, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch available COM ports when hardware drawer is opened
  useEffect(() => {
    if (showHardwareDrawer) {
      apiService.getSerialPorts().then(ports => {
        setSerialPorts(ports);
        if (ports.length > 0 && !selectedPort) {
          setSelectedPort(ports[0].port);
        }
      });
    }
  }, [showHardwareDrawer]);

  // Fetch PostgreSQL connection status and detection logs
  const refreshDb = async () => {
    try {
      const status = await apiService.getDatabaseStatus();
      setDbStatus(status);
      const historyRows = await apiService.getStoredDetections(15);
      setDbHistory(historyRows);
    } catch (e) {
      console.warn('PostgreSQL fetch error:', e);
    }
  };

  useEffect(() => {
    refreshDb();
    const interval = setInterval(refreshDb, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle "Detect" Button Click
  const handleDetect = async () => {
    setIsDetecting(true);
    try {
      const res = await apiService.detectMLRisk({
        hr: vitals?.hr,
        spo2: vitals?.spo2,
        skin_temp: vitals?.skin_temp,
        temp: vitals?.skin_temp,
        gsr: vitals?.gsr
      });
      setMlResult(res);
      // Immediately refresh DB records to show the new row
      setTimeout(refreshDb, 400);
    } catch (err) {
      console.error('ML Detection failed:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  // Test injection of ESP32 telemetry packet
  const handleInjectESP32Packet = async (mode) => {
    const payload = mode === 'abnormal' ? {
      hr: 134.0,
      spo2: 86.5,
      temp: 39.4,
      skin_temp: 39.4,
      gsr: 22.5,
      device_id: 'ESP32_DEMO_RIG'
    } : {
      hr: 72.0,
      spo2: 98.5,
      temp: 36.6,
      skin_temp: 36.6,
      gsr: 4.2,
      device_id: 'ESP32_DEMO_RIG'
    };

    await apiService.sendESP32Telemetry(payload);
    const updated = await apiService.getHardwareStatus();
    setHardwareStatus(updated);
  };

  // Serial connect/disconnect
  const handleToggleSerial = async () => {
    if (hardwareStatus?.serial_status?.connected) {
      await apiService.disconnectSerialPort();
    } else if (selectedPort) {
      setSerialConnecting(true);
      await apiService.connectSerialPort(selectedPort);
      setSerialConnecting(false);
    }
    const updated = await apiService.getHardwareStatus();
    setHardwareStatus(updated);
  };

  return (
    <div>
      {/* 1. HERO TRIAGE STATUS ("Am I okay?") */}
      <div className={`glass-panel hero-triage-card ${level}`}>
        <div className="triage-hero-content">
          <div className="triage-status-info">
            <h1>
              {level === 'LOW' && <CheckCircle2 size={32} color="var(--risk-low)" />}
              {level === 'MODERATE' && <AlertTriangle size={32} color="var(--risk-mod)" />}
              {level === 'HIGH' && <Flame size={32} color="var(--risk-high)" />}
              {level === 'CRITICAL' && <AlertTriangle size={32} color="var(--risk-critical)" />}
              <span>{level === 'LOW' ? 'Health Status: Stable' : `Health Risk: ${level}`}</span>
            </h1>
            <p className="triage-status-desc">
              {riskAnalysis?.explanation || 'All physiological indicators are within personal baseline ranges.'}
            </p>
          </div>

          <div className="risk-score-display">
            <div className={`score-circle ${level}`}>
              <span className="number">{score}</span>
              <span className="out-of">/100 RISK</span>
            </div>
          </div>
        </div>

        {/* Actionable Non-Diagnostic Guidance */}
        {riskAnalysis?.recommendations && riskAnalysis.recommendations.length > 0 && (
          <div style={{
            marginTop: 20,
            padding: '12px 18px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} color="var(--primary-light)" />
              <span style={{ fontSize: '0.88rem', color: '#f8fafc' }}>
                <strong>Recommended Action:</strong> {riskAnalysis.recommendations[0]}
              </span>
            </div>
            <button 
              onClick={() => onNavigate('insights')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-light)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Why this risk? <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. ACTIVE ENVIRONMENTAL THREAT BANNER */}
      {environment?.disaster_type && environment.disaster_type !== 'NONE' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CloudLightning size={24} color="#f87171" />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fecaca' }}>
                Active Environmental Threat: {environment.weather_condition} ({environment.location_name})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Ambient: {environment.ambient_temp}°C | Humidity: {environment.humidity}% | AQI: {environment.aqi}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('disaster')}
            style={{
              padding: '6px 14px',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Disaster Protocols →
          </button>
        </div>
      )}

      {/* 3. MACHINE LEARNING RISK DETECTOR & ESP32 HARDWARE SECTION */}
      <div className="ml-detector-card">
        <div className="ml-card-header">
          <div className="ml-header-left">
            <div className="ml-icon-bubble">
              <Cpu size={26} />
            </div>
            <div className="ml-title-group">
              <h2>
                <span>Random Forest Health Risk Classifier</span>
                <span style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: 12, fontWeight: 700 }}>
                  TRAINED MODEL
                </span>
              </h2>
              <p>Evaluates multi-sensor vitals (Heart Rate, SpO₂, Temperature, GSR) and automatically dispatches emergency phone call on abnormal score.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Live Hardware Connection Badge */}
            <div className={`hardware-live-badge ${hardwareStatus?.is_hardware_active ? 'connected' : 'simulated'}`}>
              <span className="pulsing-dot" />
              <span>
                {hardwareStatus?.is_hardware_active 
                  ? `ESP32 Hardware Connected (${hardwareStatus?.source || 'LIVE'})` 
                  : 'Simulation Stream (ESP32 Ready)'}
              </span>
            </div>

            <button 
              onClick={() => setShowHardwareDrawer(!showHardwareDrawer)}
              className="btn-hardware-help"
              title="ESP32 Wi-Fi & Serial Configuration"
            >
              <Wifi size={14} />
              <span>ESP32 Setup</span>
            </button>

            {/* PostgreSQL DB History & Status Button */}
            <button 
              onClick={() => setShowDbHistory(!showDbHistory)}
              className="btn-hardware-help"
              title="Local PostgreSQL DB Connection & History"
              style={{
                background: dbStatus?.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: dbStatus?.connected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                color: dbStatus?.connected ? '#34d399' : '#f87171'
              }}
            >
              <Database size={14} />
              <span>{dbStatus?.connected ? `Postgres (${dbStatus?.total_detections_stored ?? 0} Saved)` : 'Postgres Offline'}</span>
            </button>
          </div>
        </div>

        {/* Action Row with Detect Button */}
        <div className="ml-action-row">
          <button 
            id="detect-risk-button"
            className="btn-detect" 
            onClick={handleDetect}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <>
                <RefreshCw size={18} className="phone-ring-icon" />
                <span>Running ML Inference...</span>
              </>
            ) : (
              <>
                <Zap size={18} />
                <span>Detect Health Risk</span>
              </>
            )}
          </button>

          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Click <strong>Detect</strong> to analyze current sensor vitals with the Random Forest model. If risk is abnormal (≥50%), Twilio emergency call triggers automatically.
          </span>
        </div>

        {/* Hardware Setup / Test Drawer */}
        {showHardwareDrawer && (
          <div className="hardware-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wifi size={16} color="var(--primary-light)" /> ESP32 Real-Time Hardware Connectivity
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Firmware: esp32_firmware/SwastyaConnect_ESP32.ino</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {/* Option A: Wi-Fi HTTP POST */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>
                  📡 Method 1: Wi-Fi HTTP Ingestion
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  Program your ESP32 to HTTP POST JSON telemetry to:
                </p>
                <code style={{ display: 'block', background: '#0a0f1d', padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem', color: '#38bdf8', marginBottom: 8, wordBreak: 'break-all' }}>
                  http://[YOUR_LAPTOP_IP]:8000/api/sensors/ingest
                </code>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => handleInjectESP32Packet('normal')}
                    style={{ flex: 1, padding: '6px 10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Test Normal ESP32 Packet
                  </button>
                  <button 
                    onClick={() => handleInjectESP32Packet('abnormal')}
                    style={{ flex: 1, padding: '6px 10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Test Critical ESP32 Packet
                  </button>
                </div>
              </div>

              {/* Option B: USB Cable Serial */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>
                  🔌 Method 2: USB Serial COM Cable
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 8 }}>
                  Plug ESP32 via USB and select the COM port:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select 
                    value={selectedPort} 
                    onChange={(e) => setSelectedPort(e.target.value)}
                    style={{ flex: 1, background: '#0a0f1d', border: '1px solid var(--border-subtle)', color: '#f8fafc', padding: '6px 10px', borderRadius: 6, fontSize: '0.78rem' }}
                  >
                    {serialPorts.length === 0 ? (
                      <option value="">No COM ports detected</option>
                    ) : (
                      serialPorts.map(p => (
                        <option key={p.port} value={p.port}>{p.port} - {p.description}</option>
                      ))
                    )}
                  </select>
                  <button 
                    onClick={handleToggleSerial}
                    disabled={serialConnecting || (!selectedPort && !hardwareStatus?.serial_status?.connected)}
                    style={{ 
                      padding: '6px 14px', 
                      background: hardwareStatus?.serial_status?.connected ? 'rgba(239, 68, 68, 0.3)' : 'var(--primary)', 
                      border: 'none', 
                      color: 'white', 
                      borderRadius: 6, 
                      fontSize: '0.78rem', 
                      fontWeight: 700, 
                      cursor: 'pointer' 
                    }}
                  >
                    {hardwareStatus?.serial_status?.connected ? 'Disconnect' : serialConnecting ? 'Connecting...' : 'Connect USB'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ML Inference Result Display */}
        {mlResult && (
          <div className={`ml-result-box ${mlResult.is_abnormal ? 'abnormal' : 'normal'}`}>
            <div className="ml-result-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                    ML Risk Score
                  </div>
                  <div className={`ml-score-badge ${mlResult.is_abnormal ? 'abnormal' : 'normal'}`}>
                    <span>{mlResult.risk_score}%</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>/ 100</span>
                  </div>
                </div>

                <div className={`ml-status-pill ${mlResult.is_abnormal ? 'abnormal' : 'normal'}`}>
                  {mlResult.is_abnormal ? `🚨 Abnormal (${mlResult.risk_level})` : `✅ Normal (${mlResult.risk_level})`}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                <div><strong>Model:</strong> {mlResult.model_type}</div>
                <div><strong>Confidence:</strong> {mlResult.is_abnormal ? `${mlResult.high_risk_prob}% High Risk` : `${mlResult.low_risk_prob}% Low Risk`}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Analyzed: {new Date(mlResult.timestamp * 1000).toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Vitals Snapshot at moment of detection */}
            <div className="ml-vitals-snapshot">
              <div className="snapshot-item">
                <span className="snapshot-label">Heart Rate</span>
                <span className="snapshot-value" style={{ color: '#ef4444' }}>{mlResult.vitals_analyzed.hr} BPM</span>
              </div>
              <div className="snapshot-item">
                <span className="snapshot-label">Blood Oxygen</span>
                <span className="snapshot-value" style={{ color: '#0284c7' }}>{mlResult.vitals_analyzed.spo2}%</span>
              </div>
              <div className="snapshot-item">
                <span className="snapshot-label">Temperature</span>
                <span className="snapshot-value" style={{ color: '#f59e0b' }}>{mlResult.vitals_analyzed.temp}°C</span>
              </div>
              <div className="snapshot-item">
                <span className="snapshot-label">GSR Conductance</span>
                <span className="snapshot-value" style={{ color: '#10b981' }}>{mlResult.vitals_analyzed.gsr} µS</span>
              </div>
            </div>

            {/* PostgreSQL Saved Record Confirmation */}
            {mlResult.db_saved ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 6,
                fontSize: '0.8rem',
                color: '#38bdf8',
                marginBottom: 10
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={14} />
                  <span><strong>Stored in PostgreSQL:</strong> Detection #{mlResult.db_record_id} saved to <code>health_risk_detections</code></span>
                </span>
                <button 
                  onClick={() => setShowDbHistory(true)}
                  style={{ background: 'none', border: 'none', color: '#7dd3fc', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                >
                  View Records ({dbStatus?.total_detections_stored || dbHistory.length}) →
                </button>
              </div>
            ) : mlResult.db_message ? (
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginBottom: 8 }}>
                DB Notice: {mlResult.db_message}
              </div>
            ) : null}

            {/* Outbound Voice Call Dispatch Banner */}
            {mlResult.call_dispatched ? (
              <div className="call-dispatch-banner">
                <div className="call-info-left">
                  <PhoneCall size={28} className="phone-ring-icon" />
                  <div className="call-info-text">
                    <strong>🚨 Automated Emergency Phone Call Placed via Twilio!</strong>
                    <span>Dialing emergency contact ({mlResult.call_recipient}) with synthetic voice vitals dispatch.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="call-sid-badge">
                    SID: {mlResult.call_sid || 'IN_PROGRESS'}
                  </span>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.4)', padding: '4px 10px', borderRadius: 6, fontWeight: 700, color: '#fecaca' }}>
                    {mlResult.call_status || 'IN_PROGRESS'}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.86rem',
                color: '#6ee7b7'
              }}>
                <CheckCircle2 size={20} color="#10b981" />
                <span>{mlResult.message}</span>
              </div>
            )}
          </div>
        )}

        {/* PostgreSQL Detection History Drawer */}
        {showDbHistory && (
          <div className="db-history-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={16} color="var(--primary-light)" />
                Local PostgreSQL Database ({dbStatus?.database || 'postgres'} on port {dbStatus?.port || 5433})
              </strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Table: <code>health_risk_detections</code> ({dbStatus?.total_detections_stored || dbHistory.length} total rows)
                </span>
                <button 
                  onClick={refreshDb}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '3px 8px', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.72rem' }}
                  title="Refresh records"
                >
                  Refresh
                </button>
                <button 
                  onClick={() => setShowDbHistory(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {dbHistory.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No detection records stored in PostgreSQL yet. Press <strong>"Detect Health Risk"</strong> above to evaluate vitals and store a record.
              </div>
            ) : (
              <div className="db-history-table-container">
                <table className="db-history-table">
                  <thead>
                    <tr>
                      <th>#ID</th>
                      <th>Recorded At</th>
                      <th>Heart Rate</th>
                      <th>Blood Oxygen</th>
                      <th>Skin Temp</th>
                      <th>GSR</th>
                      <th>Risk Score</th>
                      <th>Classification</th>
                      <th>Emergency Call</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbHistory.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>#{row.id}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.formatted_time || new Date(row.timestamp * 1000).toLocaleTimeString()}</td>
                        <td style={{ color: row.hr < 50 || row.hr > 100 ? '#ef4444' : '#f8fafc' }}>{row.hr?.toFixed(0)} BPM</td>
                        <td style={{ color: row.spo2 < 95 ? '#ef4444' : '#f8fafc' }}>{row.spo2?.toFixed(0)}%</td>
                        <td>{row.temp?.toFixed(1)}°C</td>
                        <td>{row.gsr?.toFixed(1)} µS</td>
                        <td>
                          <span style={{ 
                            fontWeight: 700, 
                            color: row.risk_score >= 50 ? '#ef4444' : '#10b981',
                            background: row.risk_score >= 50 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            {row.risk_score?.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: row.is_abnormal ? '#fca5a5' : '#86efac' }}>
                            {row.risk_level}
                          </span>
                        </td>
                        <td>
                          {row.call_dispatched ? (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.3)', color: '#fecaca', padding: '2px 6px', borderRadius: 4 }}>
                              📞 Dispatched
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. REAL-TIME VITALS GRID */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
        Real-Time Physiological Telemetry
      </h3>

      <div className="grid-4">
        {/* Heart Rate */}
        <div className="glass-panel vital-card">
          <div className="vital-card-header">
            <span className="vital-title">
              <Heart size={16} color="#ef4444" /> Heart Rate
            </span>
            <span className={`deviation-badge ${vitals?.hr === 0 ? 'elevated' : Math.abs(riskAnalysis?.hr_deviation_pct || 0) > 30 ? 'critical' : Math.abs(riskAnalysis?.hr_deviation_pct || 0) > 15 ? 'elevated' : 'normal'}`}>
              {vitals?.hr === 0 ? 'Place Finger' : (riskAnalysis?.hr_deviation_pct >= 0 ? `+${riskAnalysis?.hr_deviation_pct}%` : `${riskAnalysis?.hr_deviation_pct}%`)}
            </span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals?.hr === 0 ? '0' : Math.round(vitals?.hr ?? 72)}</span>
            <span className="vital-unit">BPM</span>
          </div>
          <SparklineChart data={hrSeries} color="#ef4444" height={36} minVal={0} maxVal={160} />
          <div className="vital-baseline-ref">
            <span>{vitals?.hr === 0 ? 'Waiting for finger contact...' : `Normal: ${Math.round(baseline?.hr_min || 60)}–${Math.round(baseline?.hr_max || 84)} BPM`}</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="glass-panel vital-card">
          <div className="vital-card-header">
            <span className="vital-title">
              <Wind size={16} color="#0284c7" /> Blood Oxygen (SpO₂)
            </span>
            <span className={`deviation-badge ${vitals?.spo2 === 0 ? 'elevated' : (vitals?.spo2 ?? 98) < 92 ? 'critical' : (vitals?.spo2 ?? 98) < 95 ? 'elevated' : 'normal'}`}>
              {vitals?.spo2 === 0 ? 'Place Finger' : ((vitals?.spo2 ?? 98) >= 95 ? 'Normal' : 'Low')}
            </span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals?.spo2 === 0 ? '0' : Math.round(vitals?.spo2 ?? 98)}</span>
            <span className="vital-unit">%</span>
          </div>
          <SparklineChart data={spo2Series} color="#0284c7" height={36} minVal={0} maxVal={100} />
          <div className="vital-baseline-ref">
            <span>{vitals?.spo2 === 0 ? 'Waiting for finger contact...' : `Normal: ≥${Math.round(baseline?.spo2_min || 95)}%`}</span>
          </div>
        </div>

        {/* Skin Temperature */}
        <div className="glass-panel vital-card">
          <div className="vital-card-header">
            <span className="vital-title">
              <Thermometer size={16} color="#f59e0b" /> Skin Temperature
            </span>
            <span className={`deviation-badge ${vitals?.temp_sensor_disconnected ? 'elevated' : (riskAnalysis?.temp_deviation_deg || 0) > 1.2 ? 'critical' : (riskAnalysis?.temp_deviation_deg || 0) > 0.5 ? 'elevated' : 'normal'}`}>
              {vitals?.temp_sensor_disconnected ? 'Check Wire (-127°C)' : (riskAnalysis?.temp_deviation_deg >= 0 ? `+${riskAnalysis?.temp_deviation_deg}°C` : `${riskAnalysis?.temp_deviation_deg}°C`)}
            </span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{(vitals?.skin_temp !== undefined ? vitals.skin_temp : 36.6).toFixed(1)}</span>
            <span className="vital-unit">°C</span>
          </div>
          <SparklineChart data={tempSeries} color="#f59e0b" height={36} minVal={20} maxVal={42} />
          <div className="vital-baseline-ref">
            <span>
              {vitals?.temp_sensor_disconnected 
                ? 'DS18B20 wire loose / check 4.7kΩ pullup' 
                : `Live Sensor: ${(vitals?.skin_temp !== undefined ? vitals.skin_temp : 36.6).toFixed(1)}°C`}
            </span>
          </div>
        </div>


        {/* GSR */}
        <div className="glass-panel vital-card">
          <div className="vital-card-header">
            <span className="vital-title">
              <Droplet size={16} color="#10b981" /> GSR Conductance
            </span>
            <span className={`deviation-badge ${(vitals?.gsr || 4.5) > 12 ? 'critical' : (vitals?.gsr || 4.5) > 7 ? 'elevated' : 'normal'}`}>
              {(vitals?.gsr || 4.5) > 10 ? 'High Stress' : 'Baseline'}
            </span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{(vitals?.gsr !== undefined ? vitals.gsr : 4.5).toFixed(1)}</span>
            <span className="vital-unit">µS</span>
          </div>
          <SparklineChart data={gsrSeries} color="#10b981" height={36} minVal={0} maxVal={25} />
          <div className="vital-baseline-ref">
            <span>Live Sensor: {(vitals?.gsr !== undefined ? vitals.gsr : 4.5).toFixed(1)} µS</span>
          </div>
        </div>
      </div>

      {/* 4. SUB-RISK ENGINES OVERVIEW */}

      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
        Multi-Sensor Risk Engines
      </h3>
      <div className="grid-4">
        {/* Heat Stress */}
        <div className="glass-panel" style={{ padding: 18, cursor: 'pointer' }} onClick={() => onNavigate('risks')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={16} color="#f97316" /> Heat Stress
            </span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(riskAnalysis?.heat_stress_risk || 0)}/100</span>
          </div>
          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.heat_stress_level || 'LOW'}`} style={{ width: `${riskAnalysis?.heat_stress_risk || 0}%` }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: {riskAnalysis?.heat_stress_level || 'LOW'}</div>
        </div>

        {/* Respiratory Risk */}
        <div className="glass-panel" style={{ padding: 18, cursor: 'pointer' }} onClick={() => onNavigate('risks')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wind size={16} color="#38bdf8" /> Respiratory Risk
            </span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(riskAnalysis?.respiratory_risk || 0)}/100</span>
          </div>
          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.respiratory_level || 'LOW'}`} style={{ width: `${riskAnalysis?.respiratory_risk || 0}%` }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: {riskAnalysis?.respiratory_level || 'LOW'}</div>
        </div>

        {/* Cardio Stress */}
        <div className="glass-panel" style={{ padding: 18, cursor: 'pointer' }} onClick={() => onNavigate('risks')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={16} color="#ef4444" /> Cardio Stress
            </span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(riskAnalysis?.cardiovascular_stress || 0)}/100</span>
          </div>
          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.cardiovascular_level || 'LOW'}`} style={{ width: `${riskAnalysis?.cardiovascular_stress || 0}%` }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: {riskAnalysis?.cardiovascular_level || 'LOW'}</div>
        </div>

        {/* Fatigue Risk */}
        <div className="glass-panel" style={{ padding: 18, cursor: 'pointer' }} onClick={() => onNavigate('risks')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Droplet size={16} color="#8b5cf6" /> Fatigue Risk
            </span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(riskAnalysis?.fatigue_risk || 0)}/100</span>
          </div>
          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.fatigue_level || 'LOW'}`} style={{ width: `${riskAnalysis?.fatigue_risk || 0}%` }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: {riskAnalysis?.fatigue_level || 'LOW'}</div>
        </div>
      </div>
    </div>
  );
}
