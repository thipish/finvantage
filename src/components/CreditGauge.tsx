interface CreditGaugeProps {
  score: number;
  maxScore: number;
  status: "Excellent" | "Good" | "Risky";
}

const statusColors = {
  Excellent: { stroke: "hsl(160 84% 39%)", bg: "hsl(160 84% 39% / 0.1)" },
  Good: { stroke: "hsl(38 92% 50%)", bg: "hsl(38 92% 50% / 0.1)" },
  Risky: { stroke: "hsl(0 72% 51%)", bg: "hsl(0 72% 51% / 0.1)" },
};

const CreditGauge = ({ score, maxScore, status }: CreditGaugeProps) => {
  const percentage = ((score - 300) / (maxScore - 300)) * 100;
  const circumference = Math.PI * 90; // half circle, r=90
  const offset = circumference - (percentage / 100) * circumference;
  const colors = statusColors[status];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="240" height="140" viewBox="0 0 240 140">
          {/* Background arc */}
          <path
            d="M 20 130 A 90 90 0 0 1 220 130"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d="M 20 130 A 90 90 0 0 1 220 130"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-[1.5s] ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${colors.stroke})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="font-heading text-5xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">out of {maxScore}</span>
        </div>
      </div>
      <div
        className="mt-3 rounded-full px-5 py-1.5 text-sm font-semibold"
        style={{ backgroundColor: colors.bg, color: colors.stroke }}
      >
        {status}
      </div>
    </div>
  );
};

export default CreditGauge;
