import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import argparse
from datetime import datetime, timedelta

def fetch_customer_behavior(clinic_id):
    """
    Fetches customer behavior data for churn prediction.
    """
    print(f"Fetching behavior data for clinic: {clinic_id}")
    
    np.random.seed(42)
    n_samples = 1000
    
    # Simulate data
    data = pd.DataFrame({
        'days_since_last_visit': np.random.randint(0, 180, n_samples),
        'total_visits': np.random.randint(1, 50, n_samples),
        'avg_spend': np.random.uniform(1000, 20000, n_samples),
        'loyalty_points': np.random.randint(0, 5000, n_samples),
        'email_open_rate': np.random.uniform(0, 1, n_samples),
        'sms_response_rate': np.random.uniform(0, 1, n_samples),
        'missed_appointments': np.random.randint(0, 5, n_samples),
        'sentiment_score': np.random.uniform(-1, 1, n_samples)
    })
    
    # Synthetic target: Churned if no visit in > 90 days (simplified logic for training label)
    # In reality, this label would come from historical fact (e.g. didn't return for 6 months)
    # Here we simulate correlation
    
    churn_prob = (
        (data['days_since_last_visit'] / 180) * 0.5 + 
        (data['missed_appointments'] / 5) * 0.2 +
        (1 - data['email_open_rate']) * 0.1 +
        (data['sentiment_score'] < 0) * 0.2
    )
    
    data['churned'] = (churn_prob > 0.4).astype(int)
    
    return data

def train_churn_model(clinic_id, output_dir='models'):
    data = fetch_customer_behavior(clinic_id)
    
    features = [
        'days_since_last_visit',
        'total_visits',
        'avg_spend',
        'loyalty_points',
        'email_open_rate',
        'sms_response_rate',
        'missed_appointments',
        'sentiment_score'
    ]
    
    X = data[features]
    y = data['churned']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print("Training Churn Prediction Model (XGBoost)...")
    model = XGBClassifier(
        max_depth=4,
        learning_rate=0.05,
        n_estimators=100,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    
    print(f"Model Accuracy: {accuracy:.4f}")
    print("Classification Report:")
    print(report)
    
    # Feature Importance
    feature_importance = pd.DataFrame({
        'feature': features,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance:")
    print(feature_importance)
    
    # Save
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    model_path = os.path.join(output_dir, f'churn_model_{clinic_id}.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train Churn Prediction Model')
    parser.add_argument('--clinic_id', type=str, required=True, help='Clinic ID')
    args = parser.parse_args()
    
    train_churn_model(args.clinic_id)
