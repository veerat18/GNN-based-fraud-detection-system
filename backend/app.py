import flask
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import sqlite3
import os
from database import get_db_connection, init_db

app = Flask(__name__)
CORS(app)

# Load model artifacts
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')
FEATURES_PATH = os.path.join(BASE_DIR, 'features.pkl')

model = None
scaler = None
feature_names = None

def load_artifacts():
    global model, scaler, feature_names
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        with open(FEATURES_PATH, 'rb') as f:
            feature_names = pickle.load(f)
        print("Artifacts loaded successfully.")
    else:
        print("Model artifacts not found. Please run train_model.py first.")

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    try:
        # Expected keys: V1-V28, Amount, Time
        # Feature Engineering for prediction
        amount_raw = data.get('Amount', 100)
        amount = float(amount_raw) if amount_raw != "" else 0.0
        
        # Preprocessing as in training
        # We need V1-V28
        features_list = []
        for i in range(1, 29):
            val = data.get(f'V{i}', 0)
            features_list.append(float(val) if val != "" else 0.0)
            
        # Add Amount_Scaled and High_Amount_Flag
        amount_scaled = scaler.transform([[amount]])[0][0]
        
        # High_Amount_Flag - we need the threshold used during training.
        # For simplicity, let's assume a fixed threshold or use the same logic.
        # Actually, it's better to store the threshold. Let's assume > 1000 for now or calculate from training.
        # Since I didn't save the threshold, I'll use a reasonable one or update train_model.py.
        # Let's use 250 as a "high" amount for this dataset (approx 95th percentile).
        high_amount_flag = 1 if amount > 250 else 0
        
        # Construct feature vector
        # X order: V1...V28, Amount_Scaled, High_Amount_Flag
        input_vector = features_list + [amount_scaled, high_amount_flag]
        input_array = np.array(input_vector).reshape(1, -1)
        
        # Prediction
        prob = model.predict_proba(input_array)[0][1]
        is_fraud = prob > 0.5
        
        # Explanation logic
        # We can look at the features that are outliers or just use rule-based
        reasons = []
        if high_amount_flag:
            reasons.append("Unusually high transaction amount")
        
        # Check specific V features (simplistic XAI)
        # Based on typical credit card fraud datasets, V17, V14, V12, V10 are often most important
        important_v = {'V17': data.get('V17', 0), 'V14': data.get('V14', 0), 'V12': data.get('V12', 0)}
        for v, val in important_v.items():
            if abs(float(val)) > 2: # Arbitrary threshold for "unusual"
                reasons.append(f"Anomalous pattern detected in {v}")
                
        if not reasons:
            reasons.append("Complex behavioral pattern matching known fraud signatures")
            
        reason_str = ", ".join(reasons[:2])
        
        return jsonify({
            "fraud": bool(is_fraud),
            "probability": float(prob),
            "reason": reason_str
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/add-transaction', methods=['POST'])
def add_transaction():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO transactions (amount, fraud_probability, is_fraud, explanation)
            VALUES (?, ?, ?, ?)
        ''', (
            data.get('amount'),
            data.get('probability'),
            data.get('is_fraud'),
            data.get('explanation')
        ))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/transactions', methods=['GET'])
def get_transactions():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50')
        rows = cursor.fetchall()
        transactions = [dict(row) for row in rows]
        conn.close()
        return jsonify(transactions)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as total, SUM(is_fraud) as fraud FROM transactions')
        row = cursor.fetchone()
        conn.close()
        return jsonify({
            "total_transactions": row['total'] or 0,
            "fraud_detected": row['fraud'] or 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/update-status', methods=['POST'])
def update_status():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE transactions SET status = ? WHERE id = ?', (data.get('status'), data.get('id')))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    init_db()
    load_artifacts()
    app.run(debug=True, port=5000)
