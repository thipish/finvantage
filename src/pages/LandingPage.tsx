import { useNavigate } from "react-router-dom";
import { Shield, TrendingUp, Wallet, ArrowRight, Activity } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/formatCurrency";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, assessments, totalExpenses } = useApp();

  const userAssessments = assessments.filter(
    (a) => a.userEmail === user?.email
  );
  const approved = userAssessments.filter((a) => a.status === "Approved").length;

  const quickStats = [
    { label: "Total Expenses", value: formatCurrency(totalExpenses), icon: Wallet, color: "text-warning" },
    { label: "Assessments", value: userAssessments.length.toString(), icon: Shield, color: "text-primary" },
    { label: "Approved", value: approved.toString(), icon: Activity, color: "text-success" },
  ];

  const actions = [
    { title: "Risk Assessment", desc: "Calculate your credit risk score with ML-powered analysis", icon: Shield, link: "/assessment", accent: "from-primary/20 to-primary/5" },
    { title: "Expense Tracker", desc: "Track and manage your monthly expenses", icon: Wallet, link: "/expenses", accent: "from-warning/20 to-warning/5" },
    { title: "Wealth Builder", desc: "SIP calculator with interactive growth projections", icon: TrendingUp, link: "/wealth-tools", accent: "from-info/20 to-info/5" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Welcome back, <span className="text-neon">{user?.name}</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Your financial command center overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickStats.map((s) => (
          <div key={s.label} className="metric-card">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mt-2 font-heading text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actions.map((a) => (
          <button
            key={a.title}
            onClick={() => navigate(a.link)}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${a.accent} p-6 text-left transition-all hover:shadow-elevated hover:-translate-y-0.5`}
          >
            <a.icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">{a.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
            <ArrowRight className="mt-4 h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      {/* Recent Assessments */}
      {userAssessments.length > 0 && (
        <div className="card-elevated p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Recent Assessments</h2>
          <div className="space-y-3">
            {userAssessments.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-accent/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(a.requestedAmount)} • CIBIL {a.cibilScore}</p>
                  <p className="text-xs text-muted-foreground">{a.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  a.status === "Approved"
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-danger/15 text-danger border border-danger/30"
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
