# Real-Time Credit Card Fraud Detection System with Explainable AI

A professional fintech dashboard for monitoring and detecting fraudulent transactions using Machine Learning.

## Features
- **Machine Learning**: Random Forest model trained on the Credit Card Fraud dataset.
- **Explainable AI**: Provides reasons why a transaction is flagged as fraud.
- **Live Simulator**: Test the model with manual or randomized feature inputs.
- **Analytics Dashboard**: Real-time stats and distribution charts.
- **Transaction History**: SQLite database to log and manage past transactions.
- **Action Center**: Block cards or send alerts directly from the UI.

## Tech Stack
- **Backend**: Flask, scikit-learn, SQLite.
- **Frontend**: React, Chart.js, Lucide-React.
- **Styling**: Vanilla CSS (Premium Dark Theme).

## Setup Instructions

### 1. Model Training
Ensure `creditcard.csv` is in the root directory.
```bash
python train_model.py
```

### 2. Backend Setup
```bash
cd backend
python app.py
```
The API will run on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available on `http://localhost:5173`.

## File Structure
- `backend/`: Flask API, SQLite database, and model artifacts.
- `frontend/`: React application (Vite).
- `train_model.py`: Script for model training and preprocessing.
- `creditcard.csv`: Dataset (not included in repo, should be placed in root).
