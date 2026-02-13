import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, TrendingUp, ArrowRight, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "360° Risk Assessment",
    desc: "ML-powered credit scoring with financial health analytics across 8 risk dimensions.",
    link: "/assessment",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: TrendingUp,
    title: "Wealth Builder",
    desc: "SIP calculator with interactive growth projections and year-by-year breakdown.",
    link: "/wealth-tools",
    color: "bg-info/10 text-info",
  },
  {
    icon: LayoutDashboard,
    title: "Executive Dashboard",
    desc: "Comprehensive report with DTI ratios, wealth coverage, and approval probability.",
    link: "/assessment",
    color: "bg-warning/10 text-warning",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="animate-fade-in-up">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero shadow-glow">
            <LayoutDashboard className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-5xl font-bold leading-tight text-foreground sm:text-6xl">
            Fin<span className="text-gradient">Vantage</span> 360
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Enterprise-grade financial analytics. Assess credit risk, analyze financial health,
            and plan your wealth — all in one platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate("/assessment")}
              className="flex items-center gap-2 rounded-2xl gradient-primary px-8 py-3.5 font-heading text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90"
            >
              Start Assessment <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/wealth-tools")}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-8 py-3.5 font-heading text-sm font-semibold text-foreground transition-all hover:bg-accent"
            >
              Wealth Calculator
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <button
              key={f.title}
              onClick={() => navigate(f.link)}
              className="card-elevated group p-8 text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Get started <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
