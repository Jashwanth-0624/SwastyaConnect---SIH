/**
 * SwastyaConnect — Local Offline Storage Service
 * Manages local persistence for user profiles, emergency contacts,
 * historical vitals telemetry, baseline configurations, and cached weather.
 * Zero unconsented cloud egress.
 */

const STORAGE_KEYS = {
  PROFILE: 'swastyaconnect_user_profile',
  BASELINE: 'swastyaconnect_baseline',
  CACHED_ENV: 'swastyaconnect_cached_env',
  TELEMETRY_LOGS: 'swastyaconnect_telemetry_history',
  PRIVACY_SETTINGS: 'swastyaconnect_privacy'
};

export const storageService = {
  getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return {
      userId: 'user_default',
      name: 'Jashwanth',
      ageGroup: 'ADULT',
      vulnerabilityMode: 'GENERAL', // GENERAL, ELDERLY, OUTDOOR_WORKER, DISASTER_RESPONDER
      emergencyContacts: [
        { id: 'ec1', name: 'Primary Emergency Contact', phone: '+91 83108 17516', relationship: 'Primary Contact', isPrimary: true },
        { id: 'ec2', name: 'Priya (Family)', phone: '+91 98123 45678', relationship: 'Family', isPrimary: false }
      ],
      caregiverName: 'Primary Contact',
      caregiverPhone: '+91 83108 17516',

      emergencyLocationSharing: false,
      cloudSyncOptIn: false,
      alertSensitivity: 'NORMAL'
    };
  },

  saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  getCachedEnvironment() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CACHED_ENV);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return {
      ambient_temp: 33.5,
      humidity: 52.0,
      aqi: 110,
      pm25: 42.0,
      weather_condition: 'Hazy Sunshine',
      disaster_type: 'NONE',
      disaster_severity: 'NONE',
      location_name: 'New Delhi, India',
      is_cached: true,
      timestamp: Date.now() / 1000
    };
  },

  saveCachedEnvironment(env) {
    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_ENV, JSON.stringify({ ...env, is_cached: true }));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  },

  getTelemetryHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TELEMETRY_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return [];
  },

  appendTelemetryPoint(point) {
    try {
      const history = this.getTelemetryHistory();
      history.push(point);
      // Keep last 100 points
      if (history.length > 100) history.shift();
      localStorage.setItem(STORAGE_KEYS.TELEMETRY_LOGS, JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }
};
