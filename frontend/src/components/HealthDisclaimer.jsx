import React from 'react';
import { Info } from 'lucide-react';

export default function HealthDisclaimer() {
  return (
    <div className="disclaimer-banner">
      <Info size={16} color="var(--primary-light)" style={{ flexShrink: 0 }} />
      <span>
        <strong>Medical Disclaimer:</strong> SwastyaConnect is intended for wellness monitoring, risk awareness, and early-warning support. It is not a medical diagnostic device and does not replace professional medical advice or emergency services.
      </span>
    </div>
  );
}
