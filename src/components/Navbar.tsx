import { Link, useLocation } from "react-router-dom";
import { Shield, TrendingUp, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { to: "/assessment", label: "Risk Assessment", icon: Shield },
    { to: "/wealth-tools", label: "Wealth Builder", icon: TrendingUp },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Fin<span className="text-primary">Vantage</span>
            <span className="ml-1 text-xs font-medium text-muted-foreground">360</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
