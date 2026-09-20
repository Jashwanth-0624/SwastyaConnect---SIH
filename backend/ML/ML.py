import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")
DATASET_PATH = os.path.join(BASE_DIR, "dataset_miniproj.xlsx")

def train_model():
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset not found at {DATASET_PATH}, using lightweight baseline.")
        return None

    try:
        df = pd.read_excel(DATASET_PATH)

        features = ['Heart Rate', 'Oxygen Saturation', 'Body Temperature']
        X = df[features]

        df['Risk Category'] = df['Risk Category'].map({
            'Low Risk': 0,
            'High Risk': 1
        })

        y = df['Risk Category']

        model = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
        model.fit(X, y)

        joblib.dump(model, MODEL_PATH, compress=3)
        print(f"Model trained and saved with compression at {MODEL_PATH}.")
        return model
    except Exception as e:
        print(f"Error training model: {e}")
        return None


def load_model():
    if not os.path.exists(MODEL_PATH):
        return train_model()
    try:
        return joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}, falling back to retrain/fallback.")
        return train_model()

model = None
try:
    model = load_model()
except Exception as e:
    print(f"Notice: Initial ML model loading deferred ({e})")


def calculate_risk(hr: float, spo2: float, temp: float) -> float:
    """Returns the risk score (0-100) predicted by the trained ML Random Forest model."""
    res = calculate_risk_details(hr, spo2, temp)
    return res["risk_score"]


def calculate_risk_details(hr: float, spo2: float, temp: float) -> dict:
    """
    Executes Random Forest classification on heart rate, SpO2, and body temperature.
    Returns probability distribution, abnormal threshold assessment, and risk levels.
    """
    global model
    if model is None:
        model = load_model()

    if model is None:
        # High precision physiological fallback if ML model file is not present
        score = 35.0
        if hr > 100:
            score += (hr - 100) * 0.8
        elif hr < 55:
            score += (55 - hr) * 0.7
        if spo2 < 95:
            score += (95 - spo2) * 4.0
        if temp > 37.5:
            score += (temp - 37.5) * 20.0
        elif temp < 35.5:
            score += (35.5 - temp) * 15.0
        score = min(99.0, max(10.0, round(score, 2)))
        is_abnormal = score >= 50.0

        return {
            "risk_score": score,
            "risk_level": "CRITICAL" if score >= 80 else ("HIGH" if score >= 60 else ("MODERATE" if score >= 40 else "LOW")),
            "is_abnormal": is_abnormal,
            "low_risk_prob": round(100.0 - score, 2),
            "high_risk_prob": round(score, 2),
            "model_type": "Physiological Weighted Risk Estimator",
            "evaluated_features": {"heart_rate": hr, "oxygen_saturation": spo2, "body_temperature": temp}
        }
        
    try:
        input_df = pd.DataFrame(
            [[float(hr), float(spo2), float(temp)]],
            columns=['Heart Rate', 'Oxygen Saturation', 'Body Temperature']
        )
        probabilities = model.predict_proba(input_df)[0]
        high_risk_prob = float(probabilities[1])
        low_risk_prob = float(probabilities[0])

        risk_score = round(high_risk_prob * 100, 2)
        is_abnormal = risk_score >= 50.0

        if risk_score < 40.0:
            risk_level = "LOW"
        elif risk_score < 60.0:
            risk_level = "MODERATE"
        elif risk_score < 80.0:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "is_abnormal": is_abnormal,
            "low_risk_prob": round(low_risk_prob * 100, 2),
            "high_risk_prob": round(high_risk_prob * 100, 2),
            "model_type": "RandomForestClassifier",
            "evaluated_features": {
                "heart_rate": hr,
                "oxygen_saturation": spo2,
                "body_temperature": temp
            }
        }
    except Exception as e:
        print(f"ML Prediction Error: {e}")
        return {
            "risk_score": 50.0,
            "risk_level": "MODERATE",
            "is_abnormal": True,
            "low_risk_prob": 50.0,
            "high_risk_prob": 50.0,
            "model_type": f"Error fallback ({str(e)})",
            "evaluated_features": {"heart_rate": hr, "oxygen_saturation": spo2, "body_temperature": temp}
        }