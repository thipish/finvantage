import CreditGauge from "./CreditGauge";
import type { CreditResult as CreditResultType } from "@/lib/creditEngine";
import { CheckCircle, XCircle, RotateCcw, BarChart3 } from "lucide-react";

interface Props {
  result: CreditResultType;
  onReset: () => void;
}

const CreditResult = ({ result, onReset }: Props) => {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      {/* Gauge */}
      <div className="card-elevated p-8 text-center animate-scale-in">
        <CreditGauge score={result.score} maxScore={result.maxScore} status={result.status} />

        {/* Approval */}
        <div className="mt-8">
          {result.approved ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-success/10 px-6 py-3 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="font-heading text-lg font-bold">Pre-Approved</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-danger/10 px-6 py-3 text-danger">
              <XCircle className="h-5 w-5" />
              <span className="font-heading text-lg font-bold">Not Approved</span>
            </div>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Probability of Default: <span className="font-semibold text-foreground">{result.probabilityOfDefault}%</span>
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-6 card-elevated p-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold text-foreground">Score Breakdown</h2>
        </div>
        <div className="space-y-4">
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
                        pct >= 70
                          ? "hsl(var(--success))"
                          : pct >= 40
                          ? "hsl(var(--warning))"
                          : "hsl(var(--danger))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="mt-8 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/80"
        >
          <RotateCcw className="h-4 w-4" /> Check Another Profile
        </button>
      </div>
    </div>
  );
};

export default CreditResult;
