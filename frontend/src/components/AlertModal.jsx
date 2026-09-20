import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  PhoneCall, 
  PhoneForwarded, 
  MessageSquare, 
  Radio, 
  Volume2, 
  VolumeX, 
  RotateCw,
  BellRing,
  PhoneOff
} from 'lucide-react';

export default function AlertModal({ alertState, onConfirmSafe, onTriggerSOS, onDismiss, vitals, profile }) {
  const [countdown, setCountdown] = useState(30);
  const [callState, setCallState] = useState('DIALING'); // DIALING, RINGING, CONNECTED, COMPLETED
  const [callDuration, setCallDuration] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const speechRef = useRef(null);

  // Auto-countdown when in USER_CONFIRMATION
  useEffect(() => {
    let timer;
    if (alertState?.current_stage === 'USER_CONFIRMATION') {
      setCountdown(30);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onTriggerSOS();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [alertState?.current_stage]);

  // When SOS is triggered, simulate active telephony call lifecycle & speak IVRS alert aloud
  useEffect(() => {
    let callTimer;
    let durationInterval;

    if (alertState?.current_stage === 'SOS_TRIGGERED') {
      setCallState('DIALING');
      setCallDuration(0);

      // Transition call states
      const ringTimeout = setTimeout(() => {
        setCallState('RINGING');
      }, 1500);

      const connectTimeout = setTimeout(() => {
        setCallState('CONNECTED');
        playIVRSSpeech();
        durationInterval = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      }, 3500);

      return () => {
        clearTimeout(ringTimeout);
        clearTimeout(connectTimeout);
        if (durationInterval) clearInterval(durationInterval);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      };
    }
  }, [alertState?.current_stage]);

  const playIVRSSpeech = () => {
    if ('speechSynthesis' in window && !isVoiceMuted) {
      window.speechSynthesis.cancel();
      const userName = profile?.name || 'User';
      const hr = Math.round(vitals?.hr || 138);
      const spo2 = Math.round(vitals?.spo2 || 88);
      const temp = (vitals?.skin_temp || 39.2).toFixed(1);

      const speechText = `Emergency alert from SwastyaConnect! Critical physiological distress has been automatically detected for ${userName}. Current heart rate is ${hr} beats per minute. Blood oxygen saturation is ${spo2} percent. Skin temperature is ${temp} degrees Celsius. Immediate medical response and verification is required.`;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMute = () => {
    if (isVoiceMuted) {
      setIsVoiceMuted(false);
      playIVRSSpeech();
    } else {
      setIsVoiceMuted(true);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  };

  if (!alertState || (alertState.current_stage !== 'USER_CONFIRMATION' && alertState.current_stage !== 'SOS_TRIGGERED')) {
    return null;
  }

  const isSOS = alertState.current_stage === 'SOS_TRIGGERED';
  const primaryContact = profile?.emergencyContacts?.[0] || { name: 'Dr. Sharma (Physician)', phone: '+91 98765 43210' };

  return (
    <div className="modal-overlay">
      <div className="sos-modal-card" style={{ maxWidth: 580, border: isSOS ? '2px solid #ef4444' : '2px solid #f59e0b' }}>
        {/* Header Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: isSOS ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSOS ? 'var(--risk-critical)' : 'var(--risk-mod)',
            boxShadow: isSOS ? '0 0 30px rgba(239, 68, 68, 0.5)' : 'none'
          }}>
            {isSOS ? <PhoneCall size={34} className="pulse-dot" /> : <BellRing size={34} />}
          </div>
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: 6, color: '#f8fafc' }}>
          {isSOS ? '🚨 AUTOMATIC EMERGENCY SOS DISPATCH' : '⚠️ HEALTH ANOMALY DETECTED'}
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
          {alertState.message}
        </p>

        {/* 1. Countdown Stage */}
        {!isSOS && (
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: 18, borderRadius: 12, marginBottom: 16, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Automatic IVRS & SMS Dispatch Countdown
            </div>
            <div className="sos-countdown-ring">{countdown}s</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              If you do not confirm within 30 seconds, SwastyaConnect will automatically initiate automated IVRS voice alert calls and SMS to your emergency network.
            </p>
          </div>
        )}

        {/* 2. Active SOS & Telephony Dispatch Monitor */}
        {isSOS && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18, textAlign: 'left' }}>
            {/* Live Outbound Call Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(15, 23, 42, 0.9))',
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontWeight: 800, fontSize: '0.92rem' }}>
                  <PhoneForwarded size={18} />
                  <span>OUTGOING AUTOMATED IVRS VOICE CALL</span>
                </div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: callState === 'CONNECTED' ? '#10b981' : '#f59e0b',
                  color: 'white'
                }}>
                  {callState === 'CONNECTED' ? `CONNECTED (00:${callDuration.toString().padStart(2, '0')})` : callState}
                </span>
              </div>

              <div style={{ fontSize: '0.84rem', color: '#f1f5f9', marginBottom: 6 }}>
                Recipient: <strong>{primaryContact.name}</strong> ({primaryContact.phone})
              </div>

              {callState === 'CONNECTED' && (
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  fontStyle: 'italic',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 8
                }}>
                  "🔊 Playing synthesized voice alert: Critical physiological distress detected for {profile?.name || 'User'} (HR: {Math.round(vitals?.hr || 138)} BPM, SpO₂: {Math.round(vitals?.spo2 || 88)}%, Temp: {(vitals?.skin_temp || 39.2).toFixed(1)}°C)..."
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={toggleMute}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  {isVoiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isVoiceMuted ? 'Unmute Audio Voice' : 'Mute Voice Simulation'}</span>
                </button>

                <button
                  onClick={playIVRSSpeech}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <RotateCw size={12} /> Replay Alert Audio
                </button>
              </div>
            </div>

            {/* Emergency SMS Delivery Card */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              padding: 14,
              borderRadius: 12,
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontWeight: 800, fontSize: '0.88rem', marginBottom: 6 }}>
                <MessageSquare size={16} />
                <span>EMERGENCY SMS DISPATCHED (DELIVERED)</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4, marginBottom: 10 }}>
                Sent to <strong>{primaryContact.name} ({primaryContact.phone})</strong> with vital metrics and {profile?.emergencyLocationSharing ? 'live GPS map link' : 'location privacy filter'}.
              </div>

              {/* Direct Phone / SMS Native Cellular Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <a
                  href={`tel:${primaryContact.phone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#10b981',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <PhoneCall size={14} /> Call {primaryContact.phone}
                </a>

                <a
                  href={`sms:${primaryContact.phone.replace(/[^0-9+]/g, '')}?body=🚨 [SwastyaConnect SOS Alert] Critical distress detected for ${profile?.name || 'User'}. HR: ${Math.round(vitals?.hr || 138)} BPM, SpO2: ${Math.round(vitals?.spo2 || 88)}%, Temp: ${(vitals?.skin_temp || 39.2).toFixed(1)}°C.`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#0284c7',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <MessageSquare size={14} /> Send SMS Directly
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="btn-group-modal">
          <button 
            className="btn-primary-action confirm-ok"
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onConfirmSafe();
            }}
          >
            <CheckCircle2 size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            I Am Okay / Cancel SOS
          </button>

          {!isSOS && (
            <button 
              className="btn-primary-action trigger-sos"
              onClick={onTriggerSOS}
            >
              <ShieldAlert size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Trigger SOS & IVRS Call Now
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
