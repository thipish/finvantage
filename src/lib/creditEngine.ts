// Credit scoring engine - simulates ML model predictions

export interface CreditInput {
  age: number;
  homeOwnership: "RENT" | "OWN" | "MORTGAGE";
  employmentLength: number;
  annualIncome: number;
  loanAmount: number;
  interestRate: number;
  loanGrade: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  defaultHistory: boolean;
}

export interface CreditResult {
  score: number;
  maxScore: number;
  probabilityOfDefault: number;
  status: "Excellent" | "Good" | "Risky";
  approved: boolean;
  breakdown: { category: string; points: number; maxPoints: number }[];
}

// Scorecard-based credit scoring (simulates df_scorecard.csv lookup)
const scorecard: Record<string, (input: CreditInput) => number> = {
  "Age": (i) => {
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
  "Employment": (i) => {
    if (i.employmentLength >= 10) return 95;
    if (i.employmentLength >= 5) return 75;
    if (i.employmentLength >= 2) return 55;
    return 30;
  },
  "Income": (i) => {
    if (i.annualIncome >= 100000) return 100;
    if (i.annualIncome >= 60000) return 80;
    if (i.annualIncome >= 35000) return 60;
    return 35;
  },
  "Loan Amount": (i) => {
    const ratio = i.loanAmount / i.annualIncome;
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
  "Loan Grade": (i) => {
    const grades: Record<string, number> = { A: 100, B: 85, C: 65, D: 50, E: 35, F: 20, G: 10 };
    return grades[i.loanGrade] || 50;
  },
  "Default History": (i) => (i.defaultHistory ? 10 : 95),
};

const MAX_POINTS_PER_CATEGORY = 100;

export function calculateCreditScore(input: CreditInput): CreditResult {
  const categories = Object.keys(scorecard);
  const breakdown = categories.map((category) => ({
    category,
    points: scorecard[category](input),
    maxPoints: MAX_POINTS_PER_CATEGORY,
  }));

  const totalPoints = breakdown.reduce((sum, b) => sum + b.points, 0);
  const maxTotal = categories.length * MAX_POINTS_PER_CATEGORY;

  // Map to 300-850 range
  const score = Math.round(300 + (totalPoints / maxTotal) * 550);

  // Simulate logistic regression PD
  const normalizedScore = (score - 300) / 550;
  const logit = -3.5 + (1 - normalizedScore) * 7;
  const probabilityOfDefault = Math.round((1 / (1 + Math.exp(-logit))) * 100);

  let status: CreditResult["status"];
  if (score >= 700) status = "Excellent";
  else if (score >= 550) status = "Good";
  else status = "Risky";

  const approved = probabilityOfDefault < 20;

  return { score, maxScore: 850, probabilityOfDefault, status, approved, breakdown };
}
