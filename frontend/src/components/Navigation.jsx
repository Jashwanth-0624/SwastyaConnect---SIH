import React from 'react';
import { 
  LayoutDashboard, 
  HeartPulse, 
  Flame, 
  BrainCircuit, 
  CloudLightning, 
  TrendingUp, 
  CalendarCheck, 
  ShieldAlert, 
  Lock, 
  User 
} from 'lucide-react';

export default function Navigation({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vitals', label: 'Real-Time Vitals', icon: HeartPulse },
    { id: 'risks', label: 'Risk Engines', icon: Flame },
    { id: 'insights', label: 'Explainable AI', icon: BrainCircuit },
    { id: 'disaster', label: 'Disaster Mode', icon: CloudLightning },
    { id: 'trends', label: 'Health Trends', icon: TrendingUp },
    { id: 'summary', label: 'Daily Summary', icon: CalendarCheck },
    { id: 'emergency', label: 'Emergency / SOS', icon: ShieldAlert },
    { id: 'privacy', label: 'Privacy & Edge', icon: Lock },
    { id: 'profile', label: 'Profile & Mode', icon: User }
  ];

  return (
    <nav className="nav-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
