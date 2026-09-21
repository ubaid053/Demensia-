# NER Tele-Dementia Network | Clinical Records System

Hospital-grade electronic cognitive health and dementia monitoring platform designed for geriatric clinicians, caregivers, and patients in North-Eastern India.

## 🌟 Overview

The **NER Tele-Dementia Network** is an integrated cognitive health monitoring and management suite providing:
- **Clinician Dashboard (`index.html`)**: Real-time patient roster, MMSE/CDR tracking, risk stratifications, medication & therapy adherence monitoring, clinical alert triaging, and analytics reporting.
- **Caregiver & Cognitive Rehabilitation Portal (`games.html`)**: Engaging evidence-based cognitive stimulation therapy (CST) games (Memory Matrix, Pattern Match, Attention Tracker, Reminiscence, Daily Routine), cognitive tracking, and emergency SOS alerts.
- **Public Portal & Landing Page (`landing.html`)**: Public awareness, screening information, regional resource directories, and clinician access portals.
- **Backend Analytics Engine (`server.js` & `backend/`)**: Lightweight Node.js service providing analytics aggregation, real-time metrics storage, and reporting endpoints.

## 🚀 Getting Started

### Option 1: Run with Local Node.js Server (Recommended for full API & analytics)
```bash
# Start the local server
node server.js
```
Then navigate to:
- Clinician Portal: `http://localhost:3000/index.html`
- Patient / Cognitive Games: `http://localhost:3000/games.html`
- Landing Page: `http://localhost:3000/landing.html`

### Option 2: Static / Offline Mode
Simply open any of the HTML files directly in your web browser:
- Double click `index.html`, `games.html`, or `landing.html`

## 📁 Project Structure

```text
├── backend/
│   └── analytics-service.js     # Analytics aggregation & telemetry service
├── css/
│   ├── games.css                # Cognitive games & patient portal styling
│   ├── landing.css              # Public portal responsive styling
│   └── styles.css               # Clinical dashboard & doctor portal styling
├── data/
│   └── analytics-store.json     # Data store for longitudinal clinical metrics
├── js/
│   ├── ai-detection.js          # AI screening & cognitive assessment models
│   ├── app.js                   # Primary clinician application logic & state management
│   ├── charts.js                # Clinical charts and data visualization
│   ├── data.js                  # Patient records, mock clinical rosters & storage
│   ├── game-attention.js        # Attention span assessment module
│   ├── game-memory.js           # Memory recall challenge module
│   ├── game-pattern.js          # Pattern recognition cognitive task
│   ├── game-reminiscence.js     # Reminiscence therapy module
│   ├── game-routine.js          # ADL (Activities of Daily Living) routine module
│   ├── games-data.js            # Cognitive game state & caregiver registry
│   └── landing.js               # Landing page interactive logic
├── games.html                   # Patient & Caregiver portal
├── index.html                   # Clinician & Doctor dashboard
├── landing.html                 # Public informational landing page
├── server.js                    # Node.js backend HTTP server
└── .gitignore                   # Git ignore configurations
```

## 🔒 Privacy & Clinical Compliance
Designed with patient data confidentiality, role-based separation of concerns, and longitudinal health record standards.
