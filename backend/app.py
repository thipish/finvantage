"""
FinVantage ML Platform — FastAPI Backend
=========================================
Serves the trained Random Forest model, handles auth, and persists results in MySQL.

Usage:
    pip install -r requirements.txt
    uvicorn app:app --reload --port 8000

Endpoints:
    POST /api/auth/register — Register a new user
    POST /api/auth/login    — Login and receive JWT
    POST /api/predict       — Run ML prediction (requires JWT)
    GET  /api/history       — Fetch user's assessment history (requires JWT)
    GET  /api/health        — Health check
"""

import os
import json
from typing import Optional
from datetime import datetime, timedelta

import numpy as np
import joblib
import bcrypt
import jwt as pyjwt
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, DECIMAL
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# ─── Configuration ───────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required. Example: mysql+pymysql://user:pass@host:3306/finvantage")

API_KEY = os.getenv("FINVANTAGE_API_KEY")
if not API_KEY:
    raise RuntimeError("FINVANTAGE_API_KEY environment variable is required for endpoint authentication.")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required. Generate with: openssl rand -hex 32")

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# ─── Database Setup ──────────────────────────────────────────────────
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


# ─── ORM Models ──────────────────────────────────────────────────────
class AuthUserModel(Base):
    __tablename__ = "auth_users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    auth_user_id = Column(Integer, ForeignKey("auth_users.id"), nullable=False)
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


class AssessmentHistoryModel(Base):
    __tablename__ = "assessment_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    auth_user_id = Column(Integer, ForeignKey("auth_users.id"), nullable=False)
    user_name = Column(String(100), nullable=False)
    assessment_input = Column(JSON, nullable=False)
    credit_score = Column(Integer, nullable=False)
    probability_of_default = Column(Float, nullable=False)
    approval_status = Column(String(10), nullable=False)
    status_label = Column(String(20), nullable=False)
    health_metrics = Column(JSON)
    breakdown = Column(JSON)
    ai_insights = Column(JSON)
    prediction_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


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
app = FastAPI(title="FinVantage ML API", version="3.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
)

# ─── Security Dependencies ───────────────────────────────────────────
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


async def verify_api_key(key: str = Security(api_key_header)):
    if not key or key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return key


def create_jwt(user_id: int, email: str, name: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    _key: str = Depends(verify_api_key),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    try:
        payload = pyjwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"id": payload["sub"], "email": payload["email"], "name": payload["name"]}
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── Request / Response Schemas ──────────────────────────────────────
class RegisterPayload(BaseModel):
    fullName: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginPayload(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(BaseModel):
    token: str
    user: dict


class ProfilePayload(BaseModel):
    fullName: str = Field(min_length=1, max_length=100)
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
    tips = []
    monthly_income = payload.annualIncome / 12
    dti = (payload.monthlyDebt / max(monthly_income, 1)) * 100

    if payload.cibilScore < 600:
        tips.append(f"Your CIBIL score of {payload.cibilScore} is below 600. Focus on clearing overdue payments and keeping credit utilisation under 30%.")
    elif payload.cibilScore < 700:
        tips.append(f"CIBIL score {payload.cibilScore} is 'Fair'. Avoid new credit inquiries for 6 months to cross the 700+ threshold.")
    elif payload.cibilScore >= 750:
        tips.append(f"Excellent CIBIL score of {payload.cibilScore}! Negotiate a lower interest rate — you qualify for premium terms.")

    if dti > 40:
        tips.append(f"DTI ratio is {dti:.0f}%. Pay off high-interest debts first to bring it below 40%.")

    if payload.loanAmount > payload.annualIncome * 10:
        tips.append("Loan amount is over 10x income. A co-applicant or longer tenure could help.")

    if payload.interestRate > 14:
        tips.append(f"At {payload.interestRate}% interest, compare at least 3 lender offers.")

    if pd_pct < 15:
        tips.append("Default probability is low — keep emergency savings equal to 6 months of EMIs.")

    return tips[:4] if tips else ["Your financial profile is healthy. Continue building credit history."]


# ─── Auth Endpoints ──────────────────────────────────────────────────
@app.post("/api/auth/register", response_model=AuthResponse)
def register(payload: RegisterPayload, _key: str = Depends(verify_api_key)):
    db = SessionLocal()
    try:
        existing = db.query(AuthUserModel).filter(AuthUserModel.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        hashed = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt())
        user = AuthUserModel(
            full_name=payload.fullName,
            email=payload.email,
            password_hash=hashed.decode("utf-8"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_jwt(user.id, user.email, user.full_name)
        return AuthResponse(
            token=token,
            user={"id": user.id, "name": user.full_name, "email": user.email},
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")
    finally:
        db.close()


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginPayload, _key: str = Depends(verify_api_key)):
    db = SessionLocal()
    try:
        user = db.query(AuthUserModel).filter(AuthUserModel.email == payload.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not bcrypt.checkpw(payload.password.encode("utf-8"), user.password_hash.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_jwt(user.id, user.email, user.full_name)
        return AuthResponse(
            token=token,
            user={"id": user.id, "name": user.full_name, "email": user.email},
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")
    finally:
        db.close()


# ─── Health ──────────────────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}


# ─── Predict Endpoint ───────────────────────────────────────────────
@app.post("/api/predict", response_model=PredictionResponse)
def predict(payload: ProfilePayload, current_user: dict = Depends(get_current_user)):
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded. Run train_model.py first.")

    db = SessionLocal()
    try:
        # 1. Save user profile snapshot
        user = UserModel(
            auth_user_id=current_user["id"],
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
            points = int(round(imp * 100 * (1 - pd_proba) * 2))
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
        db.flush()

        # 10. Save to assessment history
        history = AssessmentHistoryModel(
            auth_user_id=current_user["id"],
            user_name=payload.fullName,
            assessment_input=json.dumps(payload.dict()),
            credit_score=credit_score,
            probability_of_default=pd_pct,
            approval_status=approval,
            status_label=status,
            health_metrics=json.dumps(health),
            breakdown=json.dumps(breakdown),
            ai_insights=json.dumps(ai_tips),
            prediction_id=prediction.id,
        )
        db.add(history)
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
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
    finally:
        db.close()


# ─── History Endpoint ────────────────────────────────────────────────
@app.get("/api/history")
def get_history(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        records = (
            db.query(AssessmentHistoryModel)
            .filter(AssessmentHistoryModel.auth_user_id == current_user["id"])
            .order_by(AssessmentHistoryModel.created_at.desc())
            .limit(50)
            .all()
        )

        return [
            {
                "id": r.id,
                "userName": r.user_name,
                "creditScore": r.credit_score,
                "probabilityOfDefault": float(r.probability_of_default),
                "approvalStatus": r.approval_status,
                "statusLabel": r.status_label,
                "healthMetrics": json.loads(r.health_metrics) if isinstance(r.health_metrics, str) else r.health_metrics,
                "breakdown": json.loads(r.breakdown) if isinstance(r.breakdown, str) else r.breakdown,
                "aiInsights": json.loads(r.ai_insights) if isinstance(r.ai_insights, str) else r.ai_insights,
                "assessmentInput": json.loads(r.assessment_input) if isinstance(r.assessment_input, str) else r.assessment_input,
                "predictionId": r.prediction_id,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]
    except Exception as e:
        print(f"History error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load history.")
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
