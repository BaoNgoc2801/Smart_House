# Smart House Project

This repository contains the full stack implementation of the Smart House system. The project is divided into three main components:

1. **Backend**: A FastAPI server that handles Device State, Machine Learning predictions (LightGBM + RandomForest ensemble), and WebSocket synchronization.
2. **Web Demo**: A React + Vite web dashboard displaying an interactive floorplan for home control.
3. **Mobile App**: A React + Capacitor mobile app designed for cross-platform smart home management.

## Project Structure

- `backend/`: FastAPI Python backend.
- `smart-home-web-demo/`: React frontend web application.
- `smart-home-mobile/`: React Native (Capacitor) mobile application.
- `models/`: Trained machine learning models for activity prediction.
- `data/`: Processed dataset and features.

## Running Locally

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 2. Web Demo
```bash
cd smart-home-web-demo
npm install
npm run dev
```

### 3. Mobile App
```bash
cd smart-home-mobile
npm install
npm run dev
```

## Deployment
Check out the `deploy_report.md` (or equivalent) for specific deployment instructions including Docker for backend and Vercel for frontends.
