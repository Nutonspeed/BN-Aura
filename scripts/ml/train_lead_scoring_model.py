import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import argparse
# import psycopg2 # Uncomment to connect to real DB

def fetch_leads_with_outcomes(clinic_id):
    """
    Fetches historical lead data from the database.
    In a real implementation, this would connect to Supabase/Postgres.
    For now, we simulate with mock data.
    """
    print(f"Fetching data for clinic: {clinic_id}")
    
    # Mock Data Generation
    np.random.seed(42)
    n_samples = 1000
    
    data = pd.DataFrame({
        'urgency_score': np.random.randint(0, 100, n_samples),
        'days_since_contact': np.random.randint(0, 30, n_samples),
        'response_rate': np.random.uniform(0, 1, n_samples),
        'budget_specified': np.random.choice([0, 1], n_samples),
        'contact_completeness': np.random.uniform(0.5, 1, n_samples),
        'skin_age': np.random.randint(20, 60, n_samples),
        'concern_count': np.random.randint(1, 6, n_samples),
        'previous_treatment_count': np.random.randint(0, 10, n_samples),
        # Target variable: 1 (Won), 0 (Lost/Others)
        # We create a synthetic relationship for the model to learn
    })
    
    # Synthetic target generation based on features (logic for simulation)
    # Higher urgency, budget specified, and engagement -> higher chance of winning
    prob = (
        (data['urgency_score'] / 100) * 0.3 + 
        data['budget_specified'] * 0.2 + 
        data['response_rate'] * 0.3 +
        (data['concern_count'] / 6) * 0.2
    )
    # Add some noise
    prob += np.random.normal(0, 0.1, n_samples)
    data['converted'] = (prob > 0.5).astype(int)
    
    return data

def train_lead_scoring_model(clinic_id, output_dir='models'):
    # Fetch historical data
    data = fetch_leads_with_outcomes(clinic_id)
    
    features = [
        'urgency_score',
        'days_since_contact',
        'response_rate',
        'budget_specified',
        'contact_completeness',
        'skin_age',
        'concern_count',
        'previous_treatment_count'
    ]
    
    X = data[features]
    y = data['converted']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize and train model
    print("Training XGBoost model...")
    model = XGBClassifier(
        max_depth=5,
        learning_rate=0.1,
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
    
    # Save model
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    model_path = os.path.join(output_dir, f'lead_scoring_{clinic_id}.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    return {
        'accuracy': accuracy,
        'feature_importance': feature_importance.to_dict('records')
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train Lead Scoring Model')
    parser.add_argument('--clinic_id', type=str, required=True, help='Clinic ID to train model for')
    args = parser.parse_args()
    
    train_lead_scoring_model(args.clinic_id)
