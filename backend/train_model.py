"""
FinVantage ML Platform — Model Training Script
================================================
Trains a Random Forest classifier on historical loan data to predict
Probability of Default (PD). Exports the model as a .pkl file.

Usage:
    pip install pandas scikit-learn joblib
    python train_model.py

Output:
    backend/models/credit_risk_model.pkl
    backend/models/feature_names.pkl
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.metrics import classification_report, roc_auc_score
import joblib

# ─── Configuration ───────────────────────────────────────────────────
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sample_historical_loan_data.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ─── 1. Load & Inspect Data ─────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Dataset shape: {df.shape}")
print(f"Target distribution:\n{df['loan_status'].value_counts()}\n")

# ─── 2. Preprocessing ───────────────────────────────────────────────
# Encode target: Defaulted=1, Paid=0
df["target"] = (df["loan_status"] == "Defaulted").astype(int)

# Encode categorical features
emp_map = {"<1": 0.5, "1-3": 2, "3-5": 4, "5-10": 7, "10+": 12}
home_map = {"RENT": 0, "MORTGAGE": 0.5, "OWN": 1}
purpose_encoder = LabelEncoder()

df["emp_years"] = df["employment_length"].map(emp_map)
df["home_numeric"] = df["home_ownership"].map(home_map)
df["purpose_encoded"] = purpose_encoder.fit_transform(df["loan_purpose"])

# Derived features
df["dti_ratio"] = (df["monthly_debt"] * 12) / df["annual_income"].clip(lower=1)
df["loan_to_income"] = df["loan_amount"] / df["annual_income"].clip(lower=1)

# Select features
FEATURE_COLS = [
    "age", "cibil_score", "annual_income", "monthly_debt",
    "loan_amount", "emp_years", "home_numeric", "dependents",
    "interest_rate", "loan_term_months", "purpose_encoded",
    "dti_ratio", "loan_to_income",
]

X = df[FEATURE_COLS].copy()
y = df["target"]

# Handle missing values
X = X.fillna(X.median())

# Scale features
scaler = MinMaxScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=FEATURE_COLS)

# ─── 3. Train / Test Split ──────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ─── 4. Train Random Forest ─────────────────────────────────────────
print("Training Random Forest classifier...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

# ─── 5. Evaluate ────────────────────────────────────────────────────
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["Paid", "Defaulted"]))
print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

# Cross-validation
cv_scores = cross_val_score(model, X_scaled, y, cv=5, scoring="roc_auc")
print(f"5-Fold CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# Feature importance
print("\n=== Feature Importance ===")
importances = dict(zip(FEATURE_COLS, model.feature_importances_))
for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
    print(f"  {feat:20s} {imp:.4f}")

# ─── 6. Export Model & Artefacts ─────────────────────────────────────
joblib.dump(model, os.path.join(MODEL_DIR, "credit_risk_model.pkl"))
joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
joblib.dump(FEATURE_COLS, os.path.join(MODEL_DIR, "feature_names.pkl"))
joblib.dump(purpose_encoder, os.path.join(MODEL_DIR, "purpose_encoder.pkl"))

print(f"\n✅ Model saved to {MODEL_DIR}/credit_risk_model.pkl")
print("✅ Training complete!")
