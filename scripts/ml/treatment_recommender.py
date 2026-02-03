import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
import joblib
import os
import argparse

def fetch_customer_treatments(clinic_id):
    """
    Fetches customer treatment history.
    Returns a DataFrame with columns: customer_id, treatment_id, purchase_count
    """
    print(f"Fetching treatment data for clinic: {clinic_id}")
    
    np.random.seed(42)
    n_interactions = 5000
    n_customers = 500
    n_treatments = 50
    
    # Simulate data
    customer_ids = np.random.randint(0, n_customers, n_interactions)
    treatment_ids = np.random.randint(0, n_treatments, n_interactions)
    
    data = pd.DataFrame({
        'customer_id': customer_ids,
        'treatment_id': treatment_ids,
        'purchase_count': 1
    })
    
    # Aggregate
    data = data.groupby(['customer_id', 'treatment_id']).count().reset_index()
    
    return data

def build_treatment_recommender(clinic_id, output_dir='models'):
    # Fetch data
    df = fetch_customer_treatments(clinic_id)
    
    if df.empty:
        print("No data found.")
        return None
        
    # Create pivot table (Customer-Item Matrix)
    pivot_table = df.pivot(
        index='customer_id', 
        columns='treatment_id', 
        values='purchase_count'
    ).fillna(0)
    
    # Create sparse matrix
    matrix = csr_matrix(pivot_table.values)
    
    # Train KNN model
    print("Training KNN Recommender Model...")
    model = NearestNeighbors(
        metric='cosine',
        algorithm='brute',
        n_neighbors=10
    )
    
    model.fit(matrix)
    
    # Save components
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Save model
    model_path = os.path.join(output_dir, f'treatment_recommender_{clinic_id}.pkl')
    joblib.dump(model, model_path)
    
    # Save mapping (to map matrix indices back to IDs)
    mappings = {
        'customer_ids': pivot_table.index.tolist(),
        'treatment_ids': pivot_table.columns.tolist()
    }
    mapping_path = os.path.join(output_dir, f'treatment_mappings_{clinic_id}.pkl')
    joblib.dump(mappings, mapping_path)
    
    print(f"Model saved to {model_path}")
    print(f"Mappings saved to {mapping_path}")
    
    return model

def recommend_treatments(customer_id, clinic_id, model_dir='models', n_recommendations=5):
    # Load model and mappings
    model_path = os.path.join(model_dir, f'treatment_recommender_{clinic_id}.pkl')
    mapping_path = os.path.join(model_dir, f'treatment_mappings_{clinic_id}.pkl')
    
    if not os.path.exists(model_path):
        print("Model not found. Please train first.")
        return []
        
    model = joblib.load(model_path)
    mappings = joblib.load(mapping_path)
    
    customer_ids = mappings['customer_ids']
    treatment_ids = mappings['treatment_ids']
    
    if customer_id not in customer_ids:
        print(f"Customer {customer_id} not found in training data.")
        return [] # Cold start problem - use popularity based (not implemented here)
    
    # Find index
    customer_idx = customer_ids.index(customer_id)
    
    # Get user vector (we need the original matrix or just reconstruction, 
    # but for inference we usually need the vector. 
    # In production, we'd look up the vector from DB or feature store)
    # Here we mock reading the matrix row logic or just use neighbors of the ID if we had the matrix loaded.
    
    # Ideally, we pass the vector to kneighbors.
    # Since we don't have the matrix loaded here, let's assume we can query neighbors 
    # directly if we persisted the matrix or graph.
    # For this script, it's mainly for training.
    
    print("Inference logic requires loading the feature matrix. This script is optimized for training.")
    return []

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train Treatment Recommender Model')
    parser.add_argument('--clinic_id', type=str, required=True, help='Clinic ID')
    args = parser.parse_args()
    
    build_treatment_recommender(args.clinic_id)
