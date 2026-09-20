import React, { useState } from 'react';
import { Lock, ShieldCheck, HardDrive, Cpu, CloudOff, Globe, EyeOff, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function PrivacyDashboard() {
  const [profile, setProfile] = useState(storageService.getProfile());

  const handleToggleCloudSync = () => {
    const updated = { ...profile, cloudSyncOptIn: !profile.cloudSyncOptIn };
    setProfile(updated);
    storageService.saveProfile(updated);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Privacy Architecture: "Your Health Data Stays With You"
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          SwastyaConnect is engineered with an uncompromising privacy-first and edge-native architecture. Raw physiological telemetry is analyzed locally on your device.
        </p>
      </div>

      {/* 4 Core Pillars */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="glass-panel" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <HardDrive size={26} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Wearable Telemetry</h4>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.9rem', marginBottom: 8 }}>Processed 100% Locally</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Raw HR, SpO₂, Skin Temperature, and GSR are parsed inside the local application sandbox.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <Cpu size={26} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>AI Risk Inference</h4>
          <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', marginBottom: 8 }}>On-Device / Edge Model</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Multi-sensor risk engine and baseline calculations run locally without cloud dependency.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <CloudOff size={26} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Cloud Sync</h4>
          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.9rem', marginBottom: 8 }}>Strictly Opt-In</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Disabled by default. No background telemetry leakage or third-party ad profiling.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <EyeOff size={26} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Emergency Sharing</h4>
          <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.9rem', marginBottom: 8 }}>User-Controlled</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Location and vitals payloads are transmitted only upon unacknowledged SOS or manual trigger.
          </p>
        </div>
      </div>

      {/* Cloud Sync Opt-In Control */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Optional Encrypted Cloud Backup & Multi-Device Sync
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              When enabled, only end-to-end encrypted daily summaries are backed up. Raw sensor streams remain strictly local.
            </p>
          </div>

          <button
            onClick={handleToggleCloudSync}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: profile.cloudSyncOptIn ? '#10b981' : '#334155',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            {profile.cloudSyncOptIn ? 'CLOUD SYNC: ACTIVE' : 'CLOUD SYNC: DISABLED (RECOMMENDED)'}
          </button>
        </div>
      </div>

      {/* Detailed Technical Privacy Guarantees */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} color="#10b981" /> Technical Privacy Guarantees
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 3 }} />
            <span><strong>Zero Raw Telemetry Transmission:</strong> High-frequency sensor samples (1Hz PPG, Thermistor, GSR ADC) never leave the local device boundary.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 3 }} />
            <span><strong>Full Offline Health Engine:</strong> Loss of network connectivity does not degrade risk assessments, baseline tracking, or local audio alarms.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 3 }} />
            <span><strong>Granular Data Retention:</strong> All historical health telemetry is stored locally in client-side storage and can be completely wiped with a single click in Profile settings.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
