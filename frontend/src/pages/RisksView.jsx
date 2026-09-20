import React from 'react';
import { Flame, Wind, Activity, Droplet, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function RisksView({ riskAnalysis, environment }) {
  const heatScore = Math.round(riskAnalysis?.heat_stress_risk || 0);
  const respScore = Math.round(riskAnalysis?.respiratory_risk || 0);
  const cardioScore = Math.round(riskAnalysis?.cardiovascular_stress || 0);
  const fatigueScore = Math.round(riskAnalysis?.fatigue_risk || 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Context-Aware Multi-Sensor Risk Engines
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          SwastyaConnect transforms physiological sensor telemetry + ambient environmental context + personal baselines into 4 specialized health risk scores (0–100) using transparent, explainable feature weighting.
        </p>
      </div>

      <div className="grid-2">
        {/* 1. HEAT STRESS RISK ENGINE */}
        <div className="glass-panel risk-engine-card">
          <div className="risk-engine-header">
            <div className="risk-engine-title" style={{ color: '#f97316' }}>
              <Flame size={24} />
              <span>Heat Stress Risk Engine</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
              {heatScore}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>

          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.heat_stress_level || 'LOW'}`} style={{ width: `${heatScore}%` }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 14 }}>
            <span>Classification: <strong style={{ color: heatScore >= 60 ? 'var(--risk-high)' : 'var(--risk-low)' }}>{riskAnalysis?.heat_stress_level || 'LOW'}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>Ambient Heat Index: {environment?.ambient_temp}°C ({environment?.humidity}% RH)</span>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            <strong>Engine Inputs:</strong> Skin Temperature deviation (35%), HR thermal tachycardia (25%), GSR thermoregulatory sweating conductance (15%), Environmental Heat Index (25%).
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Contributing Observations:</div>
            {riskAnalysis?.contributing_factors?.filter(f => f.id.includes('temp') || f.id.includes('heat') || f.id.includes('gsr')).length > 0 ? (
              riskAnalysis.contributing_factors
                .filter(f => f.id.includes('temp') || f.id.includes('heat') || f.id.includes('gsr'))
                .map(f => (
                  <div key={f.id} className="factor-tag">
                    <span style={{ color: f.status === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--risk-high)' }}>●</span>
                    <span><strong>{f.name}:</strong> {f.description} ({f.contribution_pct}% factor weight)</span>
                  </div>
                ))
            ) : (
              <div className="factor-tag" style={{ color: 'var(--risk-low)' }}>
                ✓ No thermal or heat-strain abnormalities detected.
              </div>
            )}
          </div>
        </div>

        {/* 2. RESPIRATORY RISK ENGINE */}
        <div className="glass-panel risk-engine-card">
          <div className="risk-engine-header">
            <div className="risk-engine-title" style={{ color: '#38bdf8' }}>
              <Wind size={24} />
              <span>Respiratory Risk Engine</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
              {respScore}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>

          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.respiratory_level || 'LOW'}`} style={{ width: `${respScore}%` }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 14 }}>
            <span>Classification: <strong style={{ color: respScore >= 60 ? 'var(--risk-high)' : 'var(--risk-low)' }}>{riskAnalysis?.respiratory_level || 'LOW'}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>Ambient AQI: {environment?.aqi} (PM2.5: {environment?.pm25} µg/m³)</span>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            <strong>Engine Inputs:</strong> Pulse Oximetry SpO₂ desaturation (50%), Ambient AQI / PM2.5 particulate pollution (35%), Compensatory tachycardia (15%).
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Contributing Observations:</div>
            {riskAnalysis?.contributing_factors?.filter(f => f.id.includes('spo2') || f.id.includes('aqi') || f.id.includes('respiratory')).length > 0 ? (
              riskAnalysis.contributing_factors
                .filter(f => f.id.includes('spo2') || f.id.includes('aqi') || f.id.includes('respiratory'))
                .map(f => (
                  <div key={f.id} className="factor-tag">
                    <span style={{ color: f.status === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--risk-high)' }}>●</span>
                    <span><strong>{f.name}:</strong> {f.description} ({f.contribution_pct}% factor weight)</span>
                  </div>
                ))
            ) : (
              <div className="factor-tag" style={{ color: 'var(--risk-low)' }}>
                ✓ Normal oxygenation and acceptable ambient air quality.
              </div>
            )}
          </div>
        </div>

        {/* 3. CARDIOVASCULAR STRESS ENGINE */}
        <div className="glass-panel risk-engine-card">
          <div className="risk-engine-header">
            <div className="risk-engine-title" style={{ color: '#ef4444' }}>
              <Activity size={24} />
              <span>Cardiovascular Stress Engine</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
              {cardioScore}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>

          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.cardiovascular_level || 'LOW'}`} style={{ width: `${cardioScore}%` }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 14 }}>
            <span>Classification: <strong style={{ color: cardioScore >= 60 ? 'var(--risk-high)' : 'var(--risk-low)' }}>{riskAnalysis?.cardiovascular_level || 'LOW'}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>Deviation: {riskAnalysis?.hr_deviation_pct >= 0 ? `+${riskAnalysis?.hr_deviation_pct}%` : `${riskAnalysis?.hr_deviation_pct}%`} vs Baseline</span>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            <strong>Engine Inputs:</strong> Relative Heart Rate deviation from personal baseline, rate of acceleration, hypoxic cardiac compensation, and thermal cardiac load.
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Contributing Observations:</div>
            {riskAnalysis?.contributing_factors?.filter(f => f.id.includes('hr') || f.id.includes('cardio')).length > 0 ? (
              riskAnalysis.contributing_factors
                .filter(f => f.id.includes('hr') || f.id.includes('cardio'))
                .map(f => (
                  <div key={f.id} className="factor-tag">
                    <span style={{ color: f.status === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--risk-high)' }}>●</span>
                    <span><strong>{f.name}:</strong> {f.description}</span>
                  </div>
                ))
            ) : (
              <div className="factor-tag" style={{ color: 'var(--risk-low)' }}>
                ✓ Heart rate is operating smoothly within personal baseline bounds.
              </div>
            )}
          </div>
        </div>

        {/* 4. FATIGUE RISK ENGINE */}
        <div className="glass-panel risk-engine-card">
          <div className="risk-engine-header">
            <div className="risk-engine-title" style={{ color: '#a855f7' }}>
              <Droplet size={24} />
              <span>Fatigue & Recovery Risk Engine</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
              {fatigueScore}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>

          <div className="risk-progress-track">
            <div className={`risk-progress-bar ${riskAnalysis?.fatigue_level || 'LOW'}`} style={{ width: `${fatigueScore}%` }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 14 }}>
            <span>Classification: <strong style={{ color: fatigueScore >= 60 ? 'var(--risk-high)' : 'var(--risk-low)' }}>{riskAnalysis?.fatigue_level || 'LOW'}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>Exertion & Sympathetic Balance</span>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            <strong>Engine Inputs:</strong> Resting cardiac drift at low motion, sustained sympathetic electrodermal conductance (GSR), and thermal fatigue drift.
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Contributing Observations:</div>
            {riskAnalysis?.contributing_factors?.filter(f => f.id.includes('fatigue') || f.id.includes('gsr')).length > 0 ? (
              riskAnalysis.contributing_factors
                .filter(f => f.id.includes('fatigue') || f.id.includes('gsr'))
                .map(f => (
                  <div key={f.id} className="factor-tag">
                    <span style={{ color: 'var(--risk-mod)' }}>●</span>
                    <span><strong>{f.name}:</strong> {f.description}</span>
                  </div>
                ))
            ) : (
              <div className="factor-tag" style={{ color: 'var(--risk-low)' }}>
                ✓ Adequate physiological recovery; no sustained fatigue strain.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
