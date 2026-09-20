import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Heart, Flame, Wind, Activity } from 'lucide-react';
import SparklineChart from '../components/SparklineChart';
import { apiService } from '../services/apiService';

export default function TrendsView() {
  const [timeframe, setTimeframe] = useState('TODAY');
  const [trendData, setTrendData] = useState([]);
  const [activeMetric, setActiveMetric] = useState('ALL');

  useEffect(() => {
    async function loadTrends() {
      const data = await apiService.getTrends(timeframe);
      setTrendData(data);
    }
    loadTrends();
  }, [timeframe]);

  const hrSeries = trendData.map(d => d.hr);
  const tempSeries = trendData.map(d => d.skin_temp);
  const heatRiskSeries = trendData.map(d => d.heat_stress_risk);
  const overallSeries = trendData.map(d => d.overall_risk);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
            Physiological & Risk Trends
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Historical longitudinal analytics across time horizons (Today, 7 Days, 30 Days).
          </p>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          {['TODAY', '7D', '30D'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: timeframe === tf ? '#0284c7' : 'transparent',
                color: timeframe === tf ? 'white' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {tf === 'TODAY' ? 'Today (24h)' : tf === '7D' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Multi-Metric Trend Card */}
      <div className="glass-panel" style={{ padding: 26, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="#38bdf8" /> Composite Risk & Vital Progression
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {trendData.length} observation windows ({timeframe})
          </span>
        </div>

        {/* Chart View */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <div style={{ marginBottom: 12, fontSize: '0.84rem', fontWeight: 700, color: '#f87171' }}>
            ❤️ Heart Rate Progression (BPM)
          </div>
          <SparklineChart data={hrSeries} color="#ef4444" height={70} minVal={50} maxVal={140} />
          
          <div style={{ marginTop: 18, marginBottom: 12, fontSize: '0.84rem', fontWeight: 700, color: '#f97316' }}>
            🔥 Heat Stress Risk Curve (0–100)
          </div>
          <SparklineChart data={heatRiskSeries} color="#f97316" height={70} minVal={0} maxVal={100} />

          <div style={{ marginTop: 18, marginBottom: 12, fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8' }}>
            🛡 Overall Composite Risk (0–100)
          </div>
          <SparklineChart data={overallSeries} color="#38bdf8" height={70} minVal={0} maxVal={100} />
        </div>

        {/* Timeline breakdown table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Time Interval</th>
                <th style={{ padding: '10px 12px' }}>Avg Heart Rate</th>
                <th style={{ padding: '10px 12px' }}>Skin Temp</th>
                <th style={{ padding: '10px 12px' }}>SpO₂</th>
                <th style={{ padding: '10px 12px' }}>Heat Risk</th>
                <th style={{ padding: '10px 12px' }}>Overall Risk</th>
              </tr>
            </thead>
            <tbody>
              {trendData.slice(-6).map((pt, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{pt.time_label}</td>
                  <td style={{ padding: '10px 12px', color: '#f87171' }}>{Math.round(pt.hr)} BPM</td>
                  <td style={{ padding: '10px 12px', color: '#fbbf24' }}>{pt.skin_temp.toFixed(1)}°C</td>
                  <td style={{ padding: '10px 12px', color: '#38bdf8' }}>{Math.round(pt.spo2)}%</td>
                  <td style={{ padding: '10px 12px', color: '#f97316', fontWeight: 700 }}>{Math.round(pt.heat_stress_risk)}/100</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: pt.overall_risk >= 60 ? 'rgba(239, 68, 68, 0.2)' : pt.overall_risk >= 30 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: pt.overall_risk >= 60 ? '#f87171' : pt.overall_risk >= 30 ? '#fbbf24' : '#34d399'
                    }}>
                      {Math.round(pt.overall_risk)}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
