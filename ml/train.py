import pandas as pd
import numpy as np
import pickle
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import roc_auc_score, average_precision_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import xgboost as xgb
import shap

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def load_from_postgres():
    load_dotenv()
    engine = create_engine(os.getenv("DATABASE_URL"))
    return pd.read_sql("SELECT * FROM customers", engine)

def build_features(df):
    df = df.copy()
    yes_no_cols = ["multiplelines", "onlinesecurity", "onlinebackup",
                   "deviceprotection", "techsupport", "streamingtv", "streamingmovies"]
    for col in yes_no_cols:
        if col in df.columns:
            df[col] = df[col].map({"Yes": 1, "No": 0,
                                   "No phone service": 0,
                                   "No internet service": 0}).fillna(0).astype(int)
    bool_cols = ["partner", "dependents", "phoneservice", "paperlessbilling"]
    for col in bool_cols:
        if col in df.columns:
            df[col] = df[col].astype(int)
    feature_cols = [
        "gender", "seniorcitizen", "partner", "dependents", "tenure",
        "phoneservice", "multiplelines", "internetservice",
        "onlinesecurity", "onlinebackup", "deviceprotection", "techsupport",
        "streamingtv", "streamingmovies", "contract", "paperlessbilling",
        "paymentmethod", "monthlycharges", "totalcharges"
    ]
    feature_cols = [c for c in feature_cols if c in df.columns]
    X = df[feature_cols]
    y = df["churn"].astype(int)
    return X, y, feature_cols

def build_preprocessor(X):
    num_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer([
        ("num", num_pipe, num_cols),
        ("cat", cat_pipe, cat_cols)
    ])
    return preprocessor, num_cols, cat_cols

def train():
    print("Loading data from PostgreSQL...")
    df = load_from_postgres()
    X, y, feature_cols = build_features(df)
    preprocessor, num_cols, cat_cols = build_preprocessor(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", xgb.XGBClassifier(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight,
            eval_metric="auc",
            random_state=42,
            n_jobs=-1
        ))
    ])

    print("Training...")
    model.fit(X_train, y_train)

    y_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_proba)
    ap = average_precision_score(y_test, y_proba)

    cv_scores = cross_val_score(model, X, y, cv=StratifiedKFold(5), scoring="roc_auc")

    print(f"ROC-AUC:      {auc:.4f}")
    print(f"Avg Precision: {ap:.4f}")
    print(f"CV AUC:        {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    print("Computing SHAP values...")
    X_test_transformed = model.named_steps["preprocessor"].transform(X_test)
    explainer = shap.TreeExplainer(model.named_steps["classifier"])
    shap_values = explainer.shap_values(X_test_transformed)

    ohe_feature_names = (
        num_cols +
        list(model.named_steps["preprocessor"]
             .named_transformers_["cat"]
             .named_steps["encoder"]
             .get_feature_names_out(cat_cols))
    )

    shap_importance = pd.DataFrame({
        "feature": ohe_feature_names,
        "mean_abs_shap": np.abs(shap_values).mean(axis=0)
    }).sort_values("mean_abs_shap", ascending=False).head(10)

    print("\nTop 10 churn drivers (SHAP):")
    print(shap_importance.to_string(index=False))

    artifact = {
        "model": model,
        "explainer": explainer,
        "feature_cols": feature_cols,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "ohe_feature_names": ohe_feature_names,
        "metrics": {
            "roc_auc": round(auc, 4),
            "average_precision": round(ap, 4),
            "cv_auc_mean": round(cv_scores.mean(), 4),
            "cv_auc_std": round(cv_scores.std(), 4),
        },
        "shap_importance": shap_importance.to_dict(orient="records")
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(artifact, f)

    print(f"\nModel saved to {MODEL_PATH}")

if __name__ == "__main__":
    train()