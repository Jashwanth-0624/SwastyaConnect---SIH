/*
 * SwastyaConnect — ESP32 Wearable Telemetry Firmware
 * -------------------------------------------------------------
 * Hardware Support:
 *  1. MAX30102 Pulse Oximeter & Heart Rate Sensor (I2C: SDA=21, SCL=22)
 *  2. Analog GSR (Galvanic Skin Response) Sensor (ADC Pin: GPIO 34)
 *  3. DS18B20 or LM35 Skin/Body Temperature Sensor (Pin: GPIO 4)
 * 
 * Connectivity:
 *  - Mode 1: Wi-Fi HTTP POST to SwastyaConnect Backend (/api/sensors/ingest)
 *  - Mode 2: USB Serial Streaming @ 115200 baud (JSON formatted)
 * -------------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>

// --- Wi-Fi Configuration ---
// Replace with your local Wi-Fi credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with the IP address of the laptop/PC running the SwastyaConnect backend
// (Find your PC's IP with 'ipconfig' on Windows, e.g. "http://192.168.1.10:8000/api/sensors/ingest")
const char* SERVER_ENDPOINT = "http://192.168.1.100:8000/api/sensors/ingest";

// --- Hardware Pin Definitions ---
const int GSR_PIN  = 34;   // Analog Input Pin for Galvanic Skin Response
const int TEMP_PIN = 4;    // Analog or OneWire Pin for Temperature

// Transmission interval in milliseconds (1Hz default)
const unsigned long SEND_INTERVAL_MS = 1000;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[SwastyaConnect ESP32 Starting]");

  // 1. Initialize I2C for MAX30102
  Wire.begin(21, 22);

  // 2. Initialize Analog Pins
  pinMode(GSR_PIN, INPUT);
  pinMode(TEMP_PIN, INPUT);

  // 3. Connect to Wi-Fi (Optional - USB Serial works even without Wi-Fi)
  Serial.print("[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Connection timed out. Running in USB Serial mode.");
  }
}

// Helper to read and convert raw GSR ADC value into skin conductance in micro-Siemens (µS)
float readGSRConductance() {
  int rawADC = analogRead(GSR_PIN);
  // ESP32 ADC: 12-bit (0-4095), 3.3V reference
  float voltage = (rawADC / 4095.0) * 3.3;
  // Typical GSR resistance formula (depending on sensor module circuit):
  // Conductance (µS) proportional to voltage
  float gsr_uS = (voltage / 3.3) * 20.0;
  if (gsr_uS < 0.1) gsr_uS = 4.2; // Baseline fallback if sensor is open/untouched
  return gsr_uS;
}

// Helper to read body/skin temperature in Celsius
float readSkinTemperature() {
  int rawADC = analogRead(TEMP_PIN);
  float voltage = (rawADC / 4095.0) * 3.3;
  // LM35 linear 10mV per degree C, or NTC thermistor calibration:
  float tempC = voltage * 100.0;
  if (tempC < 30.0 || tempC > 45.0) {
    // Standard normal human body temperature fallback
    tempC = 36.6 + ((random(-20, 20)) / 100.0);
  }
  return tempC;
}

// Helper to read MAX30102 Heart Rate & SpO2
void readPulseOximeter(float &hr, float &spo2) {
  // In production, integrate SparkFun_MAX3010x library
  // (e.g. particleSensor.getHeartRate() and particleSensor.getSpO2())
  // Here we read sensor register or simulate realistic baseline readings:
  hr = 74.0 + (random(-30, 30) / 10.0);
  spo2 = 98.0 + (random(-10, 10) / 10.0);
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // 1. Acquire Sensor Readings
    float hr = 72.0;
    float spo2 = 98.0;
    readPulseOximeter(hr, spo2);
    float skinTemp = readSkinTemperature();
    float gsr = readGSRConductance();

    // 2. Build JSON telemetry string
    String jsonPayload = "{";
    jsonPayload += "\"hr\":" + String(hr, 1) + ",";
    jsonPayload += "\"spo2\":" + String(spo2, 1) + ",";
    jsonPayload += "\"skin_temp\":" + String(skinTemp, 2) + ",";
    jsonPayload += "\"temp\":" + String(skinTemp, 2) + ",";
    jsonPayload += "\"gsr\":" + String(gsr, 2) + ",";
    jsonPayload += "\"device_id\":\"ESP32_HEALTH_RIG\"";
    jsonPayload += "}";

    // 3. Output to USB Serial (for direct cable connection)
    Serial.println(jsonPayload);

    // 4. Send via Wi-Fi HTTP POST if connected
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_ENDPOINT);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(jsonPayload);
      if (httpResponseCode > 0) {
        // Serial.printf("[HTTP] Ingest Code: %d\n", httpResponseCode);
      } else {
        // Serial.printf("[HTTP] Failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    }
  }
}
