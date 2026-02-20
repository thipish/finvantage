import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreditGauge from "@/components/CreditGauge";
import type { CreditResult } from "@/lib/creditEngine";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Wallet,
  TrendingDown,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatCurrency";

const approvalConfig = {
  High: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "High Approval Probability" },
  Medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Medium Approval Probability" },
  Low: { icon: XCircle, color: "text-danger", bg: "bg-danger/10", label: "Low Approval Probability" },
};

const dtiConfig = {
  Healthy: { color: "text-success", bg: "bg-success/10" },
  Moderate: { color: "text-warning", bg: "bg-warning/10" },
  Stressed: { color: "text-danger", bg: "bg-danger/10" },
};

const wealthConfig = {
  Strong: { color: "text-success", bg: "bg-success/10" },
  Adequate: { color: "text-warning", bg: "bg-warning/10" },
  Weak: { color: "text-danger", bg: "bg-danger/10" },
};

function generateAIInsights(profile: CreditResult["profile"]): string[] {
  const tips: string[] = [];
  const { cibilScore, loanAmount, annualIncome, monthlyDebt, interestRate, loanTermMonths } = profile;
  const monthlyIncome = annualIncome / 12;

  // CIBIL-based tips
  if (cibilScore < 600) {
    tips.push(
      `Your CIBIL score of ${cibilScore} is in the "Poor" range. Focus on timely bill payments and reducing credit utilisation to improve your score before applying for large loans.`
    );
  } else if (cibilScore < 700) {
    tips.push(
      `With a CIBIL score of ${cibilScore}, you're in the "Fair" range. Clearing existing dues and avoiding new credit inquiries over the next 6 months could push you into the "Good" tier.`
    );
  } else if (cibilScore >= 750) {
    tips.push(
      `Excellent CIBIL score of ${cibilScore}! You qualify for the best interest rates. Consider negotiating a rate reduction with your lender.`
    );
  }

  // Loan-to-income tip
  if (loanAmount > annualIncome * 10) {
    tips.push(
      `Your requested loan of ${formatCurrency(loanAmount)} is more than 10× your annual income. Consider a longer tenure or adding a co-applicant to reduce per-month EMI pressure.`
    );
  }

  // DTI tip
  const dti = (monthlyDebt / Math.max(monthlyIncome, 1)) * 100;
  if (dti > 40) {
    tips.push(
      `Your Debt-to-Income ratio is ${Math.round(dti)}%, which is above the recommended 40%. Paying off smaller debts first (debt avalanche method) can free up cash flow and improve approval odds.`
    );
  }

  // Interest rate tip
  if (interestRate > 14) {
    tips.push(
      `The requested interest rate of ${interestRate}% is on the higher side. Compare offers from 3-4 lenders or consider a secured loan to bring the rate below 12%.`
    );
  }

  // Tenure tip
  if (loanTermMonths < 24 && loanAmount > 500000) {
    tips.push(
      `A ${loanTermMonths}-month tenure for ${formatCurrency(loanAmount)} will result in high monthly EMIs. Extending to 36-48 months may improve your debt serviceability ratio.`
    );
  }

  // Fallback positive tip
  if (tips.length === 0) {
    tips.push(
      `Your financial profile looks healthy! Continue maintaining timely repayments and growing your investments to unlock premium loan products in the future.`
    );
  }

  return tips.slice(0, 4);
}

const ReportPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<CreditResult | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("finvantage_result");
    if (data) {
      setResult(JSON.parse(data));
    } else {
      navigate("/assessment");
    }
  }, [navigate]);

  if (!result) return null;

  const { healthMetrics, profile } = result;
  const approval = approvalConfig[result.approvalProbability];
  const ApprovalIcon = approval.icon;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Profile header */}
      <div className="mb-6 flex items-center gap-4 animate-fade-in-up">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
          <User className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {profile.fullName || "Assessment"} Report
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile.loanPurpose} Loan · {formatCurrency(profile.loanAmount)} · {profile.loanTermMonths} months
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credit Gauge Card */}
        <div className="card-elevated p-8 text-center animate-scale-in">
          <div className="mb-4 flex items-center justify-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Credit Risk Score</h2>
          </div>
          <CreditGauge score={result.score} maxScore={result.maxScore} status={result.status} />

          <div className="mt-6">
            <div className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 ${approval.bg} ${approval.color}`}>
              <ApprovalIcon className="h-5 w-5" />
              <span className="font-heading text-base font-bold">{approval.label}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Probability of Default: <span className="font-semibold text-foreground">{result.probabilityOfDefault}%</span>
            </p>
          </div>
        </div>

        {/* Financial Health Card */}
        <div className="space-y-6 animate-scale-in" style={{ animationDelay: "0.1s" }}>
          {/* DTI */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-base font-bold text-foreground">Debt-to-Income Ratio</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-heading text-4xl font-bold text-foreground">{healthMetrics.dtiRatio}%</p>
                <div className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${dtiConfig[healthMetrics.dtiStatus].bg} ${dtiConfig[healthMetrics.dtiStatus].color}`}>
                  {healthMetrics.dtiStatus}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Monthly Debt: {formatCurrency(profile.monthlyDebt)}</p>
                <p>Monthly Income: {formatCurrency(profile.annualIncome / 12)}</p>
              </div>
            </div>
            {/* Bar */}
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(healthMetrics.dtiRatio, 100)}%`,
                  background:
                    healthMetrics.dtiRatio <= 30
                      ? "hsl(var(--success))"
                      : healthMetrics.dtiRatio <= 50
                      ? "hsl(var(--warning))"
                      : "hsl(var(--danger))",
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>30% ideal</span>
              <span>50%+</span>
            </div>
          </div>

          {/* Wealth Coverage */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-base font-bold text-foreground">Wealth Coverage Ratio</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-heading text-4xl font-bold text-foreground">{healthMetrics.wealthCoverage}%</p>
                <div className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${wealthConfig[healthMetrics.wealthStatus].bg} ${wealthConfig[healthMetrics.wealthStatus].color}`}>
                  {healthMetrics.wealthStatus}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Investments: {formatCurrency(profile.totalInvestments)}</p>
                <p>Bank Balance: {formatCurrency(profile.bankBalance)}</p>
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(healthMetrics.wealthCoverage, 100)}%`,
                  background:
                    healthMetrics.wealthCoverage >= 80
                      ? "hsl(var(--success))"
                      : healthMetrics.wealthCoverage >= 40
                      ? "hsl(var(--warning))"
                      : "hsl(var(--danger))",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-6 card-elevated p-8 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold text-foreground">Score Breakdown (9 Dimensions)</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {result.breakdown.map((b) => {
            const pct = (b.points / b.maxPoints) * 100;
            return (
              <div key={b.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">{b.category}</span>
                  <span className="font-semibold text-foreground">{b.points}/{b.maxPoints}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${pct}%`,
                      background:
                        pct >= 70 ? "hsl(var(--success))" : pct >= 40 ? "hsl(var(--warning))" : "hsl(var(--danger))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Financial Insights */}
      <div className="mt-6 card-elevated p-8 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">AI Financial Insights</h2>
            <p className="text-xs text-muted-foreground">Personalised recommendations based on your profile</p>
          </div>
        </div>
        <div className="space-y-3">
          {generateAIInsights(profile).map((tip, idx) => (
            <div
              key={idx}
              className="flex gap-3 rounded-xl border border-border bg-accent/30 px-4 py-3 transition-all hover:bg-accent/50"
            >
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-xs font-bold text-primary">{idx + 1}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{tip}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          ✨ AI-generated insights · Not financial advice · Consult a certified advisor for personalised guidance
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => {
            sessionStorage.removeItem("finvantage_result");
            navigate("/assessment");
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/80"
        >
          <RotateCcw className="h-4 w-4" /> New Assessment
        </button>
        <button
          onClick={() => navigate("/wealth-tools")}
          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90"
        >
          Plan Your Wealth →
        </button>
      </div>
    </div>
  );
};

export default ReportPage;
