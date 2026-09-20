import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  Lock, 
  AlertTriangle,
  Radio
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';

export default function EmergencyView({ riskAnalysis, vitals, onTriggerSOS }) {
  const [profile, setProfile] = useState(storageService.getProfile());
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('Family');
  const [showAddForm, setShowAddForm] = useState(false);
  const [alertState, setAlertState] = useState(null);

  useEffect(() => {
    async function checkState() {
      const st = await apiService.getAlertState();
      setAlertState(st);
    }
    checkState();
  }, []);

  const handleToggleLocationSharing = () => {
    const updated = { ...profile, emergencyLocationSharing: !profile.emergencyLocationSharing };
    setProfile(updated);
    storageService.saveProfile(updated);
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newContact = {
      id: 'ec_' + Date.now(),
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRole,
      isPrimary: profile.emergencyContacts.length === 0
    };

    const updated = {
      ...profile,
      emergencyContacts: [...profile.emergencyContacts, newContact]
    };

    setProfile(updated);
    storageService.saveProfile(updated);
    apiService.updateUserProfile(updated);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddForm(false);
  };

  const handleDeleteContact = (id) => {
    const updated = {
      ...profile,
      emergencyContacts: profile.emergencyContacts.filter(c => c.id !== id)
    };
    setProfile(updated);
    storageService.saveProfile(updated);
    apiService.updateUserProfile(updated);
  };


  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Emergency Assistance & SOS Architecture
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          SwastyaConnect employs an intelligent false-positive reduced escalation state machine: Anomaly → Warning → High Risk → User Confirmation Countdown → SOS Dispatch.
        </p>
      </div>

      <div className="grid-2">
        {/* Active SOS Trigger Card */}
        <div className="glass-panel" style={{ padding: 24, borderLeft: '6px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <ShieldAlert size={28} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Emergency SOS Dispatcher
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Status: <strong>{alertState?.current_stage || 'STANDBY (MONITORING)'}</strong>
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            In the event of severe, sustained multi-sensor physiological distress (e.g. concurrent hyperthermia, hypoxia, tachycardia), SwastyaConnect opens an interactive confirmation countdown before dispatching structured telemetry to your emergency network.
          </p>

          <button
            className="btn-primary-action trigger-sos"
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem', marginBottom: 16 }}
            onClick={onTriggerSOS}
          >
            <Radio size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            TRIGGER MANUAL EMERGENCY SOS
          </button>

          {/* Privacy-Preserving Payload Preview */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
              Sample Emergency Dispatch Message:
            </div>
            <div style={{ color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.5 }}>
              "SwastyaConnect detected a possible physiological distress event for {profile.name} (Risk: {riskAnalysis?.overall_level || 'ELEVATED'}). Vitals: HR {Math.round(vitals?.hr || 72)} BPM, SpO₂ {Math.round(vitals?.spo2 || 98)}%, Temp {(vitals?.skin_temp || 36.6).toFixed(1)}°C. {profile.emergencyLocationSharing ? 'Location: Shared (28.6139° N, 77.2090° E).' : 'Location: Not shared by user privacy choice.'}"
            </div>
          </div>
        </div>

        {/* Emergency Location & Privacy Sharing Settings */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <MapPin size={24} color="#38bdf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              Emergency Location Sharing (Opt-in)
            </h3>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            To protect your privacy, GPS location sharing is <strong>OFF by default</strong>. When enabled, your approximate GPS coordinates are ONLY attached to emergency SOS payloads sent to designated contacts.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.03)',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                Emergency GPS Location Sharing
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {profile.emergencyLocationSharing ? 'Enabled (Coordinates included in SOS)' : 'Disabled (Zero location data transmitted)'}
              </div>
            </div>

            <button
              onClick={handleToggleLocationSharing}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: profile.emergencyLocationSharing ? '#10b981' : '#334155',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {profile.emergencyLocationSharing ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Emergency Escalation Flow Breakdown */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>
              Escalation Pipeline Architecture:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>1. <strong>Normal:</strong> Baseline continuous monitoring.</div>
              <div>2. <strong>Anomaly Detected:</strong> Requires 3 consecutive windows to reject transient noise.</div>
              <div>3. <strong>High Risk / Moderate:</strong> User alert notification with rest guidance.</div>
              <div>4. <strong>User Confirmation:</strong> 30-second audible & visual countdown.</div>
              <div>5. <strong>Emergency SOS:</strong> Dispatched if user is unresponsive or clicks SOS.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts Manager */}
      <div className="glass-panel" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={22} color="#10b981" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              Designated Emergency Contacts & Caregivers
            </h3>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: '#0284c7',
              border: 'none',
              borderRadius: 6,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} /> Add Contact
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddContact} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 10, marginBottom: 18 }}>
            <input
              type="text"
              placeholder="Contact Name (e.g. Dr. Ramesh)"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 6, background: '#1e293b', border: '1px solid var(--border-subtle)', color: 'white' }}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (+91 ...)"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 6, background: '#1e293b', border: '1px solid var(--border-subtle)', color: 'white' }}
              required
            />
            <select
              value={newContactRole}
              onChange={(e) => setNewContactRole(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 6, background: '#1e293b', border: '1px solid var(--border-subtle)', color: 'white' }}
            >
              <option value="Doctor">Doctor / Physician</option>
              <option value="Family">Family Member</option>
              <option value="Caregiver">Designated Caregiver</option>
              <option value="Emergency Responder">Emergency Responder</option>
            </select>
            <button
              type="submit"
              style={{ padding: '10px 18px', background: '#10b981', border: 'none', borderRadius: 6, color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              Save Contact
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profile.emergencyContacts.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
                padding: '16px 20px',
                borderRadius: 10,
                background: c.isPrimary ? 'rgba(56, 189, 248, 0.06)' : 'rgba(255,255,255,0.03)',
                border: c.isPrimary ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.02rem' }}>{c.name}</span>
                  <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                    {c.relationship}
                  </span>
                  {c.isPrimary && (
                    <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
                      ⭐ Primary Recipient
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600 }}>{c.phone}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                {/* 1. Trigger Twilio Cloud IVRS Call to THIS contact */}
                <button
                  onClick={async () => {
                    await apiService.dispatchIVRSCall(c.name, c.phone);
                    alert(`✅ Outbound Twilio IVRS Voice Call initiated to ${c.name} (${c.phone})!`);
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#fca5a5',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Trigger Twilio Automated Voice Call to this number"
                >
                  <PhoneCall size={13} /> Twilio Call
                </button>

                {/* 2. Trigger Twilio SMS to THIS contact */}
                <button
                  onClick={async () => {
                    await apiService.dispatchSMS(c.name, c.phone);
                    alert(`✅ Emergency SMS alert dispatched to ${c.name} (${c.phone})!`);
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    color: '#7dd3fc',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Trigger Twilio Emergency SMS to this number"
                >
                  <Radio size={13} /> Twilio SMS
                </button>

                {/* 3. Direct Phone Dialer (tel:) */}
                <a
                  href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    background: '#10b981',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Direct Cellular Call via Phone Link / OS Dialer"
                >
                  <PhoneCall size={13} /> OS Dialer
                </a>

                {!c.isPrimary && (
                  <button
                    onClick={() => {
                      const updatedContacts = profile.emergencyContacts.map(item => ({
                        ...item,
                        isPrimary: item.id === c.id
                      }));
                      const updatedProfile = { ...profile, emergencyContacts: updatedContacts };
                      setProfile(updatedProfile);
                      storageService.saveProfile(updatedProfile);
                      apiService.updateUserProfile(updatedProfile);
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: '#cbd5e1',
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                    title="Set as primary emergency recipient"
                  >
                    Set Primary
                  </button>
                )}

                <button
                  onClick={() => handleDeleteContact(c.id)}
                  style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 6 }}
                  title="Delete Contact"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* 4. Automated IVRS Voice & SMS Dispatch Audit & Test Console */}
      <div className="glass-panel" style={{ padding: 24, marginTop: 24, borderTop: '4px solid #38bdf8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PhoneCall size={22} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                Automated IVRS Voice & SMS Dispatch Engine
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Automatic Critical Distress Telephony Dispatch (Twilio / Webhook / TTS Audio)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={async () => {
                const primary = profile.emergencyContacts[0] || { name: 'Dr. Sharma', phone: '+91 98765 43210' };
                await apiService.dispatchIVRSCall(primary.name, primary.phone);
                alert(`Automated IVRS voice call alert initiated to ${primary.name} (${primary.phone})!`);
              }}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <PhoneCall size={14} /> Test IVRS Call
            </button>

            <button
              onClick={async () => {
                const primary = profile.emergencyContacts[0] || { name: 'Dr. Sharma', phone: '+91 98765 43210' };
                await apiService.dispatchSMS(primary.name, primary.phone);
                alert(`Emergency SMS alert notification sent to ${primary.name} (${primary.phone})!`);
              }}
              style={{
                padding: '8px 16px',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                color: '#7dd3fc',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Radio size={14} /> Test Emergency SMS
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
          <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
            Automated Critical Anomaly Trigger Logic:
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
            Whenever the multi-sensor risk engine detects sustained <strong>CRITICAL</strong> physiological stress (e.g. extreme heat exhaustion, acute desaturation, or multi-vital distress), the 30-second user confirmation prompt is launched. If unanswered or when SOS is triggered, SwastyaConnect <strong>automatically executes an outbound IVRS synthetic voice call and dispatches SMS alerts</strong> with real-time vital telemetry.
          </p>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>✓ Telephony Protocol: Twilio Voice TwiML / TTS</span>
            <span>✓ SMS Protocol: Structured SOS Payload</span>
            <span>✓ Privacy Filter: User-Controlled GPS Coordinates</span>
          </div>
        </div>
      </div>
    </div>
  );
}

