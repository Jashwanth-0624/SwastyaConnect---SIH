"""
SwastyaConnect — Multi-Sensor AI & Risk Engine
Implements modular, explainable risk assessment combining wearable physiological
signals (HR, SpO2, Skin Temp, GSR) with personal baselines and environmental/disaster context.
Calculates Heat-Stress Risk, Respiratory Risk, Cardiovascular Stress, Fatigue Risk,
and an Overall Composite Risk with clear, non-diagnostic contributing factor explanations.
"""

from typing import List, Dict, Any, Tuple
import math
import time
from ..models.schemas import (
    WearableData,
    PersonalBaseline,
    EnvironmentalContext,
    UserProfile,
    RiskAnalysisResult,
    RiskFactor
)
from .baseline_engine import BaselineEngine, baseline_engine


class HealthRiskEngine:
    """Multi-sensor contextual risk inference engine."""

    def __init__(self, baseline_eng: BaselineEngine = None):
        self.baseline_engine = baseline_eng or baseline_engine

    def compute_heat_index(self, temp_c: float, humidity_pct: float) -> float:
        """
        Computes simplified Heat Index in Celsius based on ambient temperature
        and relative humidity (NOAA approximation).
        """
        # Convert to Fahrenheit for standard NOAA polynomial, then back to Celsius
        t = (temp_c * 9.0 / 5.0) + 32.0
        r = humidity_pct

        if t < 80.0:
            hi_f = 0.5 * (t + 61.0 + ((t - 68.0) * 1.2) + (r * 0.094))
        else:
            hi_f = (
                -42.379
                + 2.04901523 * t
                + 10.14333127 * r
                - 0.22475541 * t * r
                - 0.00683783 * t * t
                - 0.05481717 * r * r
                + 0.00122874 * t * t * r
                + 0.00085282 * t * r * r
                - 0.00000199 * t * t * r * r
            )

        hi_c = (hi_f - 32.0) * 5.0 / 9.0
        return max(temp_c, hi_c)

    def calculate_heat_stress(
        self,
        vitals: WearableData,
        deviations: Dict[str, Any],
        env: EnvironmentalContext,
        vulnerability: str = "GENERAL"
    ) -> Tuple[float, List[RiskFactor]]:
        """
        Calculates Heat Stress Risk (0–100).
        Fuses: Skin temperature deviation, HR elevation, GSR sweating conductance,
        Ambient temperature & humidity (Heat Index), and disaster status.
        """
        factors = []
        score = 0.0

        # 1. Skin / Body Temperature Factor (Weight: 35%)
        temp_delta = deviations["temp_deviation_deg"]
        temp_score = 0.0
        if vitals.skin_temp > 39.0 or temp_delta >= 2.0:
            temp_score = 100.0
            factors.append(RiskFactor(
                id="temp_critical",
                name="Critical Body Temperature",
                status="CRITICAL",
                description=f"Skin temperature is {vitals.skin_temp:.1f}°C (+{temp_delta:.1f}°C above baseline normal).",
                contribution_pct=35.0
            ))
        elif vitals.skin_temp > 37.8 or temp_delta >= 1.0:
            temp_score = 75.0
            factors.append(RiskFactor(
                id="temp_elevated",
                name="Elevated Skin Temperature",
                status="HIGH",
                description=f"Skin temperature ({vitals.skin_temp:.1f}°C) is substantially elevated above baseline.",
                contribution_pct=28.0
            ))
        elif vitals.skin_temp > 37.2 or temp_delta >= 0.5:
            temp_score = 45.0
            factors.append(RiskFactor(
                id="temp_mild",
                name="Mild Thermal Elevation",
                status="ELEVATED",
                description=f"Skin temperature ({vitals.skin_temp:.1f}°C) is slightly above personal normal.",
                contribution_pct=15.0
            ))
        else:
            temp_score = 10.0

        # 2. Heart Rate Response Factor under Thermal Strain (Weight: 25%)
        hr_pct = deviations["hr_deviation_pct"]
        hr_score = 0.0
        if hr_pct >= 40.0:
            hr_score = 90.0
            factors.append(RiskFactor(
                id="hr_thermal_surge",
                name="Thermal Cardiovascular Strain",
                status="HIGH",
                description=f"Heart rate is {vitals.hr:.0f} BPM (+{hr_pct:.0f}% above your normal baseline).",
                contribution_pct=25.0
            ))
        elif hr_pct >= 20.0:
            hr_score = 55.0
            factors.append(RiskFactor(
                id="hr_thermal_elevated",
                name="Elevated Heart Rate",
                status="ELEVATED",
                description=f"Heart rate is {vitals.hr:.0f} BPM (+{hr_pct:.0f}% above baseline).",
                contribution_pct=15.0
            ))
        else:
            hr_score = 5.0

        # 3. GSR Conductance / Physiological Stress (Weight: 15%)
        gsr_pct = deviations["gsr_deviation_pct"]
        gsr_score = 0.0
        if vitals.gsr >= 15.0 or gsr_pct >= 100.0:
            gsr_score = 80.0
            factors.append(RiskFactor(
                id="gsr_high",
                name="Elevated Electrodermal Conductance",
                status="HIGH",
                description="GSR is significantly elevated, indicating active thermoregulatory sweating / physiological strain.",
                contribution_pct=15.0
            ))
        elif vitals.gsr >= 8.0 or gsr_pct >= 40.0:
            gsr_score = 45.0
            factors.append(RiskFactor(
                id="gsr_mod",
                name="Moderate Physiological Stress",
                status="ELEVATED",
                description="GSR indicates moderate physiological stress.",
                contribution_pct=10.0
            ))
        else:
            gsr_score = 5.0

        # 4. Environmental Thermal Load (Weight: 25%)
        heat_idx = self.compute_heat_index(env.ambient_temp, env.humidity)
        env_score = 0.0
        if heat_idx >= 44.0 or env.disaster_type == "HEAT_WAVE":
            env_score = 95.0
            factors.append(RiskFactor(
                id="env_heatwave",
                name="Severe Heat Exposure",
                status="CRITICAL",
                description=f"Ambient Heat Index is {heat_idx:.1f}°C (Extreme Heatwave Conditions).",
                contribution_pct=25.0
            ))
        elif heat_idx >= 38.0:
            env_score = 70.0
            factors.append(RiskFactor(
                id="env_heat_high",
                name="High Ambient Temperature",
                status="HIGH",
                description=f"Ambient Heat Index is {heat_idx:.1f}°C with {env.humidity:.0f}% humidity.",
                contribution_pct=18.0
            ))
        elif heat_idx >= 33.0:
            env_score = 40.0
            factors.append(RiskFactor(
                id="env_heat_mod",
                name="Warm Environmental Conditions",
                status="ELEVATED",
                description=f"Ambient Heat Index is {heat_idx:.1f}°C.",
                contribution_pct=10.0
            ))
        else:
            env_score = 5.0

        # Vulnerability multiplier
        vuln_multiplier = 1.0
        if vulnerability in ("ELDERLY", "OUTDOOR_WORKER", "DISASTER_RESPONDER"):
            vuln_multiplier = 1.15

        raw_score = (
            temp_score * 0.35
            + hr_score * 0.25
            + gsr_score * 0.15
            + env_score * 0.25
        ) * vuln_multiplier

        score = min(100.0, max(0.0, round(raw_score, 1)))
        return score, factors

    def calculate_respiratory_risk(
        self,
        vitals: WearableData,
        deviations: Dict[str, Any],
        env: EnvironmentalContext,
        vulnerability: str = "GENERAL"
    ) -> Tuple[float, List[RiskFactor]]:
        """
        Calculates Respiratory Risk (0–100).
        Fuses: SpO2 drop, compensatory HR, AQI / PM2.5 particulate levels, and baseline normal.
        """
        factors = []
        score = 0.0

        # 1. SpO2 Level & Deviation (Weight: 50%)
        spo2_val = vitals.spo2
        spo2_score = 0.0
        if spo2_val < 90.0:
            spo2_score = 100.0
            factors.append(RiskFactor(
                id="spo2_critical",
                name="Significant SpO₂ Desaturation",
                status="CRITICAL",
                description=f"SpO₂ is {spo2_val:.0f}% (substantially below healthy physiological threshold).",
                contribution_pct=50.0
            ))
        elif spo2_val < 94.0 or deviations["is_spo2_depressed"]:
            spo2_score = 75.0
            factors.append(RiskFactor(
                id="spo2_depressed",
                name="SpO₂ Below Personal Baseline",
                status="HIGH",
                description=f"SpO₂ is {spo2_val:.0f}% (below your normal {self.baseline_engine.baseline.spo2_baseline:.0f}%).",
                contribution_pct=40.0
            ))
        elif spo2_val < 96.0:
            spo2_score = 35.0
            factors.append(RiskFactor(
                id="spo2_mild",
                name="Mild SpO₂ Variation",
                status="ELEVATED",
                description=f"SpO₂ is {spo2_val:.0f}% (slightly below personal baseline).",
                contribution_pct=15.0
            ))
        else:
            spo2_score = 5.0

        # 2. Environmental Air Quality (AQI / PM2.5) (Weight: 35%)
        aqi_score = 0.0
        if env.aqi > 300 or env.pm25 > 150 or env.disaster_type == "AIR_POLLUTION":
            aqi_score = 95.0
            factors.append(RiskFactor(
                id="aqi_severe",
                name="Severe Air Pollution Crisis",
                status="CRITICAL",
                description=f"AQI is {env.aqi} (Hazardous, PM2.5: {env.pm25:.0f} µg/m³).",
                contribution_pct=35.0
            ))
        elif env.aqi > 200 or env.pm25 > 90:
            aqi_score = 70.0
            factors.append(RiskFactor(
                id="aqi_poor",
                name="Very Poor Air Quality",
                status="HIGH",
                description=f"AQI is {env.aqi} (Unhealthy air quality in your area).",
                contribution_pct=25.0
            ))
        elif env.aqi > 100:
            aqi_score = 40.0
            factors.append(RiskFactor(
                id="aqi_moderate",
                name="Moderate Air Quality",
                status="ELEVATED",
                description=f"AQI is {env.aqi} (Sensitive groups may experience irritation).",
                contribution_pct=12.0
            ))
        else:
            aqi_score = 5.0

        # 3. Compensatory Heart Rate Response (Weight: 15%)
        hr_score = 0.0
        if deviations["hr_deviation_pct"] >= 25.0 and spo2_val < 95.0:
            hr_score = 80.0
            factors.append(RiskFactor(
                id="hr_respiratory_comp",
                name="Compensatory Tachycardia",
                status="HIGH",
                description="Heart rate elevated concurrently with reduced blood oxygenation.",
                contribution_pct=15.0
            ))
        else:
            hr_score = 10.0

        vuln_multiplier = 1.15 if vulnerability in ("ELDERLY", "OUTDOOR_WORKER") else 1.0
        raw_score = (spo2_score * 0.50 + aqi_score * 0.35 + hr_score * 0.15) * vuln_multiplier
        score = min(100.0, max(0.0, round(raw_score, 1)))
        return score, factors

    def calculate_cardiovascular_stress(
        self,
        vitals: WearableData,
        deviations: Dict[str, Any],
        env: EnvironmentalContext,
        vulnerability: str = "GENERAL"
    ) -> Tuple[float, List[RiskFactor]]:
        """
        Calculates Cardiovascular Stress (0–100).
        Assesses sustained baseline HR deviation, thermal/hypoxic coupling, and activity context.
        Phrased strictly as non-diagnostic physiological stress.
        """
        factors = []
        hr_pct = deviations["hr_deviation_pct"]
        score = 0.0

        if hr_pct >= 50.0 or vitals.hr > 130.0:
            score += 70.0
            factors.append(RiskFactor(
                id="hr_surge_marked",
                name="Marked Heart Rate Elevation",
                status="HIGH",
                description=f"Heart rate is {vitals.hr:.0f} BPM (+{hr_pct:.0f}% above your {self.baseline_engine.baseline.hr_baseline:.0f} BPM baseline).",
                contribution_pct=50.0
            ))
        elif hr_pct >= 25.0 or vitals.hr > 100.0:
            score += 45.0
            factors.append(RiskFactor(
                id="hr_elevated_moderate",
                name="Moderate Heart Rate Deviation",
                status="ELEVATED",
                description=f"Heart rate is {vitals.hr:.0f} BPM (+{hr_pct:.0f}% above baseline).",
                contribution_pct=30.0
            ))
        else:
            score += 10.0

        # Coupled temperature stress
        if deviations["temp_deviation_deg"] >= 1.0:
            score += 20.0
            factors.append(RiskFactor(
                id="cardio_thermal_load",
                name="Thermal Cardiovascular Load",
                status="ELEVATED",
                description="Elevated body temperature increases cardiac output demand.",
                contribution_pct=20.0
            ))

        # Coupled low oxygen
        if vitals.spo2 < 94.0:
            score += 20.0
            factors.append(RiskFactor(
                id="cardio_hypoxic_load",
                name="Hypoxic Strain",
                status="ELEVATED",
                description="Low SpO₂ creates additional cardiac demand.",
                contribution_pct=20.0
            ))

        vuln_multiplier = 1.15 if vulnerability == "ELDERLY" else 1.0
        final_score = min(100.0, max(0.0, round(score * vuln_multiplier, 1)))
        return final_score, factors

    def calculate_fatigue_risk(
        self,
        vitals: WearableData,
        deviations: Dict[str, Any],
        vulnerability: str = "GENERAL"
    ) -> Tuple[float, List[RiskFactor]]:
        """
        Calculates Fatigue Risk (0–100).
        Fuses: Sustained HR elevation at low motion, elevated GSR conductance, and thermal drift.
        """
        factors = []
        score = 15.0

        if deviations["hr_deviation_pct"] >= 20.0 and vitals.motion_intensity <= 0.2:
            score += 35.0
            factors.append(RiskFactor(
                id="fatigue_hr_drift",
                name="Cardiac Drift at Rest",
                status="ELEVATED",
                description="Elevated resting heart rate indicative of physiological fatigue/delayed recovery.",
                contribution_pct=35.0
            ))

        if vitals.gsr >= 8.0:
            score += 25.0
            factors.append(RiskFactor(
                id="fatigue_gsr_strain",
                name="Sustained Autonomic Arousal",
                status="ELEVATED",
                description="Prolonged sympathetic nervous activity reflected in skin conductance.",
                contribution_pct=25.0
            ))

        if deviations["temp_deviation_deg"] >= 0.6:
            score += 20.0
            factors.append(RiskFactor(
                id="fatigue_thermal_drift",
                name="Thermal Fatigue Load",
                status="ELEVATED",
                description="Slight elevation in temperature contributing to physical tiredness.",
                contribution_pct=20.0
            ))

        final_score = min(100.0, max(0.0, round(score, 1)))
        return final_score, factors

    def get_level_label(self, score: float) -> str:
        """Translates 0-100 score into clinical classification level."""
        if score < 30.0:
            return "LOW"
        elif score < 60.0:
            return "MODERATE"
        elif score < 80.0:
            return "HIGH"
        else:
            return "CRITICAL"

    def analyze_health_state(
        self,
        vitals: WearableData,
        env: EnvironmentalContext,
        profile: UserProfile = None
    ) -> RiskAnalysisResult:
        """
        Primary AI/Rule-based inference entry point.
        Takes wearable physiological readings, environmental context, and personal baseline,
        and returns composite risk scores, explanations, and non-diagnostic recommendations.
        """
        profile = profile or UserProfile()
        vuln = profile.vulnerability_mode

        # 1. Update baseline if stable & compute deviations
        self.baseline_engine.update_baseline(vitals)
        deviations = self.baseline_engine.compute_deviations(vitals)

        # 2. Run sub-engines
        heat_score, heat_factors = self.calculate_heat_stress(vitals, deviations, env, vuln)
        resp_score, resp_factors = self.calculate_respiratory_risk(vitals, deviations, env, vuln)
        cardio_score, cardio_factors = self.calculate_cardiovascular_stress(vitals, deviations, env, vuln)
        fatigue_score, fatigue_factors = self.calculate_fatigue_risk(vitals, deviations, vuln)

        # 3. Dynamic Contextual Fusion for Overall Risk (Not simple average!)
        # Uses dominant risk driver + 20% contribution of secondary drivers + disaster context
        sub_scores = [heat_score, resp_score, cardio_score, fatigue_score]
        max_sub = max(sub_scores)
        secondary_avg = (sum(sub_scores) - max_sub) / 3.0

        overall_raw = max_sub * 0.70 + secondary_avg * 0.30

        # Environmental Disaster Multiplier
        if env.disaster_type != "NONE" and env.disaster_severity in ("WARNING", "CRITICAL"):
            overall_raw = min(100.0, overall_raw * 1.20)

        overall_score = min(100.0, max(0.0, round(overall_raw, 1)))
        overall_level = self.get_level_label(overall_score)

        # 4. Consolidate Contributing Factors
        all_factors = []
        for f in heat_factors + resp_factors + cardio_factors + fatigue_factors:
            if not any(existing.id == f.id for existing in all_factors):
                all_factors.append(f)

        # 5. Generate Transparent Explanation & Actionable Guidance
        explanation = ""
        primary_concern = None
        recommendations = []
        alert_level = "NONE"

        if overall_level == "CRITICAL":
            alert_level = "CRITICAL"
            primary_concern = "Critical Multi-System Physiological Strain"
            explanation = (
                f"Your overall health risk is CRITICAL ({overall_score:.0f}/100). "
                f"Multiple vital metrics deviate significantly from your baseline "
                f"(HR: {vitals.hr:.0f} BPM, SpO₂: {vitals.spo2:.0f}%, Temp: {vitals.skin_temp:.1f}°C) "
                f"under adverse environmental conditions."
            )
            recommendations = [
                "Immediately cease all physical exertion and sit down in a shaded or cooled area.",
                "Loosen tight clothing and sip cool water if fully conscious.",
                "Check your condition with a companion or caregiver.",
                "Seek emergency medical assistance if symptoms like dizziness, chest tightness, or confusion occur."
            ]
        elif overall_level == "HIGH":
            alert_level = "HIGH"
            if max_sub == heat_score:
                primary_concern = "High Heat Stress Risk"
                explanation = (
                    f"Heat Stress Risk is HIGH ({heat_score:.0f}/100). "
                    f"Skin temperature ({vitals.skin_temp:.1f}°C) and HR (+{deviations['hr_deviation_pct']:.0f}% over baseline) "
                    f"are significantly elevated during high ambient heat ({env.ambient_temp:.0f}°C)."
                )
                recommendations = [
                    "Move to a cooler or shaded environment immediately.",
                    "Reduce physical activity and hydrate with water or electrolytes.",
                    "Reassess your wearable readings in 5 to 10 minutes."
                ]
            elif max_sub == resp_score:
                primary_concern = "Elevated Respiratory Risk"
                explanation = (
                    f"Respiratory Risk is HIGH ({resp_score:.0f}/100). "
                    f"SpO₂ is {vitals.spo2:.0f}% (below personal normal) while environmental air quality is degraded (AQI: {env.aqi})."
                )
                recommendations = [
                    "Move indoors to a well-ventilated or air-filtered room.",
                    "Avoid outdoor exercise and prolonged exposure to ambient pollution.",
                    "Recheck SpO₂ reading; if persistently low or you feel breathless, consult a healthcare provider."
                ]
            else:
                primary_concern = "Elevated Cardiovascular Workload"
                explanation = (
                    f"Cardiovascular stress is HIGH ({cardio_score:.0f}/100). "
                    f"Heart rate is {vitals.hr:.0f} BPM (+{deviations['hr_deviation_pct']:.0f}% above baseline)."
                )
                recommendations = [
                    "Pause any strenuous activity and rest in a comfortable seated position.",
                    "Take slow, deep breaths and hydrate.",
                    "If elevated heart rate or discomfort persists, consult a physician."
                ]
        elif overall_level == "MODERATE":
            alert_level = "MODERATE"
            primary_concern = "Moderate Physiological Stress"
            explanation = (
                f"Overall risk is MODERATE ({overall_score:.0f}/100). "
                f"Minor elevations observed relative to your personal baseline."
            )
            recommendations = [
                "Take a short rest break from active tasks.",
                "Drink water and monitor environmental heat/air quality.",
                "Continue wearing device to monitor vital trends."
            ]
        else:
            alert_level = "INFO"
            primary_concern = "Stable Vitals"
            explanation = (
                f"All physiological parameters are within your normal personal baseline ranges "
                f"(HR: {vitals.hr:.0f} BPM, SpO₂: {vitals.spo2:.0f}%, Temp: {vitals.skin_temp:.1f}°C, GSR: {vitals.gsr:.1f} µS)."
            )
            recommendations = [
                "Maintain normal daily activity and routine hydration.",
                "Keep wearable snug against skin for consistent sensor telemetry."
            ]

        return RiskAnalysisResult(
            overall_risk=overall_score,
            overall_level=overall_level,
            heat_stress_risk=heat_score,
            heat_stress_level=self.get_level_label(heat_score),
            respiratory_risk=resp_score,
            respiratory_level=self.get_level_label(resp_score),
            cardiovascular_stress=cardio_score,
            cardiovascular_level=self.get_level_label(cardio_score),
            fatigue_risk=fatigue_score,
            fatigue_level=self.get_level_label(fatigue_score),
            contributing_factors=all_factors,
            primary_concern=primary_concern,
            explanation=explanation,
            recommendations=recommendations,
            alert_level=alert_level,
            hr_deviation_pct=deviations["hr_deviation_pct"],
            spo2_deviation_pct=deviations["spo2_deviation_pct"],
            temp_deviation_deg=deviations["temp_deviation_deg"],
            gsr_deviation_pct=deviations["gsr_deviation_pct"],
            timestamp=vitals.timestamp,
            is_simulated=vitals.is_simulated
        )


# Global singleton instance
risk_engine = HealthRiskEngine()
