"""
SwastyaConnect — PostgreSQL Database Service
Manages connection and persistent storage for live sensor risk detections.
Supports both local PostgreSQL (with pgAdmin) and Cloud PostgreSQL (Neon, Supabase, Vercel Postgres, Render).
"""

import os
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from dotenv import load_dotenv
from urllib.parse import urlparse

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    PSYCOPG2_AVAILABLE = True
except ImportError:
    psycopg2 = None
    RealDictCursor = None
    ISOLATION_LEVEL_AUTOCOMMIT = None
    PSYCOPG2_AVAILABLE = False

load_dotenv()

# Default to the local instance (PostgreSQL 17 on 5433 or user's custom DATABASE_URL)
DEFAULT_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/swasthya_db"
)


class DatabaseService:
    def __init__(self, db_url: str = DEFAULT_DATABASE_URL):
        self._table_initialized = False

    @property
    def db_url(self) -> str:
        """Dynamically reads DATABASE_URL from environment with scheme normalization."""
        raw_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/swasthya_db")
        # Normalize postgres:// to postgresql:// for compatibility with psycopg2
        if raw_url.startswith("postgres://"):
            raw_url = "postgresql://" + raw_url[len("postgres://"):]
        return raw_url

    def _ensure_database_exists(self):
        """Auto-creates target database on local PostgreSQL instances if needed."""
        if not PSYCOPG2_AVAILABLE:
            return

        try:
            parsed = urlparse(self.db_url)
            hostname = parsed.hostname or ''
            # Only perform auto-creation on local servers; cloud servers manage databases via cloud consoles
            if hostname not in ('localhost', '127.0.0.1', '::1'):
                return

            dbname = parsed.path.lstrip('/') or 'postgres'
            if dbname == 'postgres':
                return

            try:
                test_conn = psycopg2.connect(self.db_url, connect_timeout=2)
                test_conn.close()
                return
            except psycopg2.OperationalError as e:
                if "does not exist" in str(e):
                    maint_url = self.db_url.replace(f"/{dbname}", "/postgres")
                    mconn = psycopg2.connect(maint_url, connect_timeout=3)
                    mconn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                    with mconn.cursor() as cur:
                        cur.execute(f'CREATE DATABASE "{dbname}";')
                    mconn.close()
                    print(f"[DatabaseService] [OK] Auto-created database '{dbname}' on PostgreSQL server.")
        except Exception:
            pass

    def _get_connection(self):
        """Creates and returns a connection to PostgreSQL."""
        if not PSYCOPG2_AVAILABLE:
            raise RuntimeError("psycopg2 is not installed in the current environment.")
        self._ensure_database_exists()
        return psycopg2.connect(self.db_url, connect_timeout=5)

    def init_db(self) -> bool:
        """Creates the health_risk_detections table if it does not already exist."""
        if not PSYCOPG2_AVAILABLE:
            print("[DatabaseService] [WARN] psycopg2 unavailable. Database logging inactive.")
            return False

        create_table_query = """
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

        CREATE INDEX IF NOT EXISTS idx_health_risk_created_at 
        ON health_risk_detections (created_at DESC);
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(create_table_query)
                conn.commit()
            self._table_initialized = True
            print(f"[DatabaseService] [OK] PostgreSQL connected & table 'health_risk_detections' verified.")
            return True
        except Exception as e:
            print(f"[DatabaseService] [WARN] Could not initialize database schema: {e}")
            return False

    def save_detection(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Persists an ML risk detection evaluation into the PostgreSQL database.
        """
        if not PSYCOPG2_AVAILABLE:
            return {"success": False, "record_id": None, "created_at": None, "error": "psycopg2 not installed"}

        if not self._table_initialized:
            self.init_db()

        vitals = data.get("vitals_analyzed", {})
        hr = float(vitals.get("hr", 0.0))
        spo2 = float(vitals.get("spo2", 0.0))
        temp = float(vitals.get("temp", 0.0))
        gsr = float(vitals.get("gsr", 0.0))

        insert_query = """
        INSERT INTO health_risk_detections (
            timestamp, hr, spo2, temp, gsr, risk_score, risk_level,
            is_abnormal, low_risk_prob, high_risk_prob, model_type,
            call_dispatched, call_sid, call_status, call_recipient, message
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id, created_at;
        """

        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        insert_query,
                        (
                            data.get("timestamp", time.time()),
                            hr,
                            spo2,
                            temp,
                            gsr,
                            float(data.get("risk_score", 0.0)),
                            str(data.get("risk_level", "NORMAL")),
                            bool(data.get("is_abnormal", False)),
                            float(data.get("low_risk_prob", 0.0)),
                            float(data.get("high_risk_prob", 0.0)),
                            str(data.get("model_type", "RandomForestClassifier")),
                            bool(data.get("call_dispatched", False)),
                            data.get("call_sid"),
                            data.get("call_status"),
                            data.get("call_recipient"),
                            data.get("message")
                        )
                    )
                    row = cur.fetchone()
                    conn.commit()
                    record_id = row[0]
                    created_at = row[1].isoformat() if hasattr(row[1], "isoformat") else str(row[1])

                    print(f"[DatabaseService] [SAVED] Detection #{record_id} to PostgreSQL (Risk: {data.get('risk_score')}%, Abnormal: {data.get('is_abnormal')})")
                    return {
                        "success": True,
                        "record_id": record_id,
                        "created_at": created_at,
                        "error": None
                    }
        except Exception as e:
            print(f"[DatabaseService] [ERROR] Failed to persist detection to PostgreSQL: {e}")
            return {
                "success": False,
                "record_id": None,
                "created_at": None,
                "error": str(e)
            }

    def get_recent_detections(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves the most recent health risk detection logs from PostgreSQL."""
        if not PSYCOPG2_AVAILABLE:
            return []

        if not self._table_initialized:
            self.init_db()

        query = """
        SELECT 
            id,
            to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_time,
            timestamp,
            hr,
            spo2,
            temp,
            gsr,
            risk_score,
            risk_level,
            is_abnormal,
            low_risk_prob,
            high_risk_prob,
            model_type,
            call_dispatched,
            call_sid,
            call_status,
            call_recipient,
            message
        FROM health_risk_detections
        ORDER BY id DESC
        LIMIT %s;
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(query, (limit,))
                    rows = cur.fetchall()
                    return [dict(r) for r in rows]
        except Exception as e:
            print(f"[DatabaseService] [WARN] Query error: {e}")
            return []

    def get_status(self) -> Dict[str, Any]:
        """Returns the PostgreSQL connection health and statistics."""
        if not PSYCOPG2_AVAILABLE:
            return {
                "connected": False,
                "error": "psycopg2 library not available",
                "status": "OFFLINE",
                "hint": "Install psycopg2-binary package."
            }

        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT version();")
                    ver = cur.fetchone()[0]
                    
                    cur.execute("SELECT current_database(), inet_server_port(), inet_server_addr();")
                    db_info = cur.fetchone()

                    cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'health_risk_detections';")
                    exists = cur.fetchone()[0] > 0

                    count = 0
                    if exists:
                        cur.execute("SELECT COUNT(*) FROM health_risk_detections;")
                        count = cur.fetchone()[0]

                    # Mask password for display
                    masked_url = self.db_url
                    if "@" in masked_url and "://" in masked_url:
                        prefix, rest = masked_url.split("://", 1)
                        creds, host_part = rest.split("@", 1)
                        if ":" in creds:
                            user, _ = creds.split(":", 1)
                            masked_url = f"{prefix}://{user}:******@{host_part}"

                    return {
                        "connected": True,
                        "database": db_info[0] if db_info else "unknown",
                        "port": db_info[1] if db_info else 5433,
                        "server_version": ver,
                        "table_exists": exists,
                        "total_detections_stored": count,
                        "connection_string_masked": masked_url,
                        "status": "ONLINE"
                    }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "status": "OFFLINE",
                "hint": "Check if PostgreSQL service is running and DATABASE_URL credentials match."
            }


db_service = DatabaseService()
