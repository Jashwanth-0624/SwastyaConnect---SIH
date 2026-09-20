"""
SwastyaConnect — Health & Risk Analysis Router
Provides endpoints for AI inference, baseline parameters, historical trends, and daily summaries.
"""

from fastapi import APIRouter, Query
from typing import List, Optional
import time
from ..models.schemas import (
    RiskAnalysisResult,
    PersonalBaseline,
    HistoricalDataPoint,
    UserProfile,
    MLDetectionResponse,
    MLRiskDetectionRequest
)
from ..services.risk_engine import risk_engine
from ..services.baseline_engine import baseline_engine
from ..services.simulation_service import simulation_service
from ..services.disaster_service import disaster_service
from ..services.alert_service import alert_service
from ..services.telephony_service import telephony_service
from ..services.db_service import db_service
from ..ML.ML import calculate_risk_details

router = APIRouter(prefix="/api/health", tags=["Health & Risk Engine"])

# In-memory default profile
current_user_profile = UserProfile()



@router.get("/analyze", response_model=RiskAnalysisResult)
async def analyze_current_health():
    """
    Executes the multi-sensor AI/rule-based risk inference engine.
    Fuses current wearable readings, personal baseline, and environmental context.
    Also updates the alert escalation pipeline.
    """
    vitals = simulation_service.read_latest()
    env = disaster_service.get_current_environment()
    risk_output = risk_engine.analyze_health_state(vitals, env, current_user_profile)
    
    # Update alert escalation service
    alert_service.process_risk_assessment(risk_output, current_user_profile)
    
    return risk_output


@router.get("/baseline", response_model=PersonalBaseline)
async def get_personal_baseline():
    """Returns the learned 'Your Normal' dynamic baseline bounds."""
    return baseline_engine.baseline


@router.post("/baseline/reset", response_model=PersonalBaseline)
async def reset_personal_baseline():
    """Resets the baseline engine back to default population priors."""
    baseline_engine.baseline = PersonalBaseline()
    return baseline_engine.baseline


@router.get("/trends", response_model=List[HistoricalDataPoint])
async def get_health_trends(timeframe: str = Query("TODAY", pattern="^(TODAY|7D|30D)$")):
    """Returns historical multi-vital and risk progression curves for charting."""
    return simulation_service.generate_historical_trends(timeframe)


@router.get("/daily-summary")
async def get_daily_summary():
    """Returns formatted daily wellness summary and timeline insight."""
    vitals = simulation_service.read_latest()
    env = disaster_service.get_current_environment()
    risk = risk_engine.analyze_health_state(vitals, env, current_user_profile)
    
    return {
        "date": time.strftime("%A, %d %B %Y"),
        "overall_health_risk": risk.overall_level,
        "overall_score": risk.overall_risk,
        "heart_rate_summary": f"Average {baseline_engine.baseline.hr_baseline:.0f} BPM (range: {baseline_engine.baseline.hr_min:.0f}–{baseline_engine.baseline.hr_max:.0f} BPM)",
        "temperature_summary": f"Normal diurnal curve ({baseline_engine.baseline.skin_temp_baseline:.1f}°C typical)",
        "gsr_summary": f"Baseline {baseline_engine.baseline.gsr_baseline:.1f} µS with temporary afternoon conductance shifts",
        "heat_stress_summary": f"Heat Risk peaked at {risk.heat_stress_risk:.0f}/100 during midday ambient exposure",
        "respiratory_summary": f"Blood oxygenation stable at {vitals.spo2:.0f}% with current AQI {env.aqi}",
        "daily_insight": (
            "Physiological metrics remained well-coupled to ambient temperature changes. "
            "Hydration and shaded rest intervals successfully prevented sustained thermal drift."
        ),
        "disclaimer": risk.disclaimer
    }


@router.post("/detect-ml-risk", response_model=MLDetectionResponse)
async def detect_ml_risk(req: Optional[MLRiskDetectionRequest] = None):
    """
    Executes real-time risk classification using the Random Forest ML model on sensor telemetry.
    If the ML model indicates abnormal risk (risk_score >= 50.0%), automatically triggers
    an automated emergency IVRS phone call and SMS alert to the configured primary emergency contact.
    """
    # 1. Obtain current sensor vitals
    current_telemetry = simulation_service.read_latest()
    
    # Allow manual override if supplied in request
    hr = req.hr if (req and req.hr is not None) else current_telemetry.hr
    spo2 = req.spo2 if (req and req.spo2 is not None) else current_telemetry.spo2
    temp = (req.temp if req.temp is not None else req.skin_temp) if (req and (req.temp is not None or req.skin_temp is not None)) else current_telemetry.skin_temp
    gsr = req.gsr if (req and req.gsr is not None) else current_telemetry.gsr

    # 2. Check if finger is placed on pulse oximeter
    if hr <= 10.0 or spo2 <= 10.0:
        return MLDetectionResponse(
            risk_score=0.0,
            risk_level="SENSOR_WAITING",
            is_abnormal=False,
            threshold=50.0,
            vitals_analyzed={
                "hr": round(float(hr), 1),
                "spo2": round(float(spo2), 1),
                "temp": round(float(temp), 2),
                "gsr": round(float(gsr), 2)
            },
            low_risk_prob=100.0,
            high_risk_prob=0.0,
            model_type="MAX30102 Sensor Waiting",
            call_dispatched=False,
            message="⚠️ Finger not detected on MAX30102 sensor (HR/SpO2 reading 0). Place finger firmly on sensor to detect risk.",
            timestamp=time.time()
        )

    # 3. Run Random Forest ML Model Inference
    ml_result = calculate_risk_details(hr, spo2, temp)
    risk_score = ml_result["risk_score"]
    risk_level = ml_result["risk_level"]
    is_abnormal = ml_result["is_abnormal"]

    # 4. Emergency Telephony Escalation if Abnormal (Score >= 50%)

    call_dispatched = False
    call_sid = None
    call_status = None
    recipient_phone = None
    recipient_name = None

    if is_abnormal:
        # Resolve emergency contact
        recipient_phone = req.recipient_phone if (req and req.recipient_phone) else (
            current_user_profile.caregiver_phone or
            (current_user_profile.emergency_contacts[0].phone if current_user_profile.emergency_contacts else "+918310817516")
        )
        recipient_name = req.recipient_name if (req and req.recipient_name) else (
            current_user_profile.caregiver_name or
            (current_user_profile.emergency_contacts[0].name if current_user_profile.emergency_contacts else "Primary Emergency Contact")
        )

        speech_script = (
            f"Emergency Alert from SwastyaConnect AI. "
            f"Abnormal physiological health risk has been detected by the Random Forest model for {current_user_profile.name}. "
            f"Calculated Risk Score is {risk_score:.1f} percent with severity {risk_level}. "
            f"Sensor readings: Heart Rate {round(hr)} beats per minute, Blood Oxygen {round(spo2)} percent, "
            f"Skin Temperature {temp:.1f} degrees Celsius, Galvanic Skin Response {gsr:.1f} micro-Siemens. "
            f"Please verify patient safety immediately."
        )

        try:
            # Place outbound automated IVRS phone call
            call_log = await telephony_service.trigger_ivrs_call(
                recipient_name=recipient_name,
                recipient_phone=recipient_phone,
                speech_script=speech_script
            )
            telephony_service.dispatch_history.append(call_log)
            call_dispatched = True
            call_sid = call_log.gateway_reference_id
            call_status = call_log.status

            # Send accompanying SMS text
            sms_text = (
                f"🚨 [SwastyaConnect ML Alert]\n"
                f"Abnormal health risk ({risk_score:.0f}/100, {risk_level}) detected for {current_user_profile.name}!\n"
                f"Vitals: HR {round(hr)} BPM | SpO2 {round(spo2)}% | Temp {temp:.1f}°C | GSR {gsr:.1f}µS\n"
                f"Automated voice call placed to {recipient_phone}.\n"
                f"Time: {time.strftime('%I:%M:%S %p')}"
            )
            sms_log = await telephony_service.send_emergency_sms(
                recipient_name=recipient_name,
                recipient_phone=recipient_phone,
                message_text=sms_text
            )
            telephony_service.dispatch_history.append(sms_log)
        except Exception as e:
            print(f"[Telephony Trigger Error]: {e}")
            call_status = f"Error: {e}"

        msg = (
            f"🚨 Abnormal risk detected by ML Model ({risk_score:.1f}% - {risk_level})! "
            f"Automated emergency call dispatched to {recipient_phone} ({call_status or 'IN_PROGRESS'})."
        )
    else:
        msg = f"Physiological vitals evaluated as Normal by Random Forest ML Model ({risk_score:.1f}% risk score). No emergency call required."

    # 5. Persist detection record into local PostgreSQL database
    db_record_id = None
    db_saved = False
    db_msg = None
    try:
        detection_payload = {
            "timestamp": time.time(),
            "vitals_analyzed": {
                "hr": round(float(hr), 1),
                "spo2": round(float(spo2), 1),
                "temp": round(float(temp), 2),
                "gsr": round(float(gsr), 2)
            },
            "risk_score": risk_score,
            "risk_level": risk_level,
            "is_abnormal": is_abnormal,
            "low_risk_prob": ml_result["low_risk_prob"],
            "high_risk_prob": ml_result["high_risk_prob"],
            "model_type": ml_result["model_type"],
            "call_dispatched": call_dispatched,
            "call_sid": call_sid,
            "call_status": call_status,
            "call_recipient": recipient_phone,
            "message": msg
        }
        save_res = db_service.save_detection(detection_payload)
        db_saved = save_res.get("success", False)
        db_record_id = save_res.get("record_id")
        db_msg = f"Saved as Record #{db_record_id}" if db_saved else save_res.get("error")
    except Exception as e:
        print(f"[DB Error in detect_ml_risk]: {e}")
        db_msg = str(e)

    return MLDetectionResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        is_abnormal=is_abnormal,
        threshold=50.0,
        vitals_analyzed={
            "hr": round(float(hr), 1),
            "spo2": round(float(spo2), 1),
            "temp": round(float(temp), 2),
            "gsr": round(float(gsr), 2)
        },
        low_risk_prob=ml_result["low_risk_prob"],
        high_risk_prob=ml_result["high_risk_prob"],
        model_type=ml_result["model_type"],
        call_dispatched=call_dispatched,
        call_recipient=recipient_phone,
        call_recipient_name=recipient_name,
        call_sid=call_sid,
        call_status=call_status,
        message=msg,
        db_saved=db_saved,
        db_record_id=db_record_id,
        db_message=db_msg,
        timestamp=time.time()
    )


@router.get("/detect-ml-risk", response_model=MLDetectionResponse)
async def get_detect_ml_risk():
    """GET convenience endpoint to trigger ML detection on current live sensor vitals."""
    return await detect_ml_risk(None)


@router.get("/detections")
async def get_detection_history(limit: int = Query(20, ge=1, le=100)):
    """Retrieves recent health risk detection records stored in the local PostgreSQL database."""
    return db_service.get_recent_detections(limit)


@router.get("/db-status")
async def get_database_status():
    """Checks the status and metadata of the local PostgreSQL connection."""
    return db_service.get_status()


