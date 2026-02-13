import { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const WealthToolsPage = () => {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const { totalInvested, estimatedReturns, totalValue, chartData } = useMemo(() => {
    const r = rate / 100 / 12;
    const data: { year: number; Invested: number; Value: number }[] = [];

    for (let y = 0; y <= years; y++) {
      const n = y * 12;
      const invested = monthly * n;
      const value = n === 0 ? 0 : Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
      data.push({ year: y, Invested: invested, Value: value });
    }

    const totalInvested = monthly * 12 * years;
    const n = years * 12;
    const totalValue = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const estimatedReturns = totalValue - totalInvested;

    return { totalInvested, estimatedReturns, totalValue, chartData: data };
  }, [monthly, rate, years]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center animate-fade-in-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-glow">
          <TrendingUp className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Wealth Builder</h1>
        <p className="mt-2 text-muted-foreground">Visualize how your SIP investments grow over time</p>
      </div>

      {/* Total Value highlight */}
      <div className="mb-8 text-center animate-scale-in">
        <p className="text-sm text-muted-foreground">Projected Total Value</p>
        <p className="font-heading text-5xl font-bold text-gradient">{formatCurrency(totalValue)}</p>
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <span className="text-muted-foreground">
            Invested: <span className="font-semibold text-foreground">{formatCurrency(totalInvested)}</span>
          </span>
          <span className="text-muted-foreground">
            Returns: <span className="font-semibold text-primary">{formatCurrency(estimatedReturns)}</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="card-elevated p-6 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200 80% 50%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(200 80% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tickFormatter={(v) => `Y${v}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(l) => `Year ${l}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                boxShadow: "var(--shadow-card)",
                fontSize: "13px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Invested"
              stroke="hsl(200 80% 50%)"
              fillOpacity={1}
              fill="url(#colorInvested)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Value"
              stroke="hsl(160 84% 39%)"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sliders */}
      <div className="card-elevated p-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
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
              min={8}
              max={24}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>8%</span>
              <span>24%</span>
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
    </div>
  );
};

export default WealthToolsPage;
