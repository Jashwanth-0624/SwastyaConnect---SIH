"""
SwastyaConnect — Pydantic Data Schemas
Defines core data models for physiological vitals, personal baselines,
environmental conditions, risk calculations, alerts, and emergency workflows.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import time


class WearableData(BaseModel):
    """Real-time physiological sensor readings from wearable hardware."""
    hr: float = Field(..., description="Heart Rate in Beats Per Minute (BPM)", ge=0.0, le=300.0)
    spo2: float = Field(..., description="Blood Oxygen Saturation percentage (%)", ge=0.0, le=100.0)
    skin_temp: float = Field(..., description="Skin/Body Temperature in Celsius (°C)", ge=0.0, le=60.0)
    gsr: float = Field(..., description="Galvanic Skin Response (Skin Conductance) in µS / raw ADC", ge=0.0, le=5000.0)
    timestamp: float = Field(default_factory=time.time, description="Epoch timestamp of sensor reading")
    is_simulated: bool = Field(default=True, description="Flag indicating simulated vs physical hardware feed")
    signal_quality: float = Field(default=0.98, description="Signal Quality Index (0.0 to 1.0)", ge=0.0, le=1.0)
    motion_intensity: float = Field(default=0.0, description="Contextual motion/activity level (0.0 to 1.0)", ge=0.0, le=1.0)
    temp_sensor_disconnected: bool = Field(default=False, description="Flag indicating DS18B20 -127C hardware wire disconnect")




class PersonalBaseline(BaseModel):
    """Learned dynamic normal baseline ranges for the individual user."""
    hr_baseline: float = Field(default=72.0, description="Mean resting Heart Rate")
    hr_min: float = Field(default=60.0, description="Normal lower HR bound")
    hr_max: float = Field(default=84.0, description="Normal upper HR bound")
    spo2_baseline: float = Field(default=98.0, description="Mean SpO2 percentage")
    spo2_min: float = Field(default=95.0, description="Acceptable minimum SpO2")
    skin_temp_baseline: float = Field(default=36.5, description="Mean skin temperature in °C")
    skin_temp_min: float = Field(default=36.1, description="Normal lower temperature bound")
    skin_temp_max: float = Field(default=37.1, description="Normal upper temperature bound")
    gsr_baseline: float = Field(default=4.5, description="Personal baseline galvanic skin conductance")
    samples_count: int = Field(default=150, description="Total telemetry samples used to calculate baseline")
    confidence: float = Field(default=0.92, description="Statistical confidence of baseline reliability")


class EnvironmentalContext(BaseModel):
    """External meteorological, air quality, and disaster conditions."""
    ambient_temp: float = Field(default=32.0, description="Ambient air temperature in °C")
    humidity: float = Field(default=55.0, description="Relative humidity percentage (%)")
    aqi: int = Field(default=85, description="Air Quality Index")
    pm25: float = Field(default=30.0, description="Particulate Matter PM2.5 in µg/m³")
    weather_condition: str = Field(default="Partly Cloudy", description="Weather status description")
    disaster_type: str = Field(default="NONE", description="Active disaster: NONE, HEAT_WAVE, AIR_POLLUTION, FLOOD, CYCLONE, EXTREME_WEATHER")
    disaster_severity: str = Field(default="NONE", description="Disaster severity: NONE, ADVISORY, WATCH, WARNING, CRITICAL")
    location_name: str = Field(default="New Delhi, India", description="Current locality/region")
    is_cached: bool = Field(default=False, description="Whether this data is from offline cache")
    timestamp: float = Field(default_factory=time.time, description="Timestamp of environmental observation")


class EmergencyContact(BaseModel):
    """Configured emergency contact."""
    id: str
    name: str
    phone: str
    relationship: str
    is_primary: bool = False


class UserProfile(BaseModel):
    """User profile and vulnerability context configuration."""
    user_id: str = "user_default"
    name: str = "Jashwanth"
    age_group: str = "ADULT"  # YOUNG_ADULT, ADULT, ELDERLY
    vulnerability_mode: str = "GENERAL"  # GENERAL, ELDERLY, OUTDOOR_WORKER, DISASTER_RESPONDER
    emergency_contacts: List[EmergencyContact] = Field(default_factory=lambda: [
        EmergencyContact(id="ec1", name="Primary Emergency Contact", phone="+91 83108 17516", relationship="Emergency Contact", is_primary=True),
        EmergencyContact(id="ec2", name="Priya (Family)", phone="+91 98123 45678", relationship="Family", is_primary=False)
    ])
    caregiver_name: Optional[str] = "Primary Contact"
    caregiver_phone: Optional[str] = "+91 83108 17516"

    emergency_location_sharing: bool = False
    cloud_sync_opt_in: bool = False
    alert_sensitivity: str = "NORMAL"  # LOW, NORMAL, HIGH


class RiskFactor(BaseModel):
    """Individual contributing factor to an elevated risk score."""
    id: str
    name: str
    status: str  # NORMAL, ELEVATED, HIGH, CRITICAL
    description: str
    contribution_pct: float = Field(..., ge=0.0, le=100.0)


class RiskAnalysisResult(BaseModel):
    """Composite output from the on-device AI/rule-based risk engine."""
    overall_risk: float = Field(..., ge=0.0, le=100.0, description="Overall Health Risk Score (0-100)")
    overall_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    
    heat_stress_risk: float = Field(..., ge=0.0, le=100.0, description="Heat Stress Risk Score (0-100)")
    heat_stress_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    
    respiratory_risk: float = Field(..., ge=0.0, le=100.0, description="Respiratory Risk Score (0-100)")
    respiratory_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    
    cardiovascular_stress: float = Field(..., ge=0.0, le=100.0, description="Cardiovascular Stress Score (0-100)")
    cardiovascular_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    
    fatigue_risk: float = Field(..., ge=0.0, le=100.0, description="Fatigue Risk Score (0-100)")
    fatigue_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    
    contributing_factors: List[RiskFactor] = Field(default_factory=list)
    primary_concern: Optional[str] = None
    explanation: str
    recommendations: List[str] = Field(default_factory=list)
    alert_level: str = Field(default="NONE", description="NONE, INFO, WARNING, MODERATE, HIGH, CRITICAL")
    
    hr_deviation_pct: float = Field(default=0.0, description="Percentage deviation of HR from baseline")
    spo2_deviation_pct: float = Field(default=0.0, description="Percentage deviation of SpO2 from baseline")
    temp_deviation_deg: float = Field(default=0.0, description="Absolute deviation of temperature from baseline in °C")
    gsr_deviation_pct: float = Field(default=0.0, description="Percentage deviation of GSR from baseline")
    
    timestamp: float = Field(default_factory=time.time)
    is_simulated: bool = True
    disclaimer: str = (
        "SwastyaConnect is intended for wellness monitoring, risk awareness, and early-warning support. "
        "It is not a medical diagnostic device and does not replace professional medical advice or emergency services."
    )


class AlertEscalationState(BaseModel):
    """Current state in the false-positive reduced alert escalation state machine."""
    current_stage: str = "NORMAL"  # NORMAL, ANOMALY, MODERATE, HIGH, USER_CONFIRMATION, SOS_TRIGGERED
    persistence_count: int = 0
    confirmation_countdown_sec: int = 30
    last_event_time: float = Field(default_factory=time.time)
    active_anomaly_type: Optional[str] = None
    message: str = "All vitals are within normal physiological bounds."
    can_dismiss: bool = True
    can_snooze: bool = True


class TelephonyLog(BaseModel):
    """Log record for an outgoing IVRS voice call or emergency SMS."""
    id: str
    dispatch_type: str  # IVRS_VOICE_CALL, EMERGENCY_SMS
    recipient_name: str
    recipient_phone: str
    status: str  # QUEUED, DIALING, IN_PROGRESS, COMPLETED, DELIVERED, FAILED
    message_content: str
    timestamp: float = Field(default_factory=time.time)
    call_duration_sec: Optional[int] = None
    gateway_reference_id: Optional[str] = None


class EmergencySOSPayload(BaseModel):
    """Structured payload for emergency assistance."""
    alert_id: str
    timestamp: float = Field(default_factory=time.time)
    user_name: str
    risk_level: str
    primary_concern: str
    vitals_summary: Dict[str, Any]
    location: Optional[Dict[str, Any]] = None
    contacts_notified: List[EmergencyContact] = Field(default_factory=list)
    status: str = "PENDING"  # PENDING, USER_CONFIRMED, TIMEOUT_TRIGGERED, DISPATCHED, CANCELLED
    telephony_logs: List[TelephonyLog] = Field(default_factory=list)


class SimulationScenario(BaseModel):
    """Predefined simulation scenario details."""
    id: str
    name: str
    description: str
    vitals: WearableData
    environment: Dict[str, Any]


class SimulationScenarioRequest(BaseModel):
    """Request model to apply a simulation scenario or manual override."""
    scenario_id: Optional[str] = None
    custom_vitals: Optional[WearableData] = None
    custom_environment: Optional[EnvironmentalContext] = None


class HistoricalDataPoint(BaseModel):
    """Historical telemetry point for trends graphing."""
    timestamp: float
    time_label: str
    hr: float
    spo2: float
    skin_temp: float
    gsr: float
    overall_risk: float
    heat_stress_risk: float
    respiratory_risk: float
    cardiovascular_stress: float
    fatigue_risk: float


class ESP32SensorPayload(BaseModel):
    """Raw sensor readings ingested from ESP32 microcontroller with flexible key mapping."""
    hr: Optional[float] = None
    heart_rate: Optional[float] = None
    bpm: Optional[float] = None
    
    spo2: Optional[float] = None
    oxygen: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    
    temp: Optional[float] = None
    skin_temp: Optional[float] = None
    temperature: Optional[float] = None
    body_temp: Optional[float] = None
    
    gsr: Optional[float] = None
    skin_conductance: Optional[float] = None
    
    temp_sensor_disconnected: bool = False
    device_id: Optional[str] = "ESP32_WIFI"
    timestamp: Optional[float] = None

    def to_wearable_data(self) -> WearableData:
        resolved_hr = self.hr if self.hr is not None else (self.heart_rate if self.heart_rate is not None else (self.bpm or 72.0))
        resolved_spo2 = self.spo2 if self.spo2 is not None else (self.oxygen if self.oxygen is not None else (self.oxygen_saturation or 98.0))
        resolved_temp = self.temp if self.temp is not None else (self.skin_temp if self.skin_temp is not None else (self.temperature if self.temperature is not None else (self.body_temp or 36.6)))
        resolved_gsr = self.gsr if self.gsr is not None else (self.skin_conductance if self.skin_conductance is not None else 4.5)
        
        return WearableData(
            hr=max(0.0, min(300.0, float(resolved_hr))),
            spo2=max(0.0, min(100.0, float(resolved_spo2))),
            skin_temp=max(0.0, min(60.0, float(resolved_temp))),
            gsr=max(0.0, min(5000.0, float(resolved_gsr))),
            timestamp=self.timestamp or time.time(),
            is_simulated=False,
            signal_quality=0.99,
            temp_sensor_disconnected=self.temp_sensor_disconnected
        )




class MLRiskDetectionRequest(BaseModel):
    """Optional manual override or custom vitals for ML risk evaluation."""
    hr: Optional[float] = None
    spo2: Optional[float] = None
    temp: Optional[float] = None
    skin_temp: Optional[float] = None
    gsr: Optional[float] = None
    recipient_phone: Optional[str] = None
    recipient_name: Optional[str] = None


class MLDetectionResponse(BaseModel):
    """Output from the Random Forest ML risk detector and automated emergency call trigger."""
    risk_score: float
    risk_level: str
    is_abnormal: bool
    threshold: float = 50.0
    vitals_analyzed: Dict[str, float]
    low_risk_prob: float
    high_risk_prob: float
    model_type: str = "RandomForestClassifier"
    call_dispatched: bool = False
    call_recipient: Optional[str] = None
    call_recipient_name: Optional[str] = None
    call_sid: Optional[str] = None
    call_status: Optional[str] = None
    message: str
    db_saved: bool = False
    db_record_id: Optional[int] = None
    db_message: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

