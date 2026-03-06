import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Users, Activity, TrendingUp, Wallet, Search, ShieldCheck } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock forecasting data (mountain range style)
const forecastData = Array.from({ length: 24 }, (_, i) => {
  const month = new Date(2025, i).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  const base = Math.sin(i * 0.4) * 20 + 50;
  return {
    month,
    lowRisk: Math.round(base + Math.random() * 15 + 30),
    highRisk: Math.round(100 - base + Math.random() * 10 + 10),
  };
});

const AdminDashboard = () => {
  const { user, assessments, totalExpenses } = useApp();
  const [search, setSearch] = useState("");

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const totalUsers = new Set(assessments.map((a) => a.userEmail)).size;
  const approvedCount = assessments.filter((a) => a.status === "Approved").length;
  const approvalRate = assessments.length ? Math.round((approvedCount / assessments.length) * 100) : 0;

  const metrics = [
    { label: "Total Platform Users", value: totalUsers.toString(), icon: Users, color: "text-info" },
    { label: "Total Assessments", value: assessments.length.toString(), icon: Activity, color: "text-primary" },
    { label: "Approval Rate", value: `${approvalRate}%`, icon: TrendingUp, color: "text-success" },
    { label: "Total Expenses Tracked", value: formatCurrency(totalExpenses), icon: Wallet, color: "text-warning" },
  ];

  const filtered = useMemo(
    () => assessments.filter((a) => a.userEmail.toLowerCase().includes(search.toLowerCase())),
    [assessments, search]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> Admin Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">Platform-wide analytics and management</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Risk Forecasting Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Platform Risk Forecasting</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lowRiskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="highRiskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
              <XAxis dataKey="month" stroke="hsl(0 0% 45%)" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(0 0% 45%)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0 0% 12%)",
                  border: "1px solid hsl(0 0% 20%)",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#fff",
                }}
              />
              <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v === "lowRisk" ? "Low Risk" : "High Risk"}</span>} />
              <Area type="monotone" dataKey="lowRisk" stroke="#4ade80" fill="url(#lowRiskGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="highRisk" stroke="#6b7280" fill="url(#highRiskGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Global Ledger */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">Global Assessment Ledger</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by email..."
              className="pl-10 bg-input/50 border-border rounded-xl h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/30 border-border">
                <TableHead className="text-muted-foreground font-semibold">User Name</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Email</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                <TableHead className="text-muted-foreground font-semibold">CIBIL</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Requested</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className="border-border hover:bg-accent/20">
                  <TableCell className="font-medium text-foreground">{a.userName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{a.userEmail}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{a.date}</TableCell>
                  <TableCell className="text-foreground font-semibold">{a.cibilScore}</TableCell>
                  <TableCell className="text-neon font-mono">{formatCurrency(a.requestedAmount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full text-xs font-semibold ${
                      a.status === "Approved"
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-danger/15 text-danger border-danger/30"
                    }`}>
                      {a.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No assessments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
