import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, average_precision_score
import pickle
import os

def train():
    print("Loading dataset...")
    df = pd.read_csv('creditcard.csv')
    
    # Feature Engineering
    print("Engineering features...")
    # 1. Scale Amount
    scaler = StandardScaler()
    df['Amount_Scaled'] = scaler.fit_transform(df[['Amount']])
    
    # 2. High Amount Flag (using 95th percentile)
    threshold = df['Amount'].quantile(0.95)
    df['High_Amount_Flag'] = (df['Amount'] > threshold).astype(int)
    
    # Prepare features and target
    # We drop Time and original Amount, and use scaled versions
    X = df.drop(['Class', 'Amount', 'Time'], axis=1)
    y = df['Class']
    
    print(f"Features used: {list(X.columns)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train Random Forest
    print("Training Random Forest (this may take a minute)...")
    # Using class_weight='balanced' to handle imbalance
    model = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluation
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    print(classification_report(y_test, y_pred))
    print(f"Average Precision Score: {average_precision_score(y_test, y_prob):.4f}")
    
    # Save model, scaler and feature list
    print("Saving model artifacts...")
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    if not os.path.exists(backend_dir):
        os.makedirs(backend_dir)
        
    with open(os.path.join(backend_dir, 'model.pkl'), 'wb') as f:
        pickle.dump(model, f)
        
    with open(os.path.join(backend_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
        
    with open(os.path.join(backend_dir, 'features.pkl'), 'wb') as f:
        pickle.dump(list(X.columns), f)
        
    # Also save feature importances for explainability
    importances = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values(by='importance', ascending=False)
    
    importances.to_csv(os.path.join(backend_dir, 'feature_importances.csv'), index=False)
    
    print("Training complete! Artifacts saved in /backend")

if __name__ == "__main__":
    train()
