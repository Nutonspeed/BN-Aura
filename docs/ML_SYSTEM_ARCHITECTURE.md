# Machine Learning System Architecture - BN-Aura

This document outlines the architecture and implementation details of the Machine Learning (ML) subsystems integrated into the BN-Aura platform.

## Overview

The ML system is designed to enhance sales efficiency and customer retention through three core components:
1.  **Lead Scoring**: Prioritizes incoming leads based on conversion probability.
2.  **Churn Prediction**: Identifies customers at risk of leaving to trigger retention workflows.
3.  **Treatment Recommendations**: Suggests personalized treatments based on similar customer profiles (Collaborative Filtering).

---

## 1. Lead Scoring Engine

### Purpose
To automatically score and categorize leads (Hot, Warm, Cold) to help sales staff focus on high-value prospects.

### Architecture
-   **Data Source**: `sales_leads`, `customer_conversations`
-   **Model Type**: XGBoost Classifier (Gradient Boosting)
-   **Input Features**:
    -   `urgency_score`: Extracted from initial inquiry analysis.
    -   `days_since_contact`: Recency of interaction.
    -   `response_rate`: Customer engagement level.
    -   `budget_specified`: Boolean flag.
    -   `contact_completeness`: Profile data quality.
    -   `skin_age`: Delta between real age and skin age.
    -   `concern_count`: Number of identified skin concerns.
    -   `previous_treatment_count`: History of aesthetic procedures.

### Implementation
-   **Training Script**: `scripts/ml/train_lead_scoring_model.py`
-   **Inference Service**: `lib/scoring/leadScoring.ts` (Currently heuristic-based, ready for model API integration)
-   **API Endpoint**: `/api/leads/score`
-   **Automation**: High scores (>= 80) trigger "Hot Lead" alerts via `lib/automation/smartTriggers.ts`.

---

## 2. Churn Prediction System

### Purpose
To pro-actively identify customers who are deviating from their expected visit frequency and may be lost.

### Architecture
-   **Data Source**: `customers`, `appointments`, `customer_conversations`
-   **Model Type**: XGBoost Classifier / Heuristic Hybrid
-   **Input Features**:
    -   `days_since_last_visit`: Recency.
    -   `total_visits`: Frequency.
    -   `avg_spend`: Monetary value.
    -   `cancellation_count`: Negative signal.
    -   `sentiment_score`: Derived from `customer_conversations` via Gemini AI.

### Implementation
-   **Training Script**: `scripts/ml/train_churn_model.py`
-   **Inference Service**: `lib/ml/churnPrediction.ts`
-   **Scheduled Job**: `/api/jobs/check-churn` (Cron job for periodic checks)
-   **Automation**:
    -   High Risk (>= 70): Triggers retention email campaign and sales notification.
    -   Medium Risk (40-69): Suggests targeted promotions.

---

## 3. Treatment Recommender (Collaborative Filtering)

### Purpose
To suggest relevant treatments to customers based on "users like you" patterns, increasing cross-sell opportunities.

### Architecture
-   **Methodology**: Vector-based Semantic Search + Collaborative Filtering (KNN)
-   **Technology**: `pgvector` (Vector Database) + `scikit-learn` (KNN)
-   **Data Flow**:
    1.  **Vector Embedding**: Customer profiles (concerns, history, demographics) are embedded using `text-embedding-004` (Google Gemini) via `lib/embeddings/embeddingService.ts`.
    2.  **Similarity Search**: `pgvector` finds the nearest neighbors (similar customers) in the high-dimensional space.
    3.  **Aggregation**: Treatments purchased by these similar neighbors are aggregated and ranked by frequency.

### Implementation
-   **Embedding Generation**: `lib/jobs/generateEmbeddings.ts` (Batch job)
-   **Search Service**: `lib/embeddings/vectorSearch.ts`
-   **Recommender Logic**: `lib/ml/treatmentRecommender.ts`
-   **Training Script**: `scripts/ml/treatment_recommender.py` (For building the offline matrix)

---

## 4. Voice of Customer (VoC) Analytics

### Purpose
To analyze unstructured conversation data for sentiment, trends, and actionable insights.

### Architecture
-   **Engine**: Google Gemini 2.0 Flash
-   **Process**:
    1.  Conversations are logged in `customer_conversations`.
    2.  `lib/ai/sentimentAnalyzer.ts` processes message history to extract:
        -   `overall_sentiment` (Positive/Neutral/Negative)
        -   `satisfaction_score` (0-10)
        -   `key_concerns` (e.g., "Price", "Downtime")
    3.  Data is aggregated for the Admin Analytics Dashboard.

### Implementation
-   **Service**: `lib/analytics/vocService.ts`
-   **Dashboard Widget**: `components/analytics/VoCAnalyticsWidget.tsx`
-   **API**: `/api/admin/analytics/voc`

---

## Deployment & Scalability

-   **Database**: PostgreSQL with `pgvector` extension is crucial.
-   **Compute**: Next.js Server Actions handle lightweight inference. Heavy ML training should be offloaded to a dedicated Python worker or cloud function (e.g., AWS Lambda, Google Cloud Run) in a production environment.
-   **Real-time**: Supabase Realtime is used for broadcasting alerts (Hot Leads, Churn Warnings) to the frontend immediately.

## Future Roadmap

1.  **Model API Deployment**: Containerize Python training scripts into a Flask/FastAPI service for real-time inference instead of current heuristics.
2.  **Feedback Loop**: Implement a feedback mechanism where sales staff can flag "incorrect" scores to retrain and improve models.
3.  **A/B Testing**: Test different automation rules (e.g., different email templates for churn risks) to optimize conversion.
