"""
SwastyaConnect — Personal Baseline Engine
Computes and maintains dynamic, personalized baseline ranges ("Your Normal")
for Heart Rate, SpO2, Skin Temperature, and GSR. Calculates percentage/z-score
deviations rather than relying on crude static thresholds.
"""

from typing import Dict, Any, Tuple
from ..models.schemas import WearableData, PersonalBaseline


class BaselineEngine:
    """Manages personal physiological baselines and deviation calculations."""

    def __init__(self, initial_baseline: PersonalBaseline = None):
        self.baseline = initial_baseline or PersonalBaseline()
        self.history_buffer = []
        self.max_buffer_size = 500

    def update_baseline(self, data: WearableData, alpha: float = 0.05) -> PersonalBaseline:
        """
        Updates the running personal baseline using an Exponential Moving Average (EMA)
        filter when data is valid and user is in a stable/resting state.
        """
        # Only update baseline if sensor quality is high and motion is low
        if data.signal_quality >= 0.85 and data.motion_intensity <= 0.3:
            # Update mean baselines with exponential smoothing
            self.baseline.hr_baseline = round(
                (1 - alpha) * self.baseline.hr_baseline + alpha * data.hr, 1
            )
            self.baseline.spo2_baseline = round(
                (1 - alpha) * self.baseline.spo2_baseline + alpha * data.spo2, 1
            )
            self.baseline.skin_temp_baseline = round(
                (1 - alpha) * self.baseline.skin_temp_baseline + alpha * data.skin_temp, 2
            )
            self.baseline.gsr_baseline = round(
                (1 - alpha) * self.baseline.gsr_baseline + alpha * data.gsr, 2
            )

            # Update dynamic bounds
            self.baseline.hr_min = round(self.baseline.hr_baseline * 0.85, 1)
            self.baseline.hr_max = round(self.baseline.hr_baseline * 1.20, 1)
            self.baseline.spo2_min = round(max(94.0, self.baseline.spo2_baseline - 3.0), 1)
            self.baseline.skin_temp_min = round(self.baseline.skin_temp_baseline - 0.5, 2)
            self.baseline.skin_temp_max = round(self.baseline.skin_temp_baseline + 0.6, 2)

            self.baseline.samples_count += 1
            # Increase confidence asymptotically towards 0.99
            self.baseline.confidence = min(0.99, round(0.5 + (self.baseline.samples_count / (self.baseline.samples_count + 50)) * 0.49, 2))

        return self.baseline

    def compute_deviations(self, data: WearableData) -> Dict[str, Any]:
        """
        Calculates relative deviations against personal baseline.
        Returns:
            hr_pct: % deviation (+50% means 50% above baseline)
            spo2_pct: % drop from baseline
            temp_delta: temperature delta in °C
            gsr_pct: % change in galvanic skin response conductance
            is_hr_elevated: bool
            is_spo2_depressed: bool
            is_temp_elevated: bool
            is_gsr_elevated: bool
        """
        hr_pct = ((data.hr - self.baseline.hr_baseline) / max(1.0, self.baseline.hr_baseline)) * 100.0
        spo2_pct = ((data.spo2 - self.baseline.spo2_baseline) / max(1.0, self.baseline.spo2_baseline)) * 100.0
        temp_delta = data.skin_temp - self.baseline.skin_temp_baseline
        gsr_pct = ((data.gsr - self.baseline.gsr_baseline) / max(0.1, self.baseline.gsr_baseline)) * 100.0

        is_hr_elevated = data.hr > self.baseline.hr_max
        is_spo2_depressed = data.spo2 < self.baseline.spo2_min
        is_temp_elevated = data.skin_temp > self.baseline.skin_temp_max
        is_gsr_elevated = data.gsr > (self.baseline.gsr_baseline * 1.5)

        return {
            "hr_deviation_pct": round(hr_pct, 1),
            "spo2_deviation_pct": round(spo2_pct, 1),
            "temp_deviation_deg": round(temp_delta, 2),
            "gsr_deviation_pct": round(gsr_pct, 1),
            "is_hr_elevated": is_hr_elevated,
            "is_spo2_depressed": is_spo2_depressed,
            "is_temp_elevated": is_temp_elevated,
            "is_gsr_elevated": is_gsr_elevated,
            "baseline_summary": {
                "hr_normal": f"{self.baseline.hr_min:.0f}–{self.baseline.hr_max:.0f} BPM",
                "spo2_normal": f"{self.baseline.spo2_min:.0f}–{self.baseline.spo2_baseline:.0f}%",
                "temp_normal": f"{self.baseline.skin_temp_min:.1f}–{self.baseline.skin_temp_max:.1f}°C",
                "gsr_normal": f"~{self.baseline.gsr_baseline:.1f} µS"
            }
        }


# Global singleton instance
baseline_engine = BaselineEngine()
