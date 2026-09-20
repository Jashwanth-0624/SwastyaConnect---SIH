/**
 * SwastyaConnect — On-Device Edge AI Risk Engine (JavaScript Fallback)
 * Provides 100% offline, local physiological analysis and multi-sensor fusion.
 * Ensures health monitoring and early warning function without internet or cloud.
 */

export class OfflineEdgeEngine {
  constructor() {
    this.baseline = {
      hr_baseline: 72.0,
      hr_min: 60.0,
      hr_max: 84.0,
      spo2_baseline: 98.0,
      spo2_min: 95.0,
      skin_temp_baseline: 36.5,
      skin_temp_min: 36.1,
      skin_temp_max: 37.1,
      gsr_baseline: 4.5,
      samples_count: 150,
      confidence: 0.94
    };
  }

  computeHeatIndex(tempC, humidityPct) {
    const t = (tempC * 9.0) / 5.0 + 32.0;
    const r = humidityPct;
    let hiF;
    if (t < 80.0) {
      hiF = 0.5 * (t + 61.0 + (t - 68.0) * 1.2 + r * 0.094);
    } else {
      hiF =
        -42.379 +
        2.04901523 * t +
        10.14333127 * r -
        0.22475541 * t * r -
        0.00683783 * t * t -
        0.05481717 * r * r +
        0.00122874 * t * t * r +
        0.00085282 * t * r * r -
        0.00000199 * t * t * r * r;
    }
    const hiC = ((hiF - 32.0) * 5.0) / 9.0;
    return Math.max(tempC, hiC);
  }

  computeDeviations(vitals) {
    const hrPct = ((vitals.hr - this.baseline.hr_baseline) / Math.max(1, this.baseline.hr_baseline)) * 100.0;
    const spo2Pct = ((vitals.spo2 - this.baseline.spo2_baseline) / Math.max(1, this.baseline.spo2_baseline)) * 100.0;
    const tempDelta = vitals.skin_temp - this.baseline.skin_temp_baseline;
    const gsrPct = ((vitals.gsr - this.baseline.gsr_baseline) / Math.max(0.1, this.baseline.gsr_baseline)) * 100.0;

    return {
      hr_deviation_pct: Number(hrPct.toFixed(1)),
      spo2_deviation_pct: Number(spo2Pct.toFixed(1)),
      temp_deviation_deg: Number(tempDelta.toFixed(2)),
      gsr_deviation_pct: Number(gsrPct.toFixed(1)),
      is_hr_elevated: vitals.hr > this.baseline.hr_max,
      is_spo2_depressed: vitals.spo2 < this.baseline.spo2_min,
      is_temp_elevated: vitals.skin_temp > this.baseline.skin_temp_max,
      is_gsr_elevated: vitals.gsr > this.baseline.gsr_baseline * 1.5
    };
  }

  calculateHeatStress(vitals, devs, env, vulnerability = 'GENERAL') {
    const factors = [];
    let tempScore = 10.0;

    if (vitals.skin_temp > 39.0 || devs.temp_deviation_deg >= 2.0) {
      tempScore = 100.0;
      factors.push({
        id: 'temp_critical',
        name: 'Critical Body Temperature',
        status: 'CRITICAL',
        description: `Skin temperature is ${vitals.skin_temp.toFixed(1)}°C (+${devs.temp_deviation_deg.toFixed(1)}°C above baseline).`,
        contribution_pct: 35.0
      });
    } else if (vitals.skin_temp > 37.8 || devs.temp_deviation_deg >= 1.0) {
      tempScore = 75.0;
      factors.push({
        id: 'temp_elevated',
        name: 'Elevated Skin Temperature',
        status: 'HIGH',
        description: `Skin temperature (${vitals.skin_temp.toFixed(1)}°C) is substantially elevated above personal baseline.`,
        contribution_pct: 28.0
      });
    } else if (vitals.skin_temp > 37.2 || devs.temp_deviation_deg >= 0.5) {
      tempScore = 45.0;
      factors.push({
        id: 'temp_mild',
        name: 'Mild Thermal Elevation',
        status: 'ELEVATED',
        description: `Skin temperature (${vitals.skin_temp.toFixed(1)}°C) is slightly above personal normal.`,
        contribution_pct: 15.0
      });
    }

    let hrScore = 5.0;
    if (devs.hr_deviation_pct >= 40.0) {
      hrScore = 90.0;
      factors.push({
        id: 'hr_thermal_surge',
        name: 'Thermal Cardiovascular Strain',
        status: 'HIGH',
        description: `Heart rate is ${Math.round(vitals.hr)} BPM (+${Math.round(devs.hr_deviation_pct)}% above baseline).`,
        contribution_pct: 25.0
      });
    } else if (devs.hr_deviation_pct >= 20.0) {
      hrScore = 55.0;
      factors.push({
        id: 'hr_thermal_elevated',
        name: 'Elevated Heart Rate',
        status: 'ELEVATED',
        description: `Heart rate is ${Math.round(vitals.hr)} BPM (+${Math.round(devs.hr_deviation_pct)}% above baseline).`,
        contribution_pct: 15.0
      });
    }

    let gsrScore = 5.0;
    if (vitals.gsr >= 15.0 || devs.gsr_deviation_pct >= 100.0) {
      gsrScore = 80.0;
      factors.push({
        id: 'gsr_high',
        name: 'Elevated Electrodermal Conductance',
        status: 'HIGH',
        description: 'GSR is significantly elevated, indicating thermoregulatory sweating / physiological strain.',
        contribution_pct: 15.0
      });
    } else if (vitals.gsr >= 8.0 || devs.gsr_deviation_pct >= 40.0) {
      gsrScore = 45.0;
      factors.push({
        id: 'gsr_mod',
        name: 'Moderate Physiological Stress',
        status: 'ELEVATED',
        description: 'GSR indicates moderate physiological stress.',
        contribution_pct: 10.0
      });
    }

    const heatIdx = this.computeHeatIndex(env.ambient_temp, env.humidity);
    let envScore = 5.0;
    if (heatIdx >= 44.0 || env.disaster_type === 'HEAT_WAVE') {
      envScore = 95.0;
      factors.push({
        id: 'env_heatwave',
        name: 'Severe Heat Exposure',
        status: 'CRITICAL',
        description: `Ambient Heat Index is ${heatIdx.toFixed(1)}°C (Extreme Heatwave Conditions).`,
        contribution_pct: 25.0
      });
    } else if (heatIdx >= 38.0) {
      envScore = 70.0;
      factors.push({
        id: 'env_heat_high',
        name: 'High Ambient Temperature',
        status: 'HIGH',
        description: `Ambient Heat Index is ${heatIdx.toFixed(1)}°C with ${Math.round(env.humidity)}% humidity.`,
        contribution_pct: 18.0
      });
    } else if (heatIdx >= 33.0) {
      envScore = 40.0;
      factors.push({
        id: 'env_heat_mod',
        name: 'Warm Environmental Conditions',
        status: 'ELEVATED',
        description: `Ambient Heat Index is ${heatIdx.toFixed(1)}°C.`,
        contribution_pct: 10.0
      });
    }

    const mult = vulnerability === 'ELDERLY' || vulnerability === 'OUTDOOR_WORKER' ? 1.15 : 1.0;
    const raw = (tempScore * 0.35 + hrScore * 0.25 + gsrScore * 0.15 + envScore * 0.25) * mult;
    return { score: Math.min(100.0, Math.max(0.0, Number(raw.toFixed(1)))), factors };
  }

  calculateRespiratoryRisk(vitals, devs, env, vulnerability = 'GENERAL') {
    const factors = [];
    let spo2Score = 5.0;

    if (vitals.spo2 < 90.0) {
      spo2Score = 100.0;
      factors.push({
        id: 'spo2_critical',
        name: 'Significant SpO₂ Desaturation',
        status: 'CRITICAL',
        description: `SpO₂ is ${Math.round(vitals.spo2)}% (substantially below healthy physiological threshold).`,
        contribution_pct: 50.0
      });
    } else if (vitals.spo2 < 94.0 || devs.is_spo2_depressed) {
      spo2Score = 75.0;
      factors.push({
        id: 'spo2_depressed',
        name: 'SpO₂ Below Personal Baseline',
        status: 'HIGH',
        description: `SpO₂ is ${Math.round(vitals.spo2)}% (below your normal ${this.baseline.spo2_baseline}%).`,
        contribution_pct: 40.0
      });
    } else if (vitals.spo2 < 96.0) {
      spo2Score = 35.0;
      factors.push({
        id: 'spo2_mild',
        name: 'Mild SpO₂ Variation',
        status: 'ELEVATED',
        description: `SpO₂ is ${Math.round(vitals.spo2)}% (slightly below personal baseline).`,
        contribution_pct: 15.0
      });
    }

    let aqiScore = 5.0;
    if (env.aqi > 300 || env.pm25 > 150 || env.disaster_type === 'AIR_POLLUTION') {
      aqiScore = 95.0;
      factors.push({
        id: 'aqi_severe',
        name: 'Severe Air Pollution Crisis',
        status: 'CRITICAL',
        description: `AQI is ${env.aqi} (Hazardous, PM2.5: ${Math.round(env.pm25)} µg/m³).`,
        contribution_pct: 35.0
      });
    } else if (env.aqi > 200 || env.pm25 > 90) {
      aqiScore = 70.0;
      factors.push({
        id: 'aqi_poor',
        name: 'Very Poor Air Quality',
        status: 'HIGH',
        description: `AQI is ${env.aqi} (Unhealthy air quality in your area).`,
        contribution_pct: 25.0
      });
    } else if (env.aqi > 100) {
      aqiScore = 40.0;
      factors.push({
        id: 'aqi_moderate',
        name: 'Moderate Air Quality',
        status: 'ELEVATED',
        description: `AQI is ${env.aqi} (Sensitive groups may experience irritation).`,
        contribution_pct: 12.0
      });
    }

    let hrScore = 10.0;
    if (devs.hr_deviation_pct >= 25.0 && vitals.spo2 < 95.0) {
      hrScore = 80.0;
      factors.push({
        id: 'hr_respiratory_comp',
        name: 'Compensatory Tachycardia',
        status: 'HIGH',
        description: 'Heart rate elevated concurrently with reduced blood oxygenation.',
        contribution_pct: 15.0
      });
    }

    const mult = vulnerability === 'ELDERLY' || vulnerability === 'OUTDOOR_WORKER' ? 1.15 : 1.0;
    const raw = (spo2Score * 0.5 + aqiScore * 0.35 + hrScore * 0.15) * mult;
    return { score: Math.min(100.0, Math.max(0.0, Number(raw.toFixed(1)))), factors };
  }

  calculateCardiovascularStress(vitals, devs, env, vulnerability = 'GENERAL') {
    const factors = [];
    let score = 10.0;

    if (devs.hr_deviation_pct >= 50.0 || vitals.hr > 130.0) {
      score += 60.0;
      factors.push({
        id: 'hr_surge_marked',
        name: 'Marked Heart Rate Elevation',
        status: 'HIGH',
        description: `Heart rate is ${Math.round(vitals.hr)} BPM (+${Math.round(devs.hr_deviation_pct)}% above baseline).`,
        contribution_pct: 50.0
      });
    } else if (devs.hr_deviation_pct >= 25.0 || vitals.hr > 100.0) {
      score += 35.0;
      factors.push({
        id: 'hr_elevated_moderate',
        name: 'Moderate Heart Rate Deviation',
        status: 'ELEVATED',
        description: `Heart rate is ${Math.round(vitals.hr)} BPM (+${Math.round(devs.hr_deviation_pct)}% above baseline).`,
        contribution_pct: 30.0
      });
    }

    if (devs.temp_deviation_deg >= 1.0) {
      score += 20.0;
      factors.push({
        id: 'cardio_thermal_load',
        name: 'Thermal Cardiovascular Load',
        status: 'ELEVATED',
        description: 'Elevated body temperature increases cardiac output demand.',
        contribution_pct: 20.0
      });
    }

    if (vitals.spo2 < 94.0) {
      score += 20.0;
      factors.push({
        id: 'cardio_hypoxic_load',
        name: 'Hypoxic Strain',
        status: 'ELEVATED',
        description: 'Low SpO₂ creates additional cardiac demand.',
        contribution_pct: 20.0
      });
    }

    const mult = vulnerability === 'ELDERLY' ? 1.15 : 1.0;
    return { score: Math.min(100.0, Math.max(0.0, Number((score * mult).toFixed(1)))), factors };
  }

  calculateFatigueRisk(vitals, devs, vulnerability = 'GENERAL') {
    const factors = [];
    let score = 15.0;

    if (devs.hr_deviation_pct >= 20.0 && (vitals.motion_intensity || 0) <= 0.2) {
      score += 35.0;
      factors.push({
        id: 'fatigue_hr_drift',
        name: 'Cardiac Drift at Rest',
        status: 'ELEVATED',
        description: 'Elevated resting heart rate indicative of physiological fatigue/delayed recovery.',
        contribution_pct: 35.0
      });
    }

    if (vitals.gsr >= 8.0) {
      score += 25.0;
      factors.push({
        id: 'fatigue_gsr_strain',
        name: 'Sustained Autonomic Arousal',
        status: 'ELEVATED',
        description: 'Prolonged sympathetic nervous activity reflected in skin conductance.',
        contribution_pct: 25.0
      });
    }

    if (devs.temp_deviation_deg >= 0.6) {
      score += 20.0;
      factors.push({
        id: 'fatigue_thermal_drift',
        name: 'Thermal Fatigue Load',
        status: 'ELEVATED',
        description: 'Slight elevation in temperature contributing to physical tiredness.',
        contribution_pct: 20.0
      });
    }

    return { score: Math.min(100.0, Math.max(0.0, Number(score.toFixed(1)))), factors };
  }

  getLevelLabel(score) {
    if (score < 30.0) return 'LOW';
    if (score < 60.0) return 'MODERATE';
    if (score < 80.0) return 'HIGH';
    return 'CRITICAL';
  }

  analyzeHealthState(vitals, env, profile = { vulnerabilityMode: 'GENERAL' }) {
    const vuln = profile.vulnerabilityMode || 'GENERAL';
    const devs = this.computeDeviations(vitals);

    const heat = this.calculateHeatStress(vitals, devs, env, vuln);
    const resp = this.calculateRespiratoryRisk(vitals, devs, env, vuln);
    const cardio = this.calculateCardiovascularStress(vitals, devs, env, vuln);
    const fatigue = this.calculateFatigueRisk(vitals, devs, vuln);

    const subScores = [heat.score, resp.score, cardio.score, fatigue.score];
    const maxSub = Math.max(...subScores);
    const secondaryAvg = (subScores.reduce((a, b) => a + b, 0) - maxSub) / 3.0;

    let overallRaw = maxSub * 0.7 + secondaryAvg * 0.3;
    if (env.disaster_type && env.disaster_type !== 'NONE' && (env.disaster_severity === 'WARNING' || env.disaster_severity === 'CRITICAL')) {
      overallRaw = Math.min(100.0, overallRaw * 1.2);
    }

    const overallScore = Math.min(100.0, Math.max(0.0, Number(overallRaw.toFixed(1))));
    const overallLevel = this.getLevelLabel(overallScore);

    const allFactors = [];
    const seen = new Set();
    for (const f of [...heat.factors, ...resp.factors, ...cardio.factors, ...fatigue.factors]) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        allFactors.push(f);
      }
    }

    let explanation = '';
    let primaryConcern = null;
    let recommendations = [];
    let alertLevel = 'NONE';

    if (overallLevel === 'CRITICAL') {
      alertLevel = 'CRITICAL';
      primaryConcern = 'Critical Multi-System Physiological Strain';
      explanation = `Your overall health risk is CRITICAL (${overallScore}/100). Multiple vital metrics deviate significantly from baseline under adverse environmental conditions.`;
      recommendations = [
        'Immediately cease all physical exertion and sit down in a shaded or cooled area.',
        'Loosen tight clothing and sip cool water if fully conscious.',
        'Check your condition with a companion or caregiver.',
        'Seek emergency medical assistance if symptoms like dizziness, chest tightness, or confusion occur.'
      ];
    } else if (overallLevel === 'HIGH') {
      alertLevel = 'HIGH';
      if (maxSub === heat.score) {
        primaryConcern = 'High Heat Stress Risk';
        explanation = `Heat Stress Risk is HIGH (${heat.score}/100). Skin temperature (${vitals.skin_temp.toFixed(1)}°C) and HR (+${Math.round(devs.hr_deviation_pct)}% over baseline) are significantly elevated during ambient heat.`;
        recommendations = [
          'Move to a cooler or shaded environment immediately.',
          'Reduce physical activity and hydrate with water or electrolytes.',
          'Reassess your wearable readings in 5 to 10 minutes.'
        ];
      } else if (maxSub === resp.score) {
        primaryConcern = 'Elevated Respiratory Risk';
        explanation = `Respiratory Risk is HIGH (${resp.score}/100). SpO₂ is ${Math.round(vitals.spo2)}% (below personal baseline) while ambient air quality is degraded (AQI: ${env.aqi}).`;
        recommendations = [
          'Move indoors to a well-ventilated or air-filtered room.',
          'Avoid outdoor exercise and prolonged exposure to ambient pollution.',
          'Recheck SpO₂ reading; if persistently low, consult a healthcare provider.'
        ];
      } else {
        primaryConcern = 'Elevated Cardiovascular Workload';
        explanation = `Cardiovascular stress is HIGH (${cardio.score}/100). Heart rate is ${Math.round(vitals.hr)} BPM (+${Math.round(devs.hr_deviation_pct)}% above baseline).`;
        recommendations = [
          'Pause any strenuous activity and rest in a comfortable seated position.',
          'Take slow, deep breaths and hydrate.',
          'If elevated heart rate or discomfort persists, consult a physician.'
        ];
      }
    } else if (overallLevel === 'MODERATE') {
      alertLevel = 'MODERATE';
      primaryConcern = 'Moderate Physiological Stress';
      explanation = `Overall risk is MODERATE (${overallScore}/100). Minor elevations observed relative to your personal baseline.`;
      recommendations = [
        'Take a short rest break from active tasks.',
        'Drink water and monitor environmental heat/air quality.',
        'Continue wearing device to monitor vital trends.'
      ];
    } else {
      alertLevel = 'INFO';
      primaryConcern = 'Stable Vitals';
      explanation = `All physiological parameters are within your normal personal baseline ranges (HR: ${Math.round(vitals.hr)} BPM, SpO₂: ${Math.round(vitals.spo2)}%, Temp: ${vitals.skin_temp.toFixed(1)}°C, GSR: ${vitals.gsr.toFixed(1)} µS).`;
      recommendations = [
        'Maintain normal daily activity and routine hydration.',
        'Keep wearable snug against skin for consistent sensor telemetry.'
      ];
    }

    return {
      overall_risk: overallScore,
      overall_level: overallLevel,
      heat_stress_risk: heat.score,
      heat_stress_level: this.getLevelLabel(heat.score),
      respiratory_risk: resp.score,
      respiratory_level: this.getLevelLabel(resp.score),
      cardiovascular_stress: cardio.score,
      cardiovascular_level: this.getLevelLabel(cardio.score),
      fatigue_risk: fatigue.score,
      fatigue_level: this.getLevelLabel(fatigue.score),
      contributing_factors: allFactors,
      primary_concern: primaryConcern,
      explanation,
      recommendations,
      alert_level: alertLevel,
      hr_deviation_pct: devs.hr_deviation_pct,
      spo2_deviation_pct: devs.spo2_deviation_pct,
      temp_deviation_deg: devs.temp_deviation_deg,
      gsr_deviation_pct: devs.gsr_deviation_pct,
      timestamp: Date.now() / 1000,
      is_simulated: vitals.is_simulated || true,
      disclaimer: 'SwastyaConnect is intended for wellness monitoring, risk awareness, and early-warning support. It is not a medical diagnostic device and does not replace professional medical advice or emergency services.'
    };
  }
}

export const offlineEdgeEngine = new OfflineEdgeEngine();
