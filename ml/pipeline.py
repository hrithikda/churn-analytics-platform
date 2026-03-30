from sqlalchemy import create_engine
from dotenv import load_dotenv
import pandas as pd
import numpy as np
import os

def load_raw_data(path):
    return pd.read_csv(path)

def clean_data(df):
    df = df.copy()
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]
    df["totalcharges"] = pd.to_numeric(df["totalcharges"], errors="coerce")
    df["totalcharges"] = df["totalcharges"].fillna(df["monthlycharges"])
    bool_cols = ["partner", "dependents", "phoneservice", "paperlessbilling", "churn"]
    for col in bool_cols:
        if col in df.columns:
            df[col] = df[col].map({"Yes": True, "No": False})
    df["seniorcitizen"] = df["seniorcitizen"].astype(int)
    df = df.dropna(subset=["customerid"])
    df = df.drop_duplicates(subset=["customerid"])
    return df

def feature_engineer(df):
    df = df.copy()
    df["tenure_bucket"] = pd.cut(
        df["tenure"],
        bins=[0, 12, 24, 48, 72],
        labels=["0-12mo", "13-24mo", "25-48mo", "49-72mo"]
    )
    service_cols = ["onlinesecurity", "onlinebackup", "deviceprotection",
                    "techsupport", "streamingtv", "streamingmovies"]
    df["num_services"] = df[service_cols].apply(
        lambda row: sum(1 for v in row if v == "Yes"), axis=1
    )
    df["revenue_per_tenure"] = df["totalcharges"] / (df["tenure"] + 1)
    return df

def load_to_postgres(df):
    load_dotenv()
    engine = create_engine(os.getenv("DATABASE_URL"))
    
    db_cols = [
        "customerid", "gender", "seniorcitizen", "partner", "dependents",
        "tenure", "phoneservice", "multiplelines", "internetservice",
        "onlinesecurity", "onlinebackup", "deviceprotection", "techsupport",
        "streamingtv", "streamingmovies", "contract", "paperlessbilling",
        "paymentmethod", "monthlycharges", "totalcharges", "churn",
        "tenure_bucket", "num_services", "revenue_per_tenure"
    ]
    df["tenure_bucket"] = df["tenure_bucket"].astype(str)
    out = df[[c for c in db_cols if c in df.columns]]
    out.to_sql("customers", engine, if_exists="replace", index=False)
    print(f"Loaded {len(out)} rows into PostgreSQL.")


if __name__ == "__main__":
    path = "data/telco_churn.csv"
    print("Loading...")
    raw = load_raw_data(path)
    cleaned = clean_data(raw)
    featured = feature_engineer(cleaned)
    load_to_postgres(featured)