import React from 'react';
import { BrainCircuit, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';

export default function InsightsView({ riskAnalysis, vitals, baseline, environment }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Explainable AI & Health Insights
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          SwastyaConnect avoids opaque "black-box" scores. Every risk evaluation is deconstructed into observable physiological telemetry, personal baseline deviations, and ambient environmental drivers.
        </p>
      </div>

      {/* Primary Explanation Hero */}
      <div className="glass-panel" style={{ padding: 28, marginBottom: 24, borderLeft: '6px solid #38bdf8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <BrainCircuit size={28} color="#38bdf8" />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
            Why is my risk evaluated as {riskAnalysis?.overall_level || 'LOW'} ({Math.round(riskAnalysis?.overall_risk || 0)}/100)?
          </h3>
        </div>

        <p style={{ fontSize: '1rem', color: '#e2e8f0', lineHeight: 1.6, marginBottom: 18 }}>
          {riskAnalysis?.explanation}
        </p>

        {/* Contributing Factors Breakdown Table */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Contributing Physiological & Environmental Factors:
          </h4>

          {riskAnalysis?.contributing_factors && riskAnalysis.contributing_factors.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {riskAnalysis.contributing_factors.map((factor) => (
                <div 
                  key={factor.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: factor.status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : factor.status === 'HIGH' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: factor.status === 'CRITICAL' ? '#f87171' : factor.status === 'HIGH' ? '#fb923c' : '#fbbf24'
                    }}>
                      {factor.status}
                    </span>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>{factor.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>— {factor.description}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Weight: {factor.contribution_pct}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 10, color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} />
              All measured parameters are within your established personal baseline ranges.
            </div>
          )}
        </div>
      </div>

      {/* Actionable Triage Guidance */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Sparkles size={22} color="#fbbf24" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
            Personalized Safety & Triage Guidance
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {riskAnalysis?.recommendations?.map((rec, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#0284c7',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                flexShrink: 0
              }}>
                {idx + 1}
              </div>
              <span style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.5 }}>
                {rec}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Architecture Transparency Notice */}
      <div className="glass-panel" style={{ padding: 20, background: 'rgba(15, 23, 42, 0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '0.84rem' }}>
          <ShieldCheck size={18} color="#38bdf8" />
          <span>
            <strong>Edge AI Notice:</strong> Inference calculations execute locally on your device via feature engineering & weighted multi-sensor fusion. The system is designed to seamlessly swap in quantized TinyML / ONNX edge models without modifying UI or privacy structures.
          </span>
        </div>
      </div>
    </div>
  );
}
