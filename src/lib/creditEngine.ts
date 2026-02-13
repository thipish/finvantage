// FinVantage 360 - Credit & Financial Health Engine

export interface ProfileInput {
  // Tab 1: Personal
  fullName: string;
  age: number;
  dependents: number;
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  employmentLength: "<1" | "1-3" | "3-5" | "5-10" | "10+";
  homeOwnership: "RENT" | "OWN" | "MORTGAGE";

  // Tab 2: Financial Health
  annualIncome: number;
  monthlyDebt: number;
  totalInvestments: number;
  bankBalance: number;

  // Tab 3: Loan Requirement
  loanAmount: number;
  loanPurpose: "Business" | "Education" | "Home" | "Personal" | "Medical" | "Auto";
  interestRate: number;
  loanTermMonths: number;
}

export interface HealthMetrics {
  dtiRatio: number; // Debt-to-Income
  dtiStatus: "Healthy" | "Moderate" | "Stressed";
  wealthCoverage: number; // (Investments + Balance) / Loan
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

const empYearsMap: Record<string, number> = {
  "<1": 0.5, "1-3": 2, "3-5": 4, "5-10": 7, "10+": 12,
};

const scorecard: Record<string, (input: ProfileInput) => number> = {
  Age: (i) => {
    if (i.age >= 35) return 85;
    if (i.age >= 28) return 70;
    if (i.age >= 22) return 55;
    return 35;
  },
  "Home Ownership": (i) => {
    if (i.homeOwnership === "OWN") return 90;
    if (i.homeOwnership === "MORTGAGE") return 70;
    return 40;
  },
  Employment: (i) => {
    const yrs = empYearsMap[i.employmentLength] ?? 2;
    if (yrs >= 10) return 95;
    if (yrs >= 5) return 75;
    if (yrs >= 2) return 55;
    return 30;
  },
  Income: (i) => {
    if (i.annualIncome >= 100000) return 100;
    if (i.annualIncome >= 60000) return 80;
    if (i.annualIncome >= 35000) return 60;
    return 35;
  },
  "Loan-to-Income": (i) => {
    const ratio = i.loanAmount / Math.max(i.annualIncome, 1);
    if (ratio < 0.2) return 95;
    if (ratio < 0.4) return 75;
    if (ratio < 0.6) return 55;
    return 30;
  },
  "Interest Rate": (i) => {
    if (i.interestRate < 8) return 90;
    if (i.interestRate < 12) return 70;
    if (i.interestRate < 18) return 45;
    return 25;
  },
  "Debt Burden": (i) => {
    const dti = (i.monthlyDebt * 12) / Math.max(i.annualIncome, 1);
    if (dti < 0.2) return 95;
    if (dti < 0.35) return 70;
    if (dti < 0.5) return 45;
    return 20;
  },
  "Financial Buffer": (i) => {
    const buffer = (i.totalInvestments + i.bankBalance) / Math.max(i.loanAmount, 1);
    if (buffer >= 1) return 95;
    if (buffer >= 0.5) return 70;
    if (buffer >= 0.2) return 45;
    return 20;
  },
};

const MAX_PTS = 100;

function computeHealthMetrics(input: ProfileInput): HealthMetrics {
  const monthlyIncome = input.annualIncome / 12;
  const dtiRatio = Math.round((input.monthlyDebt / Math.max(monthlyIncome, 1)) * 100);
  const wealthCoverage = Math.round(((input.totalInvestments + input.bankBalance) / Math.max(input.loanAmount, 1)) * 100);
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

export function calculateCreditScore(input: ProfileInput): CreditResult {
  const categories = Object.keys(scorecard);
  const breakdown = categories.map((cat) => ({
    category: cat,
    points: scorecard[cat](input),
    maxPoints: MAX_PTS,
  }));

  const total = breakdown.reduce((s, b) => s + b.points, 0);
  const maxTotal = categories.length * MAX_PTS;
  const score = Math.round(300 + (total / maxTotal) * 550);

  const norm = (score - 300) / 550;
  const logit = -3.5 + (1 - norm) * 7;
  const probabilityOfDefault = Math.round((1 / (1 + Math.exp(-logit))) * 100);

  let status: CreditResult["status"];
  if (score >= 700) status = "Excellent";
  else if (score >= 550) status = "Good";
  else status = "Risky";

  let approvalProbability: CreditResult["approvalProbability"];
  if (probabilityOfDefault < 15) approvalProbability = "High";
  else if (probabilityOfDefault < 35) approvalProbability = "Medium";
  else approvalProbability = "Low";

  const healthMetrics = computeHealthMetrics(input);

  return { score, maxScore: 850, probabilityOfDefault, status, approvalProbability, healthMetrics, breakdown, profile: input };
}
