-- SwastyaConnect Database Schema
-- Run this script in pgAdmin or psql to initialize the PostgreSQL database and tables.

-- Create database (if executing on local PostgreSQL):
-- CREATE DATABASE swasthya_db;
-- \c swasthya_db;

-- Health Risk Detections Table
CREATE TABLE IF NOT EXISTS health_risk_detections (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    timestamp DOUBLE PRECISION NOT NULL,
    hr DOUBLE PRECISION NOT NULL,
    spo2 DOUBLE PRECISION NOT NULL,
    temp DOUBLE PRECISION NOT NULL,
    gsr DOUBLE PRECISION NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    is_abnormal BOOLEAN NOT NULL,
    low_risk_prob DOUBLE PRECISION,
    high_risk_prob DOUBLE PRECISION,
    model_type VARCHAR(100),
    call_dispatched BOOLEAN DEFAULT FALSE,
    call_sid VARCHAR(100),
    call_status VARCHAR(100),
    call_recipient VARCHAR(50),
    message TEXT
);

-- Optimized Index for Fast Historical Querying and Dashboard Feeds
CREATE INDEX IF NOT EXISTS idx_health_risk_created_at 
ON health_risk_detections (created_at DESC);

-- Optional: Sample verification query
-- SELECT COUNT(*) FROM health_risk_detections;
