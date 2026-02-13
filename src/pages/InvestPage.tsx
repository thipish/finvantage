import { useState, useMemo } from "react";
import { TrendingUp, IndianRupee } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const InvestPage = () => {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const { totalInvested, estimatedReturns, totalValue } = useMemo(() => {
    const totalInvested = monthly * 12 * years;
    const r = rate / 100 / 12;
    const n = years * 12;
    const totalValue = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const estimatedReturns = totalValue - totalInvested;
    return { totalInvested, estimatedReturns, totalValue };
  }, [monthly, rate, years]);

  const chartData = [
    { name: "Invested", value: totalInvested },
    { name: "Returns", value: estimatedReturns },
  ];

  const COLORS = ["hsl(160 84% 39%)", "hsl(200 80% 50%)"];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center animate-fade-in-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-glow">
          <TrendingUp className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Investment Calculator</h1>
        <p className="mt-2 text-muted-foreground">Plan your SIP returns and watch your wealth grow</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Sliders */}
        <div className="card-elevated p-8 animate-scale-in">
          <div className="space-y-8">
            <div>
              <div className="mb-3 flex justify-between">
                <label className="text-sm font-medium text-foreground">Monthly Investment</label>
                <span className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                  {formatCurrency(monthly)}
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={100000}
                step={500}
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>$500</span>
                <span>$100,000</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex justify-between">
                <label className="text-sm font-medium text-foreground">Expected Return Rate</label>
                <span className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                  {rate}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1%</span>
                <span>30%</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex justify-between">
                <label className="text-sm font-medium text-foreground">Time Period</label>
                <span className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                  {years} years
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1 yr</span>
                <span>30 yrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart & values */}
        <div className="card-elevated p-8 animate-scale-in" style={{ animationDelay: "0.15s" }}>
          <div className="flex h-full flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    boxShadow: "var(--shadow-card)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Total */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="font-heading text-4xl font-bold text-gradient">{formatCurrency(totalValue)}</p>
            </div>

            {/* Legend */}
            <div className="mt-6 flex gap-8">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: COLORS[0] }} />
                <div>
                  <p className="text-xs text-muted-foreground">Invested</p>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(totalInvested)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: COLORS[1] }} />
                <div>
                  <p className="text-xs text-muted-foreground">Returns</p>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(estimatedReturns)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestPage;
