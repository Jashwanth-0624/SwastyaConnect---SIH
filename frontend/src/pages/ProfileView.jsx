import React, { useState } from 'react';
import { User, Shield, Sliders, Bell, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function ProfileView({ onProfileUpdated }) {
  const [profile, setProfile] = useState(storageService.getProfile());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    storageService.saveProfile(profile);
    setSavedSuccess(true);
    if (onProfileUpdated) onProfileUpdated(profile);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all local health telemetry history? This action cannot be undone.')) {
      localStorage.removeItem('swastyaconnect_telemetry_history');
      alert('Local telemetry history cleared.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          User Profile & Vulnerability Configuration
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Personalize baseline prior parameters and activate specialized vulnerability modes for customized risk sensitivity.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Personal Demographics
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local Identity Profile</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Full Name / Alias
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid var(--border-subtle)', color: 'white' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Age Group
              </label>
              <select
                value={profile.ageGroup}
                onChange={(e) => setProfile({ ...profile, ageGroup: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid var(--border-subtle)', color: 'white' }}
              >
                <option value="YOUNG_ADULT">Young Adult (18–35)</option>
                <option value="ADULT">Adult (36–59)</option>
                <option value="ELDERLY">Senior / Elderly Citizen (60+)</option>
              </select>
            </div>
          </div>

          {/* VULNERABILITY-AWARE MODE */}
          <div style={{ marginBottom: 28, background: 'rgba(56, 189, 248, 0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Shield size={20} color="#38bdf8" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Vulnerability-Aware Operating Mode
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
              Adjusts risk scoring sensitivity multipliers to account for elevated physiological susceptibility during heat waves, pollution, and severe environmental stress.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { id: 'GENERAL', label: 'Standard / General', desc: 'Standard baseline tolerance.' },
                { id: 'ELDERLY', label: 'Elderly Citizen', desc: 'Enhanced sensitivity for thermal & cardiac strain.' },
                { id: 'OUTDOOR_WORKER', label: 'Outdoor Worker', desc: 'Active heat & smog exposure tracking.' },
                { id: 'DISASTER_RESPONDER', label: 'Disaster Responder', desc: 'High exertion & environmental hazard mode.' }
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setProfile({ ...profile, vulnerabilityMode: m.id })}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: profile.vulnerabilityMode === m.id ? '#0284c7' : 'rgba(255,255,255,0.03)',
                    border: profile.vulnerabilityMode === m.id ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    color: profile.vulnerabilityMode === m.id ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Sensitivity */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Alert & Notification Sensitivity
            </label>
            <select
              value={profile.alertSensitivity}
              onChange={(e) => setProfile({ ...profile, alertSensitivity: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid var(--border-subtle)', color: 'white' }}
            >
              <option value="LOW">Low Sensitivity (Only persistent critical events)</option>
              <option value="NORMAL">Standard Balanced (Recommended, false-positive filtered)</option>
              <option value="HIGH">High Sensitivity (Early anomaly warnings)</option>
            </select>
          </div>

          {savedSuccess && (
            <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 8, color: '#34d399', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <CheckCircle2 size={16} /> Profile and vulnerability settings saved locally.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button
              type="submit"
              style={{ padding: '12px 28px', background: '#0284c7', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
            >
              Save Profile Settings
            </button>

            <button
              type="button"
              onClick={handleClearHistory}
              style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 8, color: '#f87171', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={16} /> Wipe Local Health Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
