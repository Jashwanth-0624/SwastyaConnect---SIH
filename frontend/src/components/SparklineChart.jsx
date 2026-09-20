import React from 'react';

export default function SparklineChart({ data = [], color = '#38bdf8', height = 48, minVal, maxVal }) {
  if (!data || data.length < 2) {
    return <div style={{ height, width: '100%', opacity: 0.3, background: 'rgba(255,255,255,0.02)', borderRadius: 4 }} />;
  }

  const values = data.map(d => (typeof d === 'number' ? d : d.val || 0));
  const min = minVal !== undefined ? minVal : Math.min(...values);
  const max = maxVal !== undefined ? maxVal : Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;

  const width = 200;
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#grad-${color.replace('#', '')})`} points={areaPoints} />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}
