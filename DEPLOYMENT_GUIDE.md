# 🚀 SwastyaConnect — Complete Vercel & PostgreSQL Deployment Guide

This guide walks you through deploying **SwastyaConnect** (React Frontend + FastAPI Backend + Random Forest ML Engine + PostgreSQL Database) to **Vercel** with full **pgAdmin** management.

---

## 📋 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Step 1: Set Up Cloud PostgreSQL Database](#step-1-set-up-cloud-postgresql-database)
3. [Step 2: Connect Cloud Database to pgAdmin on Your PC](#step-2-connect-cloud-database-to-pgadmin-on-your-pc)
4. [Step 3: Deploy to Vercel](#step-3-deploy-to-vercel)
5. [Step 4: Configure Environment Variables on Vercel](#step-4-configure-environment-variables-on-vercel)
6. [Step 5: Verify Your Live Deployment](#step-5-verify-your-live-deployment)
7. [Local Development (Zero Changes)](#local-development-zero-changes)

---

## 1. Overview & Architecture

SwastyaConnect is configured for **Unified Full-Stack Deployment** on Vercel:
- **Frontend**: React (Vite) built statically and served by Vercel's Edge CDN.
- **Backend**: FastAPI Python Serverless Function (`api/index.py`), handling all `/api/*` endpoints and ML inference.
- **ML Engine**: Compressed Random Forest Model (`risk_model.pkl`) bundled directly with instant load time.
- **Database**: PostgreSQL (managed via pgAdmin locally or connected to free Cloud PostgreSQL in production).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                   SwastyaConnect on Vercel                  │
   │                                                             │
   │  React UI (Vite) ──> /api/* ──> FastAPI (api/index.py)      │
   │                                           │                 │
   │                                    ML Risk Engine           │
   │                                           │                 │
   └───────────────────────────────────────────┼─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     Cloud PostgreSQL Database     │
                              │    (Neon / Supabase / Vercel)    │
                              │                ▲                 │
                              └────────────────┼─────────────────┘
                                               │
                                 ┌─────────────┴─────────────┐
                                 │   pgAdmin (on your PC)    │
                                 │   Inspect & Query Live    │
                                 └───────────────────────────┘
```

---

## Step 1: Set Up Cloud PostgreSQL Database

When your app is deployed to the cloud on Vercel, it needs a cloud-accessible PostgreSQL database. You can get a free managed PostgreSQL database in 30 seconds using **Neon** (or Supabase):

### Option A: Neon Postgres (Recommended — 100% Free, Instant)
1. Go to [https://neon.tech](https://neon.tech) and Sign Up (Free).
2. Click **Create Project**, name it `swasthya-db`.
3. Neon immediately generates your **Connection String** (`DATABASE_URL`).
   It looks like:
   ```
   postgresql://neondb_owner:YOUR_PASSWORD@ep-sweet-glade-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy this connection string (you will need it for Vercel and pgAdmin).

### Option B: Supabase (Free Alternative)
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Go to **Project Settings** → **Database** → Copy the **URI Connection String**.

---

## Step 2: Connect Cloud Database to pgAdmin on Your PC

You can manage your cloud PostgreSQL database in the **same pgAdmin application** on your computer:

1. Open **pgAdmin 4** on your PC.
2. In the left sidebar, right-click on **Servers** → **Register** → **Server...**
3. In the **General** tab:
   - **Name**: `SwastyaConnect Cloud (Neon)`
4. In the **Connection** tab (extract these from your Neon/Supabase connection string):
   - **Host name/address**: `ep-sweet-glade-12345.us-east-2.aws.neon.tech` (the part after `@` and before `/`)
   - **Port**: `5432`
   - **Maintenance database**: `neondb` (or the database name at the end of the URL)
   - **Username**: `neondb_owner` (the part before `:YOUR_PASSWORD`)
   - **Password**: `YOUR_PASSWORD` (check "Save password")
5. In the **Parameters** tab (or SSL tab):
   - Set **SSL mode** to `Require`.
6. Click **Save**.
7. In pgAdmin, open the **Query Tool** for your database, paste the SQL from [`database/schema.sql`](file:///c:/Users/Jashwanth%20R/Downloads/SwastyaConnect/database/schema.sql) and click **Execute (F5)** to create the tables. *(Note: The backend also auto-creates the tables on first request if they don't exist!)*

---

## Step 3: Deploy to Vercel

### Method 1: Deploy via GitHub (Recommended)
1. Push your project to a GitHub repository:
   ```powershell
   git init
   git add .
   git commit -m "Configure SwastyaConnect for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/SwastyaConnect.git
   git push -u origin main
   ```
2. Go to [https://vercel.com](https://vercel.com) and sign in.
3. Click **Add New...** → **Project**.
4. Import your **SwastyaConnect** GitHub repository.
5. Vercel will automatically detect `vercel.json` and configure both frontend and backend builds.
6. Click **Deploy**.

### Method 2: Deploy via Vercel CLI (Direct from Terminal)
1. Install Vercel CLI (if not already installed):
   ```powershell
   npm i -g vercel
   ```
2. In the project root directory (`SwastyaConnect`), run:
   ```powershell
   vercel
   ```
3. Follow the interactive prompts (select default options).
4. For production deployment:
   ```powershell
   vercel --prod
   ```

---

## Step 4: Configure Environment Variables on Vercel

In your Vercel Project Dashboard:
1. Go to **Settings** → **Environment Variables**.
2. Add the following variables:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` | Cloud PostgreSQL connection string |
| `TWILIO_ACCOUNT_SID` | `YOUR_TWILIO_ACCOUNT_SID` | Twilio Telephony Account SID |
| `TWILIO_AUTH_TOKEN` | `YOUR_TWILIO_AUTH_TOKEN` | Twilio Telephony Auth Token |
| `TWILIO_FROM_PHONE` | `+17372212163` | Twilio Outbound Emergency Caller ID |
| `TWILIO_VOICE_URL` | `https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition` | Twilio TwiML Speech Webhook |
| `ENVIRONMENT` | `production` | Deployment environment flag |

3. Click **Redeploy** on Vercel (or trigger a new git push) so the environment variables take effect.

---

## Step 5: Verify Your Live Deployment

Once deployed, open your live Vercel URL (e.g. `https://swastyaconnect.vercel.app`):

1. **Frontend UI**:
   - Access the dashboard at `https://swastyaconnect.vercel.app`.
   - Test changing vitals, triggering manual SOS, and running ML risk detection.
2. **Interactive API Documentation**:
   - Visit `https://swastyaconnect.vercel.app/docs` to see the live Swagger/OpenAPI documentation.
3. **Database Health Check**:
   - Visit `https://swastyaconnect.vercel.app/api/health/db-status` to verify that PostgreSQL is connected and reports `status: "ONLINE"`.
4. **Live ML Inference & Database Logging**:
   - Visit `https://swastyaconnect.vercel.app/api/health/detect-ml-risk` to execute Random Forest ML inference and log detections into PostgreSQL.
   - Open **pgAdmin 4** on your PC and query `SELECT * FROM health_risk_detections;` to see the live records!

---

## Local Development (Zero Changes)

Your local development workflow remains 100% identical and undisturbed:

### Running Backend Locally
```powershell
python -m uvicorn backend.main:app --reload --port 8000
```
Backend runs at `http://127.0.0.1:8000` and automatically connects to your local PostgreSQL database on port 5433 / 5432.

### Running Frontend Locally
```powershell
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173` and automatically proxies to the local backend.

---

## 🛡️ Summary of Verified Features

| Component | Local Development | Vercel Cloud Production |
| :--- | :--- | :--- |
| **Frontend** | Vite Dev Server (`localhost:5173`) | Vercel Edge Global CDN |
| **Backend** | FastAPI Uvicorn (`localhost:8000`) | Vercel Python Serverless Function |
| **ML Model** | Random Forest (`risk_model.pkl`) | Bundled Compressed Random Forest |
| **Database** | Local PostgreSQL 17/18 (`swasthya_db`) | Cloud PostgreSQL (Neon / Supabase) |
| **Database GUI** | pgAdmin 4 (Local Server) | pgAdmin 4 (Cloud Server registered) |
| **Telephony** | Twilio Live Outbound IVRS & SMS | Twilio Live Outbound IVRS & SMS |
| **Hardware** | ESP32 USB COM / Wi-Fi Ingest | ESP32 Wi-Fi HTTP POST Ingest |
