import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateCreditScore, type CreditInput } from "@/lib/creditEngine";
import CreditResult from "@/components/CreditResult";
import { Shield, ChevronRight, ChevronLeft, User, DollarSign, FileText } from "lucide-react";

const STEPS = [
  { title: "Personal Info", icon: User },
  { title: "Financial Details", icon: DollarSign },
  { title: "Loan History", icon: FileText },
];

const defaultForm: CreditInput = {
  age: 30,
  homeOwnership: "RENT",
  employmentLength: 3,
  annualIncome: 55000,
  loanAmount: 12000,
  interestRate: 11,
  loanGrade: "B",
  defaultHistory: false,
};

const Index = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreditInput>(defaultForm);
  const [result, setResult] = useState<ReturnType<typeof calculateCreditScore> | null>(null);

  const update = <K extends keyof CreditInput>(key: K, value: CreditInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const res = calculateCreditScore(form);
    setResult(res);
  };

  if (result) {
    return <CreditResult result={result} onReset={() => setResult(null)} />;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center animate-fade-in-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Credit Risk Assessment</h1>
        <p className="mt-2 text-muted-foreground">
          Get your credit score and risk status in seconds
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : i < step
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
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

      {/* Form card */}
      <div className="card-elevated p-8 animate-scale-in">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => update("age", Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Home Ownership</label>
              <div className="grid grid-cols-3 gap-3">
                {(["RENT", "OWN", "MORTGAGE"] as const).map((opt) => (
                  <button
                    key={opt}
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
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Employment Length (years)
              </label>
              <input
                type="range"
                min={0}
                max={30}
                value={form.employmentLength}
                onChange={(e) => update("employmentLength", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-semibold text-foreground">{form.employmentLength} years</span>
                <span>30</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Annual Income ($)</label>
              <input
                type="number"
                value={form.annualIncome}
                onChange={(e) => update("annualIncome", Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Loan Amount ($)</label>
              <input
                type="number"
                value={form.loanAmount}
                onChange={(e) => update("loanAmount", Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Interest Rate (%)</label>
              <input
                type="range"
                min={3}
                max={30}
                step={0.5}
                value={form.interestRate}
                onChange={(e) => update("interestRate", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>3%</span>
                <span className="font-semibold text-foreground">{form.interestRate}%</span>
                <span>30%</span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Loan Grade</label>
              <div className="flex flex-wrap gap-2">
                {(["A", "B", "C", "D", "E", "F", "G"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => update("loanGrade", g)}
                    className={`h-10 w-10 rounded-xl text-sm font-semibold transition-all ${
                      form.loanGrade === g
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "border border-input bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                Have you ever defaulted on a loan?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => update("defaultHistory", val)}
                    className={`rounded-xl border px-6 py-4 text-sm font-medium transition-all ${
                      form.defaultHistory === val
                        ? val
                          ? "border-destructive bg-destructive text-destructive-foreground"
                          : "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-input bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
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
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              className="flex items-center gap-2 rounded-xl gradient-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90"
            >
              Calculate Score
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
