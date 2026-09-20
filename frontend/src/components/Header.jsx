import React from 'react';
import { Activity, ShieldAlert, Wifi, WifiOff, Radio } from 'lucide-react';

export default function Header({ isOnline, onTriggerSOS, signalQuality = 98 }) {
  return (
    <header className="header-bar">
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Activity size={24} />
        </div>
        <div>
          <span className="brand-name">SwastyaConnect</span>
        </div>
        <span className="brand-badge">AI Health Companion</span>
      </div>

      <div className="header-status-group">
        <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? (
            <>
              <span className="pulse-dot" />
              <Wifi size={14} />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>📴 Offline Mode (Edge AI Active)</span>
            </>
          )}
        </div>

        <div className="status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
          <Radio size={14} color="#38bdf8" />
          <span>SQI: {signalQuality}%</span>
        </div>

        <button 
          className="btn-header-sos"
          onClick={onTriggerSOS}
          title="Trigger Emergency SOS Workflow"
        >
          <ShieldAlert size={16} />
          <span>EMERGENCY SOS</span>
        </button>
      </div>
    </header>
  );
}
