import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

const LoginPage = ({ onLogin, onRegister }: LoginPageProps) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignup && !name.trim()) {
      setError("Name is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      if (isSignup) {
        await onRegister(name, email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Fin<span className="text-primary">Vantage</span> 360
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Financial analytics at your fingertips</p>
        </div>

        <Card className="border-border/50 shadow-elevated backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-heading text-xl">
              {isSignup ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSignup ? "Sign up to get started" : "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    maxLength={100}
                    className="rounded-xl"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="rounded-xl"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl gradient-primary text-primary-foreground shadow-glow"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSignup ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsSignup(!isSignup); setError(""); }}
                className="font-medium text-primary hover:underline"
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
