import { useState } from "react";
import { LayoutDashboard, Loader2, Lock, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

const LoginPage = () => {
  const { login, register } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignup && !name.trim()) { setError("Name is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setError("");
    setSubmitting(true);
    try {
      if (isSignup) await register(name, email, password);
      else await login(email, password);
    } catch {
      setError("Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-overlay px-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <LayoutDashboard className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground">
            Fin<span className="text-neon">Vantage</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Command Center for Financial Intelligence</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8">
          <h2 className="font-heading text-xl font-bold text-foreground text-center mb-1">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            {isSignup ? "Join the platform" : "Sign in to continue"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="pl-10 bg-input/50 border-border rounded-xl h-11" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="pl-10 bg-input/50 border-border rounded-xl h-11" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="pl-10 bg-input/50 border-border rounded-xl h-11" required />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full rounded-xl gradient-primary text-primary-foreground shadow-glow h-11 font-semibold">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => { setIsSignup(!isSignup); setError(""); }} className="font-medium text-primary hover:underline">
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-accent/50 border border-border/50 p-3">
            <p className="text-[11px] text-muted-foreground text-center">
              <span className="text-primary font-semibold">Admin Access:</span> Use <code className="text-foreground font-mono text-[11px]">admin@finvantage.com</code> for admin role
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
