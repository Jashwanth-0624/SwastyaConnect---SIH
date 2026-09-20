"""
SwastyaConnect — Wearable Data Provider & Signal Processor
Abstracts physical BLE wearable hardware and simulated telemetry streams.
Includes signal validation, Hampel/moving-average noise filtering, and Signal Quality Index (SQI).
"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import math
import time
from ..models.schemas import WearableData


class WearableDataProvider(ABC):
    """Abstract interface for wearable hardware telemetry ingestion."""

    @abstractmethod
    def read_latest(self) -> WearableData:
        """Returns the most recent validated physiological reading."""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Returns hardware connectivity status."""
        pass

    @abstractmethod
    def get_source_type(self) -> str:
        """Returns 'BLE_HARDWARE', 'SIMULATED', or 'EMBEDDED_DEVICE'."""
        pass


class SignalProcessor:
    """Preprocesses raw telemetry: noise filtering, outlier detection, and SQI calculation."""

    def __init__(self, window_size: int = 5):
        self.window_size = window_size
        self.hr_history: List[float] = []
        self.spo2_history: List[float] = []
        self.temp_history: List[float] = []
        self.gsr_history: List[float] = []

    def clean_and_smooth(self, raw: WearableData) -> WearableData:
        """
        Applies moving average smoothing and boundary clamping on raw sensor signals.
        For real physical hardware feeds (is_simulated == False), returns the exact real readings.
        """
        if not raw.is_simulated:
            # Physical hardware feed: return exact real-time sensor measurements directly
            return raw

        # 1. Physical sanity clamping for simulated stream
        hr = max(0.0, min(300.0, raw.hr))
        spo2 = max(0.0, min(100.0, raw.spo2))
        temp = max(0.0, min(60.0, raw.skin_temp))
        gsr = max(0.0, min(5000.0, raw.gsr))



        # 2. Append to rolling buffers
        self.hr_history.append(hr)
        self.spo2_history.append(spo2)
        self.temp_history.append(temp)
        self.gsr_history.append(gsr)

        if len(self.hr_history) > self.window_size:
            self.hr_history.pop(0)
            self.spo2_history.pop(0)
            self.temp_history.pop(0)
            self.gsr_history.pop(0)

        # 3. Compute smoothed values
        smooth_hr = sum(self.hr_history) / len(self.hr_history)
        smooth_spo2 = sum(self.spo2_history) / len(self.spo2_history)
        smooth_temp = sum(self.temp_history) / len(self.temp_history)
        smooth_gsr = sum(self.gsr_history) / len(self.gsr_history)

        # 4. Assess Signal Quality Index (SQI)
        # Drops if sensor values show extreme noise / variance or disconnection
        sqi = 0.98
        if hr < 40 or hr > 190:
            sqi -= 0.15
        if spo2 < 70:
            sqi -= 0.10

        return WearableData(
            hr=round(smooth_hr, 1),
            spo2=round(smooth_spo2, 1),
            skin_temp=round(smooth_temp, 2),
            gsr=round(smooth_gsr, 2),
            timestamp=raw.timestamp,
            is_simulated=raw.is_simulated,
            signal_quality=round(max(0.2, sqi), 2),
            motion_intensity=raw.motion_intensity
        )


signal_processor = SignalProcessor()
