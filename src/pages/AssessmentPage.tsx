import { useState } from "react";
import { Shield, Loader2, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NumberInput from "@/components/NumberInput";

const AI_TIPS = [
  "Maintain a CIBIL score above 750 for best interest rates.",
  "Keep your DTI ratio below 40% for higher approval odds.",
  "Consider a co-applicant to strengthen your loan application.",
  "Consolidate high-interest debts to improve creditworthiness.",
  "Build an emergency fund covering 6 months of expenses.",
];

const AssessmentPage = () => {
  const { user, totalExpenses, addAssessment } = useApp();
  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [cibilScore, setCibilScore] = useState(720);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [loanTerm, setLoanTerm] = useState(36);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: "Approved" | "Rejected"; aiTip: string } | null>(null);

  const monthlyDebt = totalExpenses;

  const calculate = async () => {
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1500));

    const monthlyIncome = annualIncome / 12;
    const dti = (monthlyDebt / Math.max(monthlyIncome, 1)) * 100;
    const loanToIncome = loanAmount / Math.max(annualIncome, 1);

    // Mock logic
    const approved = cibilScore >= 650 && dti < 50 && loanToIncome < 5;
    const status = approved ? "Approved" : "Rejected";
    const aiTip = AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)];

    setResult({ status, aiTip });

    addAssessment({
      userName: user?.name || "User",
      userEmail: user?.email || "",
      date: new Date().toISOString().slice(0, 10),
      cibilScore,
      requestedAmount: loanAmount,
      annualIncome,
      loanTerm,
      monthlyDebt,
      status,
      aiTip,
    });

    setLoading(false);
  };

  const whatsappLink = result
    ? `https://wa.me/?text=${encodeURIComponent(
        `📊 FinVantage Risk Assessment\n\nStatus: ${result.status}\nLoan Amount: ${formatCurrency(loanAmount)}\nCIBIL Score: ${cibilScore}\n\n💡 AI Tip: ${result.aiTip}\n\nPowered by FinVantage`
      )}`
    : "#";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Credit Risk Calculator</h1>
        <p className="mt-1 text-muted-foreground">Assess your loan eligibility with AI-powered analysis</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" /> Financial Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Annual Income (₹)</label>
            <NumberInput value={annualIncome} onChange={setAnnualIncome} className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">CIBIL Score</label>
            <NumberInput value={cibilScore} onChange={setCibilScore} min={300} max={900} className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground" />
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${((Math.min(Math.max(cibilScore, 300), 900) - 300) / 600) * 100}%`,
                background: cibilScore >= 750 ? "hsl(var(--success))" : cibilScore >= 650 ? "hsl(var(--warning))" : "hsl(var(--danger))",
              }} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Loan Amount Requested (₹)</label>
            <NumberInput value={loanAmount} onChange={setLoanAmount} className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Loan Term (Months)</label>
            <NumberInput value={loanTerm} onChange={setLoanTerm} min={6} max={360} className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground" />
          </div>

          <div className="rounded-xl border border-neon bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Monthly Debt (from Expense Tracker)</p>
            <p className="font-heading text-2xl font-bold text-neon">{formatCurrency(monthlyDebt)}</p>
            <p className="text-xs text-muted-foreground mt-1">Auto-synced from your logged expenses</p>
          </div>

          <Button onClick={calculate} disabled={loading} className="w-full rounded-xl gradient-primary text-primary-foreground shadow-glow h-12 font-semibold text-base">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Analyzing...</> : "Calculate Risk"}
          </Button>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className={`border-2 animate-scale-in ${
          result.status === "Approved" ? "border-success/40 bg-success/5" : "border-danger/40 bg-danger/5"
        }`}>
          <CardContent className="py-8 text-center space-y-4">
            {result.status === "Approved" ? (
              <CheckCircle className="h-16 w-16 text-success mx-auto" />
            ) : (
              <XCircle className="h-16 w-16 text-danger mx-auto" />
            )}
            <h2 className={`font-heading text-3xl font-bold ${result.status === "Approved" ? "text-success" : "text-danger"}`}>
              {result.status === "Approved" ? "Loan Approved ✓" : "Loan Rejected ✗"}
            </h2>
            <div className="rounded-xl bg-accent/50 p-4 mx-auto max-w-md">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">AI Insight</p>
              <p className="text-sm text-foreground">💡 {result.aiTip}</p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
              <span>CIBIL: <strong className="text-foreground">{cibilScore}</strong></span>
              <span>Amount: <strong className="text-foreground">{formatCurrency(loanAmount)}</strong></span>
              <span>Income: <strong className="text-foreground">{formatCurrency(annualIncome)}</strong></span>
              <span>DTI: <strong className="text-foreground">{Math.round((monthlyDebt / Math.max(annualIncome / 12, 1)) * 100)}%</strong></span>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Share Report to WhatsApp
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssessmentPage;
