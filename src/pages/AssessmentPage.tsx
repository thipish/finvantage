import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateCreditScore, type ProfileInput } from "@/lib/creditEngine";
import { formatCurrency } from "@/lib/formatCurrency";
import NumberInput from "@/components/NumberInput";
import { Shield, ChevronRight, ChevronLeft, User, DollarSign, FileText } from "lucide-react";

const STEPS = [
  { title: "Personal Profile", icon: User },
  { title: "Financial Health", icon: DollarSign },
  { title: "Loan Requirement", icon: FileText },
];

const defaultForm: ProfileInput = {
  fullName: "",
  age: 30,
  dependents: 0,
  maritalStatus: "Single",
  employmentLength: "3-5",
  homeOwnership: "RENT",
  annualIncome: 55000,
  monthlyDebt: 800,
  totalInvestments: 15000,
  bankBalance: 8000,
  loanAmount: 20000,
  loanPurpose: "Personal",
  interestRate: 11,
  loanTermMonths: 36,
};

const InputField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const textInput =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring";

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileInput>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = "Name is required";
      if (form.fullName.length > 100) e.fullName = "Max 100 characters";
      if (form.age < 18 || form.age > 100) e.age = "Age must be 18-100";
      if (form.dependents < 0 || form.dependents > 20) e.dependents = "Invalid";
    }
    if (step === 1) {
      if (form.annualIncome <= 0) e.annualIncome = "Must be positive";
      if (form.monthlyDebt < 0) e.monthlyDebt = "Cannot be negative";
      if (form.totalInvestments < 0) e.totalInvestments = "Cannot be negative";
      if (form.bankBalance < 0) e.bankBalance = "Cannot be negative";
    }
    if (step === 2) {
      if (form.loanAmount <= 0) e.loanAmount = "Must be positive";
      if (form.interestRate <= 0 || form.interestRate > 40) e.interestRate = "Rate must be 0.1-40%";
      if (form.loanTermMonths < 6 || form.loanTermMonths > 360) e.loanTermMonths = "Term must be 6-360 months";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => s + 1);
  };

  const submit = () => {
    if (!validate()) return;
    const result = calculateCreditScore(form);
    sessionStorage.setItem("finvantage_result", JSON.stringify(result));
    navigate("/report");
  };

  const ErrorMsg = ({ field }: { field: string }) =>
    errors[field] ? <p className="mt-1 text-xs text-destructive">{errors[field]}</p> : null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center animate-fade-in-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">360° Risk Assessment</h1>
        <p className="mt-2 text-muted-foreground">Complete your profile for a comprehensive credit analysis</p>
      </div>

      {/* Steps */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => { if (i < step) setStep(i); }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : i < step
                  ? "bg-accent text-accent-foreground cursor-pointer"
                  : "text-muted-foreground cursor-default"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="card-elevated p-8 animate-scale-in">
        {step === 0 && (
          <div className="space-y-5">
            <InputField label="Full Name">
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
                className={textInput}
              />
              <ErrorMsg field="fullName" />
            </InputField>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Age">
                <NumberInput
                  value={form.age}
                  onChange={(v) => update("age", v)}
                  min={18}
                  max={100}
                  className={textInput}
                />
                <ErrorMsg field="age" />
              </InputField>
              <InputField label="Dependents">
                <NumberInput
                  value={form.dependents}
                  onChange={(v) => update("dependents", v)}
                  min={0}
                  max={20}
                  className={textInput}
                />
                <ErrorMsg field="dependents" />
              </InputField>
            </div>

            <InputField label="Marital Status">
              <select
                value={form.maritalStatus}
                onChange={(e) => update("maritalStatus", e.target.value as ProfileInput["maritalStatus"])}
                className={textInput}
              >
                {["Single", "Married", "Divorced", "Widowed"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </InputField>

            <InputField label="Employment Length">
              <select
                value={form.employmentLength}
                onChange={(e) => update("employmentLength", e.target.value as ProfileInput["employmentLength"])}
                className={textInput}
              >
                {[
                  { v: "<1", l: "Less than 1 year" },
                  { v: "1-3", l: "1-3 years" },
                  { v: "3-5", l: "3-5 years" },
                  { v: "5-10", l: "5-10 years" },
                  { v: "10+", l: "10+ years" },
                ].map(({ v, l }) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </InputField>

            <InputField label="Home Ownership">
              <div className="grid grid-cols-3 gap-3">
                {(["RENT", "OWN", "MORTGAGE"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update("homeOwnership", opt)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      form.homeOwnership === opt
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-input bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </InputField>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <InputField label="Annual Income (₹)">
              <NumberInput
                value={form.annualIncome}
                onChange={(v) => update("annualIncome", v)}
                className={textInput}
              />
              <ErrorMsg field="annualIncome" />
            </InputField>

            <InputField label="Total Monthly Debt / EMI (₹)">
              <NumberInput
                value={form.monthlyDebt}
                onChange={(v) => update("monthlyDebt", v)}
                className={textInput}
              />
              <ErrorMsg field="monthlyDebt" />
            </InputField>

            <InputField label="Total Investments (Stocks/SIPs/Gold) (₹)">
              <NumberInput
                value={form.totalInvestments}
                onChange={(v) => update("totalInvestments", v)}
                className={textInput}
              />
              <ErrorMsg field="totalInvestments" />
            </InputField>

            <InputField label="Primary Bank Balance (₹)">
              <NumberInput
                value={form.bankBalance}
                onChange={(v) => update("bankBalance", v)}
                className={textInput}
              />
              <ErrorMsg field="bankBalance" />
            </InputField>

            {/* Quick summary */}
            <div className="rounded-xl bg-accent/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Snapshot</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Monthly Income:</span>
                <span className="font-semibold text-foreground text-right">{formatCurrency(form.annualIncome / 12)}</span>
                <span className="text-muted-foreground">DTI Ratio:</span>
                <span className="font-semibold text-foreground text-right">
                  {Math.round((form.monthlyDebt / Math.max(form.annualIncome / 12, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <InputField label={`Loan Amount: ${formatCurrency(form.loanAmount)}`}>
              <input
                type="range"
                min={1000}
                max={500000}
                step={1000}
                value={form.loanAmount}
                onChange={(e) => update("loanAmount", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>₹1,000</span>
                <span>₹5,00,000</span>
              </div>
              <ErrorMsg field="loanAmount" />
            </InputField>

            <InputField label="Loan Purpose">
              <select
                value={form.loanPurpose}
                onChange={(e) => update("loanPurpose", e.target.value as ProfileInput["loanPurpose"])}
                className={textInput}
              >
                {["Business", "Education", "Home", "Personal", "Medical", "Auto"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </InputField>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Interest Rate (%)">
                <NumberInput
                  value={form.interestRate}
                  onChange={(v) => update("interestRate", v)}
                  step={0.5}
                  className={textInput}
                />
                <ErrorMsg field="interestRate" />
              </InputField>

              <InputField label="Loan Term (Months)">
                <NumberInput
                  value={form.loanTermMonths}
                  onChange={(v) => update("loanTermMonths", v)}
                  min={6}
                  max={360}
                  className={textInput}
                />
                <ErrorMsg field="loanTermMonths" />
              </InputField>
            </div>

            {/* Loan summary */}
            <div className="rounded-xl bg-accent/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Estimated Monthly Payment</p>
              <p className="font-heading text-2xl font-bold text-foreground">
                {formatCurrency(
                  (() => {
                    const r = form.interestRate / 100 / 12;
                    const n = form.loanTermMonths;
                    if (r === 0) return form.loanAmount / n;
                    return (form.loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                  })()
                )}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 2 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              className="flex items-center gap-2 rounded-xl gradient-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90"
            >
              Generate Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
