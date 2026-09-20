import React, { useState } from 'react';
import { Sliders, Flame, Wind, BatteryWarning, AlertOctagon, Heart, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export default function DemoControlPanel({
  activeScenario,
  onSelectScenario,
  vitals,
  environment,
  onCustomVitalsChange,
  onCustomEnvChange
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const scenarios = [
    { id: 'SCENARIO_NORMAL', label: '1. Normal Baseline', icon: Heart },
    { id: 'SCENARIO_HEAT_STRESS', label: '2. Heat Stress', icon: Flame },
    { id: 'SCENARIO_POLLUTION', label: '3. Pollution Crisis', icon: Wind },
    { id: 'SCENARIO_FATIGUE', label: '4. Fatigue / Exertion', icon: BatteryWarning },
    { id: 'SCENARIO_CRITICAL_DISTRESS', label: '5. Multi-Vital Distress', icon: AlertOctagon }
  ];

  return (
    <div className="demo-control-dock">
      <div className="demo-control-inner">
        <div className="demo-title-tag">
          <Sliders size={16} />
          <span>DEMO CONTROLS (SIMULATED STREAM)</span>
        </div>

        <div className="scenario-btn-group">
          {scenarios.map((s) => {
            const Icon = s.icon;
            const isActive = activeScenario === s.id;
            return (
              <button
                key={s.id}
                className={`btn-scenario ${isActive ? 'active' : ''}`}
                onClick={() => onSelectScenario(s.id)}
              >
                <Icon size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                <span>{s.label}</span>
              </button>
            );
          })}

          <button
            className="btn-scenario"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span style={{ marginLeft: 4 }}>{isExpanded ? 'Hide Sliders' : 'Manual Dials'}</span>
          </button>
        </div>
      </div>

      {isExpanded && vitals && environment && (
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          maxWidth: 1400,
          margin: '16px auto 0 auto'
        }}>
          {/* HR Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Heart Rate (HR)</span>
              <strong>{Math.round(vitals.hr)} BPM</strong>
            </div>
            <input
              type="range"
              min="45"
              max="180"
              value={Math.round(vitals.hr)}
              onChange={(e) => onCustomVitalsChange({ ...vitals, hr: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#ef4444' }}
            />
          </div>

          {/* SpO2 Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Blood Oxygen (SpO₂)</span>
              <strong>{Math.round(vitals.spo2)}%</strong>
            </div>
            <input
              type="range"
              min="75"
              max="100"
              value={Math.round(vitals.spo2)}
              onChange={(e) => onCustomVitalsChange({ ...vitals, spo2: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#0284c7' }}
            />
          </div>

          {/* Skin Temp Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Skin Temperature</span>
              <strong>{vitals.skin_temp.toFixed(1)}°C</strong>
            </div>
            <input
              type="range"
              min="34.0"
              max="41.5"
              step="0.1"
              value={vitals.skin_temp}
              onChange={(e) => onCustomVitalsChange({ ...vitals, skin_temp: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
          </div>

          {/* GSR Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>GSR Conductance</span>
              <strong>{vitals.gsr.toFixed(1)} µS</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="30.0"
              step="0.5"
              value={vitals.gsr}
              onChange={(e) => onCustomVitalsChange({ ...vitals, gsr: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#10b981' }}
            />
          </div>

          {/* Ambient Temp */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Ambient Temp</span>
              <strong>{environment.ambient_temp.toFixed(1)}°C</strong>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              value={environment.ambient_temp}
              onChange={(e) => onCustomEnvChange({ ...environment, ambient_temp: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#f97316' }}
            />
          </div>

          {/* AQI Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Ambient AQI</span>
              <strong>{environment.aqi}</strong>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              value={environment.aqi}
              onChange={(e) => onCustomEnvChange({ ...environment, aqi: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: '#8b5cf6' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
