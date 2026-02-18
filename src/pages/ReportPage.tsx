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
          <h2 className="font-heading text-lg font-bold text-foreground">Score Breakdown (8 Dimensions)</h2>
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
