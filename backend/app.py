"""
FinVantage ML Platform — FastAPI Backend
=========================================
Serves the trained Random Forest model and persists results in MySQL.

Usage:
    pip install fastapi uvicorn sqlalchemy pymysql joblib pandas numpy scikit-learn
    uvicorn app:app --reload --port 8000

Endpoints:
    POST /api/predict   — Run ML prediction on user profile
    GET  /api/health    — Health check
"""

import os
import json
from typing import Optional
from datetime import datetime

import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# ─── Configuration ───────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required. Example: mysql+pymysql://user:pass@host:3306/finvantage")

API_KEY = os.getenv("FINVANTAGE_API_KEY")
if not API_KEY:
    raise RuntimeError("FINVANTAGE_API_KEY environment variable is required for endpoint authentication.")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# ─── Database Setup ──────────────────────────────────────────────────
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    dependents = Column(Integer, default=0)
    marital_status = Column(String(20), nullable=False)
    employment_length = Column(String(10), nullable=False)
    home_ownership = Column(String(10), nullable=False)
    cibil_score = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    applications = relationship("LoanApplicationModel", back_populates="user")


class LoanApplicationModel(Base):
    __tablename__ = "loan_applications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    annual_income = Column(Float, nullable=False)
    monthly_debt = Column(Float, nullable=False)
    total_investments = Column(Float, default=0)
    bank_balance = Column(Float, default=0)
    loan_amount = Column(Float, nullable=False)
    loan_purpose = Column(String(20), nullable=False)
    interest_rate = Column(Float, nullable=False)
    loan_term_months = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("UserModel", back_populates="applications")
    predictions = relationship("RiskPredictionModel", back_populates="application")


class RiskPredictionModel(Base):
    __tablename__ = "risk_predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    credit_score = Column(Integer, nullable=False)
    probability_of_default = Column(Float, nullable=False)
    approval_status = Column(String(10), nullable=False)
    dti_ratio = Column(Float)
    wealth_coverage = Column(Float)
    feature_importance = Column(JSON)
    ai_insights = Column(JSON)
    model_version = Column(String(50), default="rf_v1")
    created_at = Column(DateTime, default=datetime.utcnow)
    application = relationship("LoanApplicationModel", back_populates="predictions")


# ─── Load ML Artefacts ───────────────────────────────────────────────
try:
    model = joblib.load(os.path.join(MODEL_DIR, "credit_risk_model.pkl"))
    scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
    purpose_encoder = joblib.load(os.path.join(MODEL_DIR, "purpose_encoder.pkl"))
    print("✅ ML model loaded successfully")
except FileNotFoundError:
    model = scaler = feature_names = purpose_encoder = None
    print("⚠️  ML model not found — run train_model.py first")

# ─── FastAPI App ─────────────────────────────────────────────────────
app = FastAPI(title="FinVantage ML API", version="2.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key"],
)


from fastapi import Depends, Security
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str = Security(api_key_header)):
    if not key or key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return key


# ─── Request / Response Schemas ──────────────────────────────────────
class ProfilePayload(BaseModel):
    fullName: str
    age: int = Field(ge=18, le=100)
    dependents: int = Field(ge=0, le=20)
    maritalStatus: str
    employmentLength: str
    homeOwnership: str
    cibilScore: int = Field(ge=300, le=900)
    annualIncome: float = Field(gt=0)
    monthlyDebt: float = Field(ge=0)
    totalInvestments: float = Field(ge=0)
    bankBalance: float = Field(ge=0)
    loanAmount: float = Field(gt=0)
    loanPurpose: str
    interestRate: float = Field(gt=0, le=40)
    loanTermMonths: int = Field(ge=6, le=360)


class PredictionResponse(BaseModel):
    score: int
    maxScore: int
    probabilityOfDefault: int
    status: str
    approvalProbability: str
    healthMetrics: dict
    breakdown: list
    aiInsights: list
    profile: dict
    predictionId: int


# ─── Helper Maps ─────────────────────────────────────────────────────
EMP_MAP = {"<1": 0.5, "1-3": 2, "3-5": 4, "5-10": 7, "10+": 12}
HOME_MAP = {"RENT": 0, "MORTGAGE": 0.5, "OWN": 1}

FEATURE_DISPLAY_NAMES = {
    "age": "Age",
    "cibil_score": "CIBIL Score",
    "annual_income": "Income",
    "monthly_debt": "Debt Burden",
    "loan_amount": "Loan Amount",
    "emp_years": "Employment",
    "home_numeric": "Home Ownership",
    "dependents": "Dependents",
    "interest_rate": "Interest Rate",
    "loan_term_months": "Loan Term",
    "purpose_encoded": "Loan Purpose",
    "dti_ratio": "DTI Ratio",
    "loan_to_income": "Loan-to-Income",
}


def generate_ai_tips(payload: ProfilePayload, pd_pct: int) -> list[str]:
    """Generate 3-4 actionable tips based on profile and prediction."""
    tips = []
    monthly_income = payload.annualIncome / 12
    dti = (payload.monthlyDebt / max(monthly_income, 1)) * 100

    if payload.cibilScore < 600:
        tips.append(f"Your CIBIL score of {payload.cibilScore} is below 600. Focus on clearing overdue payments and keeping credit utilisation under 30% to improve it.")
    elif payload.cibilScore < 700:
        tips.append(f"CIBIL score {payload.cibilScore} is in the 'Fair' range. Avoid new credit inquiries for 6 months and pay all bills on time to cross the 700+ threshold.")
    elif payload.cibilScore >= 750:
        tips.append(f"Excellent CIBIL score of {payload.cibilScore}! Negotiate a lower interest rate with your lender — you qualify for premium terms.")

    if dti > 40:
        tips.append(f"Your DTI ratio is {dti:.0f}%. Consider the debt avalanche method — pay off high-interest debts first to bring it below 40%.")

    if payload.loanAmount > payload.annualIncome * 10:
        tips.append(f"Loan amount is over 10x your annual income. A co-applicant or longer tenure could improve approval chances significantly.")

    if payload.interestRate > 14:
        tips.append(f"At {payload.interestRate}% interest, compare at least 3 lender offers. A secured loan variant may cut the rate by 3-4%.")

    if pd_pct < 15:
        tips.append("Your default probability is low — maintain this by keeping emergency savings equal to 6 months of EMIs.")

    return tips[:4] if tips else ["Your financial profile is healthy. Continue building your credit history and investment portfolio."]


# ─── Endpoints ───────────────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/api/predict", response_model=PredictionResponse)
def predict(payload: ProfilePayload, _key: str = Depends(verify_api_key)):
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded. Run train_model.py first.")

    db = SessionLocal()
    try:
        # 1. Save user
        user = UserModel(
            full_name=payload.fullName,
            age=payload.age,
            dependents=payload.dependents,
            marital_status=payload.maritalStatus,
            employment_length=payload.employmentLength,
            home_ownership=payload.homeOwnership,
            cibil_score=payload.cibilScore,
        )
        db.add(user)
        db.flush()

        # 2. Save loan application
        application = LoanApplicationModel(
            user_id=user.id,
            annual_income=payload.annualIncome,
            monthly_debt=payload.monthlyDebt,
            total_investments=payload.totalInvestments,
            bank_balance=payload.bankBalance,
            loan_amount=payload.loanAmount,
            loan_purpose=payload.loanPurpose,
            interest_rate=payload.interestRate,
            loan_term_months=payload.loanTermMonths,
        )
        db.add(application)
        db.flush()

        # 3. Prepare features for ML model
        emp_years = EMP_MAP.get(payload.employmentLength, 2)
        home_numeric = HOME_MAP.get(payload.homeOwnership, 0)

        try:
            purpose_encoded = purpose_encoder.transform([payload.loanPurpose])[0]
        except ValueError:
            purpose_encoded = 0

        dti_ratio = (payload.monthlyDebt * 12) / max(payload.annualIncome, 1)
        loan_to_income = payload.loanAmount / max(payload.annualIncome, 1)

        raw_features = np.array([[
            payload.age, payload.cibilScore, payload.annualIncome,
            payload.monthlyDebt, payload.loanAmount, emp_years,
            home_numeric, payload.dependents, payload.interestRate,
            payload.loanTermMonths, purpose_encoded, dti_ratio, loan_to_income,
        ]])

        scaled_features = scaler.transform(raw_features)

        # 4. Predict
        pd_proba = model.predict_proba(scaled_features)[0][1]
        pd_pct = int(round(pd_proba * 100))
        credit_score = int(round(300 + (1 - pd_proba) * 550))

        # 5. Feature importance breakdown
        importances = model.feature_importances_
        breakdown = []
        for fname, imp in zip(feature_names, importances):
            display = FEATURE_DISPLAY_NAMES.get(fname, fname)
            points = int(round(imp * 100 * (1 - pd_proba) * 2))  # scale for display
            breakdown.append({"category": display, "points": min(points, 100), "maxPoints": 100})
        breakdown.sort(key=lambda x: -x["points"])

        # 6. Status & approval
        if credit_score >= 700:
            status = "Excellent"
        elif credit_score >= 550:
            status = "Good"
        else:
            status = "Risky"

        if pd_pct < 15:
            approval = "High"
        elif pd_pct < 35:
            approval = "Medium"
        else:
            approval = "Low"

        # 7. Health metrics
        monthly_income = payload.annualIncome / 12
        dti_pct = round((payload.monthlyDebt / max(monthly_income, 1)) * 100)
        wealth_cov = round(((payload.totalInvestments + payload.bankBalance) / max(payload.loanAmount, 1)) * 100)
        surplus = round(monthly_income - payload.monthlyDebt)

        health = {
            "dtiRatio": dti_pct,
            "dtiStatus": "Healthy" if dti_pct <= 30 else "Moderate" if dti_pct <= 50 else "Stressed",
            "wealthCoverage": wealth_cov,
            "wealthStatus": "Strong" if wealth_cov >= 80 else "Adequate" if wealth_cov >= 40 else "Weak",
            "monthlySurplus": surplus,
        }

        # 8. AI tips
        ai_tips = generate_ai_tips(payload, pd_pct)

        # 9. Save prediction
        prediction = RiskPredictionModel(
            application_id=application.id,
            credit_score=credit_score,
            probability_of_default=pd_pct,
            approval_status=approval,
            dti_ratio=dti_pct,
            wealth_coverage=wealth_cov,
            feature_importance=json.dumps(breakdown),
            ai_insights=json.dumps(ai_tips),
        )
        db.add(prediction)
        db.commit()

        return PredictionResponse(
            score=credit_score,
            maxScore=850,
            probabilityOfDefault=pd_pct,
            status=status,
            approvalProbability=approval,
            healthMetrics=health,
            breakdown=breakdown,
            aiInsights=ai_tips,
            profile=payload.dict(),
            predictionId=prediction.id,
        )

    except Exception as e:
        db.rollback()
        print(f"Prediction error: {e}")  # Log server-side only
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
