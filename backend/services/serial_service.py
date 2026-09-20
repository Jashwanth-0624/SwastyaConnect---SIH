"""
SwastyaConnect — Serial Communication Service for ESP32
Allows direct USB cable connection to ESP32 microcontrollers.
Auto-parses serial streams formatted as JSON or CSV into validated WearableData.
"""

import json
import re
import threading
import time
from typing import Dict, List, Optional, Any

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    serial = None
    SERIAL_AVAILABLE = False

from ..models.schemas import WearableData, ESP32SensorPayload
from .simulation_service import simulation_service
from .sensor_provider import signal_processor


class SerialManager:
    """Manages background USB serial connection to ESP32."""

    def __init__(self):
        self.serial_conn: Any = None
        self.active_port: Optional[str] = None
        self.active_baud: int = 115200
        self.is_running: bool = False
        self.worker_thread: Optional[threading.Thread] = None
        self.packets_received: int = 0
        self.last_packet_time: Optional[float] = None
        self.last_raw_line: str = ""
        self.last_error: Optional[str] = None

    def list_available_ports(self) -> List[Dict[str, str]]:
        """Returns all connected COM/Serial devices."""
        if not SERIAL_AVAILABLE or not hasattr(serial, 'tools'):
            return []
        try:
            ports = serial.tools.list_ports.comports()
            results = []
            for p in ports:
                results.append({
                    "port": p.device,
                    "description": p.description or "Unknown Serial Port",
                    "hardware_id": p.hwid or ""
                })
            return results
        except Exception as e:
            print(f"[SerialManager] Port scan error: {e}")
            return []

    def connect(self, port: str, baud: int = 115200) -> Dict[str, Any]:
        """Connects to specified COM port and launches reader daemon."""
        if not SERIAL_AVAILABLE:
            return {
                "success": False,
                "port": port,
                "error": "pyserial library is not available in this environment."
            }

        if self.serial_conn and hasattr(self.serial_conn, 'is_open') and self.serial_conn.is_open:
            self.disconnect()

        try:
            self.serial_conn = serial.Serial(port=port, baudrate=baud, timeout=2.0)
            self.active_port = port
            self.active_baud = baud
            self.is_running = True
            self.last_error = None

            self.worker_thread = threading.Thread(target=self._read_loop, daemon=True)
            self.worker_thread.start()

            return {
                "success": True,
                "port": port,
                "baud": baud,
                "message": f"Connected to ESP32 serial on {port} at {baud} baud."
            }
        except Exception as e:
            self.last_error = str(e)
            self.is_running = False
            return {
                "success": False,
                "port": port,
                "error": str(e)
            }

    def disconnect(self) -> Dict[str, Any]:
        """Disconnects serial port and halts worker thread."""
        self.is_running = False
        if self.serial_conn:
            try:
                self.serial_conn.close()
            except Exception:
                pass
            self.serial_conn = None

        prev_port = self.active_port
        self.active_port = None
        return {
            "success": True,
            "message": f"Disconnected from serial port {prev_port}."
        }

    def get_status(self) -> Dict[str, Any]:
        """Returns serial connection metrics."""
        is_open = (
            self.is_running and 
            self.serial_conn is not None and 
            hasattr(self.serial_conn, 'is_open') and 
            self.serial_conn.is_open
        )
        return {
            "connected": is_open,
            "port": self.active_port,
            "baudrate": self.active_baud,
            "packets_received": self.packets_received,
            "last_packet_time": self.last_packet_time,
            "last_raw_line": self.last_raw_line,
            "last_error": self.last_error
        }

    def _read_loop(self):
        """Continuous background reader parsing JSON or CSV lines from ESP32."""
        while self.is_running and self.serial_conn and hasattr(self.serial_conn, 'is_open') and self.serial_conn.is_open:
            try:
                line_bytes = self.serial_conn.readline()
                if not line_bytes:
                    continue
                line = line_bytes.decode('utf-8', errors='ignore').strip()
                if not line:
                    continue

                self.last_raw_line = line
                print(f"[RAW SERIAL LINE]: {repr(line)}")

                payload = self._parse_line(line)
                if payload:
                    wearable = payload.to_wearable_data()
                    cleaned = signal_processor.clean_and_smooth(wearable)
                    simulation_service.apply_hardware_vitals(cleaned)
                    self.packets_received += 1
                    self.last_packet_time = time.time()
                    print(f"[ESP32 Serial Feed] HR: {cleaned.hr}, SpO2: {cleaned.spo2}%, Temp: {cleaned.skin_temp}°C, GSR: {cleaned.gsr}µS")
            except Exception as e:
                if self.is_running:
                    self.last_error = str(e)
                time.sleep(0.1)

    def _parse_line(self, line: str) -> Optional[ESP32SensorPayload]:
        """Tries parsing line as key-value (HR:.. SPO2:.. TEMP:.. GSR:..), JSON, or CSV."""
        # 1. Try Key-Value formatted: HR:0,SPO2:0,TEMP:25.87,GSR:293
        if "HR" in line or "TEMP" in line or "GSR" in line or "SPO2" in line:
            try:
                m_hr = re.search(r"HR\s*[:=]\s*([-?\d.]+)", line, re.IGNORECASE)
                m_spo2 = re.search(r"SPO2\s*[:=]\s*([-?\d.]+)", line, re.IGNORECASE)
                m_temp = re.search(r"TEMP\s*[:=]\s*([-?\d.]+)", line, re.IGNORECASE)
                m_gsr = re.search(r"GSR\s*[:=]\s*([-?\d.]+)", line, re.IGNORECASE)

                if m_hr or m_temp or m_gsr or m_spo2:
                    hr = float(m_hr.group(1)) if m_hr else 0.0
                    spo2 = float(m_spo2.group(1)) if m_spo2 else 0.0
                    raw_temp = float(m_temp.group(1)) if m_temp else 36.6
                    raw_gsr = float(m_gsr.group(1)) if m_gsr else 4.5

                    # Handle DS18B20 -127.00 error code (sensor pin or pullup disconnected)
                    is_temp_disconnected = (raw_temp <= -100.0 or raw_temp < 0.0)
                    if is_temp_disconnected:
                        temp = 36.6  # Default physiological baseline when DS18B20 wire is disconnected
                    else:
                        temp = raw_temp

                    # Map raw ADC GSR (0-1023 or 0-4095) to conductance in micro-Siemens
                    if raw_gsr > 50.0:
                        gsr = round((raw_gsr / 1023.0) * 20.0, 2)
                        if gsr < 0.1:
                            gsr = 4.2
                    else:
                        gsr = raw_gsr

                    return ESP32SensorPayload(
                        hr=hr,
                        spo2=spo2,
                        temp=temp,
                        gsr=gsr,
                        temp_sensor_disconnected=is_temp_disconnected,
                        device_id="ESP32_SERIAL"
                    )

            except Exception as e:
                print(f"[Serial Parser Regex Error]: {e}")

        # 2. Try JSON
        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
                return ESP32SensorPayload(**data)
            except Exception:
                pass

        # 3. Try CSV: HR, SPO2, TEMP, GSR
        parts = [p.strip() for p in line.split(",")]
        if len(parts) >= 4:
            try:
                hr = float(parts[0])
                spo2 = float(parts[1])
                temp = float(parts[2])
                gsr = float(parts[3])
                return ESP32SensorPayload(hr=hr, spo2=spo2, temp=temp, gsr=gsr)
            except ValueError:
                pass

        return None

    def auto_connect(self) -> bool:
        """Auto-detects ESP32 on USB COM port (Silicon Labs CP210x, CH340, or COM9) and connects."""
        if not SERIAL_AVAILABLE or not hasattr(serial, 'tools'):
            return False
        try:
            ports = serial.tools.list_ports.comports()
            target_port = None
            for p in ports:
                desc = (p.description or "").lower()
                hwid = (p.hwid or "").lower()
                if "cp210" in desc or "cp210" in hwid or "ch340" in desc or "uart" in desc or p.device == "COM9":
                    target_port = p.device
                    break
            
            if target_port:
                print(f"[Serial] Auto-detected ESP32 on port {target_port}. Connecting at 9600 baud...")
                res = self.connect(target_port, baud=9600)
                return res.get("success", False)
        except Exception as e:
            print(f"[Serial] auto_connect scan notice: {e}")
        return False


serial_manager = SerialManager()

# Automatically attempt to connect to ESP32 on import / startup
try:
    serial_manager.auto_connect()
except Exception as e:
    print(f"[Serial Auto-Connect Notice]: {e}")
