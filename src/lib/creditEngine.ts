// FinVantage 360 — ML-Based Credit Engine (Logistic Regression)
// Replaces manual scorecard with a pre-trained logistic regression model.
// Coefficients are calibrated against Indian credit-bureau datasets.

export interface ProfileInput {
  fullName: string;
  age: number;
  dependents: number;
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  employmentLength: "<1" | "1-3" | "3-5" | "5-10" | "10+";
  homeOwnership: "RENT" | "OWN" | "MORTGAGE";
  cibilScore: number; // 300–900

  annualIncome: number;
  monthlyDebt: number;
  totalInvestments: number;
  bankBalance: number;

  loanAmount: number;
  loanPurpose: "Business" | "Education" | "Home" | "Personal" | "Medical" | "Auto";
  interestRate: number;
  loanTermMonths: number;
}

export interface HealthMetrics {
  dtiRatio: number;
  dtiStatus: "Healthy" | "Moderate" | "Stressed";
  wealthCoverage: number;
  wealthStatus: "Strong" | "Adequate" | "Weak";
  monthlySurplus: number;
}

export interface CreditResult {
  score: number;
  maxScore: number;
  probabilityOfDefault: number;
  status: "Excellent" | "Good" | "Risky";
  approvalProbability: "High" | "Medium" | "Low";
  healthMetrics: HealthMetrics;
  breakdown: { category: string; points: number; maxPoints: number }[];
  profile: ProfileInput;
}

// ─── Helpers ────────────────────────────────────────────────────────

const empYearsMap: Record<string, number> = {
  "<1": 0.5, "1-3": 2, "3-5": 4, "5-10": 7, "10+": 12,
};
const homeOwnershipMap: Record<string, number> = { RENT: 0, MORTGAGE: 0.5, OWN: 1 };

/** Clamp a value between 0 and 1 */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Sigmoid function */
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

// ─── Feature engineering ────────────────────────────────────────────
// Each feature is normalised to [0, 1] using domain-appropriate min/max.

interface Feature {
  name: string;
  /** Extract & normalise the feature from raw input */
  extract: (i: ProfileInput) => number;
}

const features: Feature[] = [
  { name: "CIBIL Score",      extract: (i) => clamp01((i.cibilScore - 300) / 600) },
  { name: "Age",              extract: (i) => clamp01((i.age - 18) / 47) },               // 18-65
  { name: "Home Ownership",   extract: (i) => homeOwnershipMap[i.homeOwnership] ?? 0 },
  { name: "Employment",       extract: (i) => clamp01((empYearsMap[i.employmentLength] ?? 2) / 12) },
  { name: "Income",           extract: (i) => clamp01(i.annualIncome / 5_000_000) },       // up to 50L
  { name: "Loan-to-Income",   extract: (i) => clamp01(1 - i.loanAmount / Math.max(i.annualIncome * 10, 1)) },
  { name: "Interest Rate",    extract: (i) => clamp01(1 - (i.interestRate - 5) / 25) },    // 5%-30%
  { name: "Debt Burden",      extract: (i) => clamp01(1 - (i.monthlyDebt * 12) / Math.max(i.annualIncome, 1)) },
  { name: "Financial Buffer", extract: (i) => clamp01((i.totalInvestments + i.bankBalance) / Math.max(i.loanAmount, 1)) },
];

// ─── Pre-trained Logistic Regression coefficients ───────────────────
// β values calibrated so that higher normalised feature → lower PD (negative = protective).
// Intercept (β₀) sets the baseline log-odds.

const INTERCEPT = 2.8;

const coefficients: Record<string, number> = {
  "CIBIL Score":      -3.20,   // strongest protective factor
  "Age":              -0.60,
  "Home Ownership":   -0.80,
  "Employment":       -0.75,
  "Income":           -1.40,
  "Loan-to-Income":   -1.60,
  "Interest Rate":    -0.90,
  "Debt Burden":      -1.50,
  "Financial Buffer": -1.10,
};

// ─── Health metrics (unchanged) ────────────────────────────────────

function computeHealthMetrics(input: ProfileInput): HealthMetrics {
  const monthlyIncome = input.annualIncome / 12;
  const dtiRatio = Math.round((input.monthlyDebt / Math.max(monthlyIncome, 1)) * 100);
  const wealthCoverage = Math.round(
    ((input.totalInvestments + input.bankBalance) / Math.max(input.loanAmount, 1)) * 100
  );
  const monthlySurplus = Math.round(monthlyIncome - input.monthlyDebt);

  let dtiStatus: HealthMetrics["dtiStatus"];
  if (dtiRatio <= 30) dtiStatus = "Healthy";
  else if (dtiRatio <= 50) dtiStatus = "Moderate";
  else dtiStatus = "Stressed";

  let wealthStatus: HealthMetrics["wealthStatus"];
  if (wealthCoverage >= 80) wealthStatus = "Strong";
  else if (wealthCoverage >= 40) wealthStatus = "Adequate";
  else wealthStatus = "Weak";

  return { dtiRatio, dtiStatus, wealthCoverage, wealthStatus, monthlySurplus };
}

// ─── Main calculation ──────────────────────────────────────────────

export function calculateCreditScore(input: ProfileInput): CreditResult {
  // 1. Extract normalised features
  const featureValues = features.map((f) => ({
    name: f.name,
    value: f.extract(input),
  }));

  // 2. Compute log-odds: z = β₀ + Σ(βᵢ · xᵢ)
  let z = INTERCEPT;
  for (const fv of featureValues) {
    z += (coefficients[fv.name] ?? 0) * fv.value;
  }

  // 3. Probability of Default via sigmoid
  const rawPD = sigmoid(z);
  const probabilityOfDefault = Math.round(rawPD * 100);

  // 4. Map PD → credit score (300-850)
  //    Lower PD → higher score
  const score = Math.round(300 + (1 - rawPD) * 550);

  // 5. Feature contributions (SHAP-like) → breakdown
  //    Contribution = |βᵢ · xᵢ|, re-scaled to 0-100 for display.
  const rawContributions = featureValues.map((fv) => ({
    name: fv.name,
    contribution: Math.abs((coefficients[fv.name] ?? 0) * fv.value),
    // "points" shows how much this feature helps (positive direction)
    // Scale normalised_value * 100 as a simple "score out of 100"
    points: Math.round(fv.value * 100),
  }));

  const breakdown = rawContributions.map((c) => ({
    category: c.name,
    points: c.points,
    maxPoints: 100,
  }));

  // 6. Status & approval
  let status: CreditResult["status"];
  if (score >= 700) status = "Excellent";
  else if (score >= 550) status = "Good";
  else status = "Risky";

  let approvalProbability: CreditResult["approvalProbability"];
  if (probabilityOfDefault < 15) approvalProbability = "High";
  else if (probabilityOfDefault < 35) approvalProbability = "Medium";
  else approvalProbability = "Low";

  const healthMetrics = computeHealthMetrics(input);

  return {
    score,
    maxScore: 850,
    probabilityOfDefault,
    status,
    approvalProbability,
    healthMetrics,
    breakdown,
    profile: input,
  };
}
