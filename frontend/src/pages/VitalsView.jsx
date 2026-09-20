import React from 'react';
import { Heart, Wind, Thermometer, Droplet, CheckCircle, AlertTriangle, Activity, Shield } from 'lucide-react';
import SparklineChart from '../components/SparklineChart';

export default function VitalsView({ vitals, baseline, riskAnalysis, history }) {
  const hrSeries = history.map(h => h.hr || 72);
  const spo2Series = history.map(h => h.spo2 || 98);
  const tempSeries = history.map(h => h.skin_temp || 36.6);
  const gsrSeries = history.map(h => h.gsr || 4.5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Real-Time Sensor Telemetry & Personal Baselines
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Direct physiological feeds from existing wearable hardware (Heart Rate, SpO₂, Skin Temperature, GSR) mapped against your dynamically learned baseline ranges ("Your Normal").
        </p>
      </div>

      <div className="grid-2">
        {/* Heart Rate Deep Dive */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>
                <Heart size={20} /> Heart Rate (HR)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Continuous Optical PPG Feed</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f8fafc', lineHeight: 1 }}>
                {Math.round(vitals?.hr || 72)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>BPM</span>
              </div>
              <span className={`deviation-badge ${Math.abs(riskAnalysis?.hr_deviation_pct || 0) > 30 ? 'critical' : Math.abs(riskAnalysis?.hr_deviation_pct || 0) > 15 ? 'elevated' : 'normal'}`}>
                {riskAnalysis?.hr_deviation_pct >= 0 ? `+${riskAnalysis?.hr_deviation_pct}% vs baseline` : `${riskAnalysis?.hr_deviation_pct}% vs baseline`}
              </span>
            </div>
          </div>

          <SparklineChart data={hrSeries} color="#ef4444" height={60} minVal={50} maxVal={160} />

          <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
              Personal Baseline Comparison:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Your Mean Baseline: <strong>{baseline?.hr_baseline || 72} BPM</strong></span>
              <span>Learned Normal Range: <strong>{Math.round(baseline?.hr_min || 60)}–{Math.round(baseline?.hr_max || 84)} BPM</strong></span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              {vitals?.hr > (baseline?.hr_max || 84) 
                ? `⚠️ Current reading is ${Math.round(vitals?.hr - (baseline?.hr_baseline || 72))} BPM above your usual range.`
                : '✓ Current reading is within your established physiological baseline.'}
            </div>
          </div>
        </div>

        {/* Blood Oxygen / SpO2 Deep Dive */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                <Wind size={20} /> Blood Oxygen (SpO₂)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pulse Oximetry Telemetry</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f8fafc', lineHeight: 1 }}>
                {Math.round(vitals?.spo2 || 98)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>%</span>
              </div>
              <span className={`deviation-badge ${(vitals?.spo2 || 98) < 92 ? 'critical' : (vitals?.spo2 || 98) < 95 ? 'elevated' : 'normal'}`}>
                {(vitals?.spo2 || 98) >= 95 ? 'Normal Saturation' : 'Sub-Baseline Saturation'}
              </span>
            </div>
          </div>

          <SparklineChart data={spo2Series} color="#0284c7" height={60} minVal={80} maxVal={100} />

          <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
              Personal Baseline Comparison:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Your Mean Baseline: <strong>{baseline?.spo2_baseline || 98}%</strong></span>
              <span>Healthy Threshold: <strong>≥{baseline?.spo2_min || 95}%</strong></span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              {(vitals?.spo2 || 98) < 95 
                ? '⚠️ Blood oxygen saturation is below your normal baseline.'
                : '✓ Oxygen saturation is optimal.'}
            </div>
          </div>
        </div>

        {/* Skin Temperature Deep Dive */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>
                <Thermometer size={20} /> Skin Temperature
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Wearable Surface Thermistor</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f8fafc', lineHeight: 1 }}>
                {(vitals?.skin_temp || 36.6).toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>°C</span>
              </div>
              <span className={`deviation-badge ${(riskAnalysis?.temp_deviation_deg || 0) > 1.0 ? 'critical' : (riskAnalysis?.temp_deviation_deg || 0) > 0.5 ? 'elevated' : 'normal'}`}>
                {riskAnalysis?.temp_deviation_deg >= 0 ? `+${riskAnalysis?.temp_deviation_deg}°C delta` : `${riskAnalysis?.temp_deviation_deg}°C delta`}
              </span>
            </div>
          </div>

          <SparklineChart data={tempSeries} color="#f59e0b" height={60} minVal={34} maxVal={41} />

          <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
              Personal Baseline Comparison:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Your Mean Baseline: <strong>{(baseline?.skin_temp_baseline || 36.5).toFixed(1)}°C</strong></span>
              <span>Learned Normal Range: <strong>{(baseline?.skin_temp_min || 36.1).toFixed(1)}–{(baseline?.skin_temp_max || 37.1).toFixed(1)}°C</strong></span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Note: Sensor represents skin/peripheral temperature, which responds to ambient thermal load and exertion.
            </div>
          </div>
        </div>

        {/* GSR Deep Dive */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                <Droplet size={20} /> GSR Conductance
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Galvanic Skin Response (Electrodermal)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f8fafc', lineHeight: 1 }}>
                {(vitals?.gsr || 4.5).toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>µS</span>
              </div>
              <span className={`deviation-badge ${(vitals?.gsr || 4.5) > 12 ? 'critical' : (vitals?.gsr || 4.5) > 7 ? 'elevated' : 'normal'}`}>
                {(vitals?.gsr || 4.5) > 10 ? 'High Autonomic Arousal' : 'Resting Baseline'}
              </span>
            </div>
          </div>

          <SparklineChart data={gsrSeries} color="#10b981" height={60} minVal={1} maxVal={25} />

          <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
              Physiological Stress Marker:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Baseline Conductance: <strong>~{(baseline?.gsr_baseline || 4.5).toFixed(1)} µS</strong></span>
              <span>Current Status: <strong>{(vitals?.gsr || 4.5) > 10 ? 'Sympathetic Surge / Sweating' : 'Normal'}</strong></span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Note: GSR reflects sympathetic sweat gland activity and thermoregulatory conductance. It is used as a supporting physiological stress signal, not a stand-alone diagnostic.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
