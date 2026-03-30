from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pickle
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../ml"))

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../ml/model.pkl")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

app = FastAPI(title="Churn Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_artifact = None

def get_model():
    global _artifact
    if _artifact is None:
        with open(MODEL_PATH, "rb") as f:
            _artifact = pickle.load(f)
    return _artifact

@app.get("/api/kpis")
def kpis():
    db = Session()
    row = db.execute(text("""
        SELECT
            COUNT(*) AS total_customers,
            SUM(CASE WHEN churn::text = 'true' THEN 1 ELSE 0 END) AS total_churned,
            ROUND(AVG(CASE WHEN churn::text = 'true' THEN 1.0 ELSE 0.0 END)::numeric * 100, 2) AS churn_rate_pct,
            ROUND(AVG(monthlycharges)::numeric, 2) AS avg_monthly_charges,
            ROUND(SUM(CASE WHEN churn::text = 'true' THEN monthlycharges ELSE 0 END)::numeric * 12, 2) AS annual_revenue_at_risk
        FROM customers
    """)).fetchone()
    db.close()
    return {
        "total_customers": row[0],
        "total_churned": row[1],
        "churn_rate_pct": float(row[2]),
        "avg_monthly_charges": float(row[3]),
        "annual_revenue_at_risk": float(row[4])
    }

@app.get("/api/cohorts")
def cohorts():
    db = Session()
    rows = db.execute(text("""
        SELECT
            tenure_bucket,
            COUNT(*) AS total_customers,
            SUM(CASE WHEN churn::text = 'true' THEN 1 ELSE 0 END) AS churned_customers,
            ROUND(AVG(CASE WHEN churn::text = 'true' THEN 1.0 ELSE 0.0 END)::numeric * 100, 2) AS churn_rate_pct,
            ROUND(AVG(monthlycharges)::numeric, 2) AS avg_monthly_charges,
            ROUND(SUM(CASE WHEN churn::text = 'true' THEN monthlycharges ELSE 0 END)::numeric * 12, 2) AS total_revenue_at_risk
        FROM customers
        GROUP BY tenure_bucket
        ORDER BY tenure_bucket
    """)).fetchall()
    db.close()
    return [
        {
            "tenure_bucket": r[0],
            "total_customers": r[1],
            "churned_customers": r[2],
            "churn_rate_pct": float(r[3]),
            "avg_monthly_charges": float(r[4]),
            "total_revenue_at_risk": float(r[5])
        }
        for r in rows
    ]

@app.get("/api/churn-by-segment")
def churn_by_segment(segment: str = "contract"):
    allowed = {"contract", "internetservice", "paymentmethod", "gender"}
    if segment not in allowed:
        raise HTTPException(status_code=400, detail=f"Segment must be one of {allowed}")
    db = Session()
    rows = db.execute(text(f"""
        SELECT {segment},
            COUNT(*) AS total,
            SUM(CASE WHEN churn::text = 'true' THEN 1 ELSE 0 END) AS churned,
            ROUND(AVG(CASE WHEN churn::text = 'true' THEN 1.0 ELSE 0.0 END)::numeric * 100, 2) AS churn_rate_pct,
            ROUND(AVG(monthlycharges)::numeric, 2) AS avg_monthly_charges
        FROM customers
        GROUP BY {segment}
        ORDER BY churn_rate_pct DESC
    """)).fetchall()
    db.close()
    return [
        {
            "segment_value": r[0],
            "total": r[1],
            "churned": r[2],
            "churn_rate_pct": float(r[3]),
            "avg_monthly_charges": float(r[4])
        }
        for r in rows
    ]

@app.get("/api/feature-importance")
def feature_importance():
    artifact = get_model()
    return {"features": artifact["shap_importance"]}

@app.get("/api/model-metrics")
def model_metrics():
    artifact = get_model()
    return artifact["metrics"]

@app.get("/api/high-risk-customers")
def high_risk_customers(limit: int = 100):
    db = Session()
    rows = db.execute(text("""
        SELECT customerid, contract, tenure, monthlycharges,
               internetservice, paymentmethod, churn
        FROM customers
        ORDER BY monthlycharges DESC
        LIMIT :limit
    """), {"limit": limit}).fetchall()
    db.close()
    return [
        {
            "customer_id": r[0],
            "contract": r[1],
            "tenure": r[2],
            "monthly_charges": float(r[3]),
            "internet_service": r[4],
            "payment_method": r[5],
            "actual_churn": r[6]
        }
        for r in rows
    ]

@app.get("/health")
def health():
    return {"status": "ok"}