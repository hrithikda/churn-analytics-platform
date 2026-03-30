# Customer Intelligence & Churn Analytics Platform

A full-stack analytics platform that predicts customer churn, surfaces retention drivers, and visualizes revenue at risk through an interactive dashboard.

![Python](https://img.shields.io/badge/Python-3.11-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green) ![React](https://img.shields.io/badge/React-18-61dafb) ![XGBoost](https://img.shields.io/badge/XGBoost-2.0-orange)

## Results

- ROC-AUC: 0.84 on held-out test set
- 5-fold CV AUC: 0.84 +/- 0.01
- Month-to-month customers churn at 42.7% vs 2.8% for two-year contracts (15x difference)
- Customers in their first year churn at 47.7% vs 9.5% after year four
- $1.67M annual revenue at risk identified across churned customer base

## Architecture
```
React Frontend → FastAPI Backend → PostgreSQL
                       ↓
               XGBoost Model + SHAP
```

## Dashboard

Five interactive pages built on live data:

- Overview: KPI cards showing churn rate, revenue at risk, and avg monthly charges with contract-type bar chart
- Cohort Analysis: Retention curves by tenure bucket with revenue at risk area chart
- Segment Analysis: Churn rates sliced by contract, internet service, payment method, and gender
- Risk Table: Searchable and sortable customer table with churn/retained filtering
- Model Insights: SHAP feature importance chart and CV model metrics

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy |
| ML | XGBoost, scikit-learn, SHAP, pandas |
| Database | PostgreSQL 15 |
| Infrastructure | Docker, Docker Compose |

## Quickstart

Prerequisites: Docker, Python 3.11, Node 18+

1. Clone the repo
```bash
git clone https://github.com/hrithikda/churn-analytics-platform
cd churn-analytics-platform
```

2. Download the Kaggle Telco Customer Churn dataset and place it at data/telco_churn.csv

3. Set up environment
```bash
cp .env.example .env
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

4. Run the data pipeline and train the model
```bash
python ml/pipeline.py data/telco_churn.csv
python ml/train.py
```

5. Start PostgreSQL
```bash
docker-compose up -d
```

6. Start the API
```bash
uvicorn backend.main:app --reload --port 8000
```

7. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

8. Open http://localhost:5173

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| /api/kpis | GET | Aggregate KPIs: churn rate, revenue at risk |
| /api/cohorts | GET | Churn metrics by tenure bucket |
| /api/churn-by-segment | GET | Churn rate by contract, internet, payment, gender |
| /api/high-risk-customers | GET | Customers ranked by monthly charges |
| /api/feature-importance | GET | SHAP feature importance scores |
| /api/model-metrics | GET | AUC, CV scores, train/test sizes |

## ML Pipeline

Feature engineering: tenure bucketing, service count aggregation, revenue per tenure ratio

Model: XGBoost with scale_pos_weight to handle class imbalance (73/27 split). 300 estimators, max depth 5, learning rate 0.05.

Explainability: SHAP TreeExplainer computes per-feature contribution scores on the test set. Top driver is contract type, followed by tenure and monthly charges.

Evaluation: Stratified 5-fold cross validation on full dataset. Final metrics on a held-out 20% test split.

## Project Structure
```
churn-analytics-platform/
├── backend/
│   └── main.py           FastAPI app with all endpoints
├── frontend/
│   └── src/
│       ├── pages/        Overview, Cohorts, Segments, RiskTable, ModelInsights
│       └── components/   Sidebar, reusable UI
├── ml/
│   ├── pipeline.py       Data ingestion and feature engineering
│   └── train.py          XGBoost training and SHAP explainability
├── data/                 Dataset directory (not committed)
└── docker-compose.yml
```

## License

MIT