import React from 'react';
import { 
  CloudLightning, 
  Flame, 
  Wind, 
  Waves, 
  Compass, 
  MapPin, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2,
  Database
} from 'lucide-react';

export default function DisasterView({ environment, onSelectDisaster }) {
  const disasterCards = [
    {
      id: 'NONE',
      title: 'Normal Conditions',
      region: 'Bengaluru, Karnataka',
      temp: '31.0°C',
      humidity: '50%',
      aqi: '80',
      status: 'NORMAL',
      desc: 'Typical seasonal weather. Physiological demands are standard.',
      protocol: 'Routine daily activities. Maintain standard hydration.'
    },
    {
      id: 'HEAT_WAVE',
      title: 'Severe Indian Heatwave',
      region: 'Nagpur / Rajasthan, Central India',
      temp: '44.5°C',
      humidity: '38%',
      aqi: '165',
      status: 'WARNING',
      desc: 'Extreme solar radiation and high ambient temperatures causing severe thermal strain.',
      protocol: 'Remain indoors during 11 AM – 4 PM peak heat. Hydrate with ORS electrolytes. Watch for heat exhaustion symptoms.'
    },
    {
      id: 'AIR_POLLUTION',
      title: 'Urban Smog Crisis',
      region: 'Delhi-NCR / Indo-Gangetic Plain',
      temp: '24.0°C',
      humidity: '70%',
      aqi: '385 (Severe)',
      status: 'WARNING',
      desc: 'High particulate matter (PM2.5) concentrations causing airway inflammation and oxygen desaturation.',
      protocol: 'Use N95 respirators outdoors. Operate indoor HEPA purifiers. Avoid outdoor cardio workouts.'
    },
    {
      id: 'FLOOD',
      title: 'Monsoon Urban Flood',
      region: 'Mumbai / Assam Inundation',
      temp: '28.0°C',
      humidity: '95%',
      aqi: '45',
      status: 'WATCH',
      desc: 'Severe monsoonal waterlogging. Risk of waterborne contamination and displacement.',
      protocol: 'Move to elevated ground. Avoid direct contact with floodwaters. Boil all drinking water.'
    },
    {
      id: 'CYCLONE',
      title: 'Tropical Cyclone Alert',
      region: 'Odisha / Andhra Pradesh Coast',
      temp: '27.5°C',
      humidity: '92%',
      aqi: '35',
      status: 'CRITICAL',
      desc: 'High gale winds and torrential coastal rainfall with storm surge risks.',
      protocol: 'Move to designated cyclone storm shelters. Keep emergency battery backups and non-perishable food ready.'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Disaster Intelligence & Indian Environmental Context
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          SwastyaConnect contextually fuses real-time meteorological conditions with your wearable vitals to provide disaster-aware early warnings for Indian environmental events.
        </p>
      </div>

      {/* Active Environmental Radar Card */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 28, borderLeft: '6px solid var(--primary-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={22} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {environment?.location_name || 'New Delhi, India'}
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Active State: <strong>{environment?.weather_condition}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: '0.84rem' }}>
              {environment?.is_cached ? (
                <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={14} /> Offline Cached Feed
                </span>
              ) : (
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} /> Live Environmental Feed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ambient Temperature</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>{environment?.ambient_temp?.toFixed(1)}°C</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Relative Humidity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>{Math.round(environment?.humidity || 50)}%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Air Quality Index (AQI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (environment?.aqi || 0) > 200 ? '#f87171' : '#f8fafc' }}>
              {environment?.aqi}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PM2.5 Fine Particulates</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>{environment?.pm25?.toFixed(1)} µg/m³</div>
          </div>
        </div>
      </div>

      {/* Indian Disaster Scenarios Selector */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: 14 }}>
        Indian Disaster Scenarios & Protocols
      </h3>
      <div className="grid-2">
        {disasterCards.map((card) => {
          const isCurrent = environment?.disaster_type === card.id;
          return (
            <div 
              key={card.id}
              className="glass-panel"
              style={{
                padding: 22,
                cursor: 'pointer',
                borderColor: isCurrent ? '#38bdf8' : 'var(--border-subtle)',
                background: isCurrent ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)'
              }}
              onClick={() => onSelectDisaster(card.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{card.title}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{card.region}</span>
                </div>
                {isCurrent && (
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: '#0284c7', color: 'white', fontSize: '0.72rem', fontWeight: 800 }}>
                    ACTIVE THREAT
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                {card.desc}
              </p>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: '0.8rem' }}>
                <strong style={{ color: '#38bdf8' }}>Action Protocol:</strong> {card.protocol}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Temp: {card.temp} | AQI: {card.aqi}</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Click to simulate this event →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
