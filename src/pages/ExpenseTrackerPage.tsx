import { useState } from "react";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CATEGORIES = ["Rent", "Groceries", "EMI", "Dining", "Utilities", "Transport", "Entertainment", "Medical", "Other"];
const COLORS = ["#4ade80", "#60a5fa", "#f59e0b", "#f87171", "#a78bfa", "#34d399", "#fb923c", "#e879f9", "#94a3b8"];

const ExpenseTrackerPage = () => {
  const { expenses, totalExpenses, addExpense, removeExpense } = useApp();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    addExpense({ category, amount: val, date: new Date().toISOString().slice(0, 10) });
    setAmount("");
  };

  // Aggregate for donut
  const aggregated = CATEGORIES.map((cat) => ({
    name: cat,
    value: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Expense Tracker</h1>
        <p className="mt-1 text-muted-foreground">Log and manage your monthly expenses</p>
      </div>

      {/* Total + Add Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-primary" /> Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-bold text-neon">{formatCurrency(totalExpenses)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Auto-synced to Risk Calculator as Monthly Debt</p>

            <div className="mt-6 flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="bg-input/50 border-border rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button onClick={handleAdd} className="rounded-xl gradient-primary text-primary-foreground shadow-glow">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregated.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={aggregated}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {aggregated.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: "12px", fontSize: "13px", color: "#fff" }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                No expenses logged yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card className="border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/30 border-border">
              <TableHead className="text-muted-foreground font-semibold">Category</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Amount</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
              <TableHead className="text-muted-foreground font-semibold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id} className="border-border hover:bg-accent/20">
                <TableCell className="font-medium text-foreground">{e.category}</TableCell>
                <TableCell className="text-neon font-mono">{formatCurrency(e.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{e.date}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeExpense(e.id)} className="h-7 w-7 text-muted-foreground hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No expenses yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ExpenseTrackerPage;
