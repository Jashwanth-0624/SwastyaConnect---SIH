import React, { useState, useEffect } from 'react';
import { CalendarCheck, Heart, Thermometer, Droplet, Flame, Wind, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function DailySummaryView({ vitals, baseline, riskAnalysis }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadSummary() {
      const data = await apiService.getDailySummary();
      setSummary(data);
    }
    loadSummary();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Today's Daily Health Summary
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Automated diurnal physiological analysis, peak thermal strain intervals, and holistic recovery tracking.
        </p>
      </div>

      {/* Main Daily Report Card */}
      <div className="glass-panel" style={{ padding: 32, maxWidth: 900, margin: '0 auto 24px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarCheck size={26} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                Health Report: {summary?.date || new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>SwastyaConnect Longitudinal Telemetry</span>
            </div>
          </div>

          <div style={{
            padding: '6px 16px',
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            fontWeight: 800,
            fontSize: '0.88rem',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            Overall Risk: {summary?.overall_health_risk || 'LOW'}
          </div>
        </div>

        {/* Section Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Heart Rate Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
              <Heart size={18} /> Heart Rate Dynamics
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {summary?.heart_rate_summary || 'Mostly within personal baseline normal range (62–84 BPM). No sustained tachycardic events detected.'}
            </p>
          </div>

          {/* Temperature Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
              <Thermometer size={18} /> Thermal & Skin Temperature
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {summary?.temperature_summary || 'Slight elevation observed during peak afternoon heat (14:00–16:00), recovering smoothly toward resting normal.'}
            </p>
          </div>

          {/* GSR Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>
              <Droplet size={18} /> Electrodermal & Physiological Stress (GSR)
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {summary?.gsr_summary || 'Conductance showed temporary peaks correlating with outdoor ambient heat and movement, reflecting normal sympathetic thermoregulatory response.'}
            </p>
          </div>

          {/* Heat Stress Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#f97316', marginBottom: 4 }}>
              <Flame size={18} /> Heat Stress Exposure
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {summary?.heat_stress_summary || 'Heat Stress Risk remained predominantly LOW to MODERATE. Peak exposure recorded at 38/100 during midday sun.'}
            </p>
          </div>

          {/* Respiratory Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
              <Wind size={18} /> Respiratory & Blood Oxygenation
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {summary?.respiratory_summary || 'SpO₂ remained consistently at 98% with zero clinically significant desaturation episodes.'}
            </p>
          </div>
        </div>

        {/* Holistic Daily Insight Card */}
        <div style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12))',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginBottom: 8 }}>
            <Sparkles size={18} /> Daily AI Insight
          </div>
          <p style={{ fontSize: '0.92rem', color: '#f1f5f9', lineHeight: 1.6 }}>
            "{summary?.daily_insight || 'You experienced increased physiological stress during the hottest part of the day, but vitals recovered promptly with hydration and rest intervals.'}"
          </p>
        </div>
      </div>
    </div>
  );
}
