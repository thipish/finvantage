import { useEffect, useState } from "react";
import { History, TrendingUp, TrendingDown, AlertTriangle, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { fetchHistory, type HistoryEntry } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColor = (label: string) => {
  switch (label) {
    case "Excellent":
      return "bg-success/10 text-success border-success/30";
    case "Good":
      return "bg-warning/10 text-warning border-warning/30";
    default:
      return "bg-danger/10 text-danger border-danger/30";
  }
};

const approvalIcon = (status: string) => {
  switch (status) {
    case "High":
      return <TrendingUp className="h-4 w-4 text-success" />;
    case "Medium":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    default:
      return <TrendingDown className="h-4 w-4 text-danger" />;
  }
};

const HistoryPage = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchHistory();
        setEntries(data);
      } catch (err) {
        console.warn("History fetch failed:", err);
        setError("Unable to load history. The backend may be offline.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center animate-fade-in-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
          <History className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Assessment History</h1>
        <p className="mt-2 text-muted-foreground">
          Review all your past credit risk assessments and reports
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start the Python backend to see your saved assessments.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && entries.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="font-heading text-lg font-semibold text-foreground">No assessments yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete a risk assessment to see your history here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      {!loading && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const input = entry.assessmentInput as Record<string, unknown>;

            return (
              <Card
                key={entry.id}
                className="border-border/50 shadow-elevated transition-all hover:shadow-lg cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                        <User className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {entry.userName}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Credit Score */}
                      <div className="text-right">
                        <p className="font-heading text-2xl font-bold text-foreground">
                          {entry.creditScore}
                        </p>
                        <p className="text-xs text-muted-foreground">/ 850</p>
                      </div>

                      {/* Status badge */}
                      <Badge
                        variant="outline"
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${statusColor(entry.statusLabel)}`}
                      >
                        {entry.statusLabel}
                      </Badge>

                      {/* Approval */}
                      <div className="flex items-center gap-1">
                        {approvalIcon(entry.approvalStatus)}
                        <span className="text-xs font-medium text-muted-foreground">
                          {entry.approvalStatus}
                        </span>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t border-border/50 pt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Key Metrics */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-foreground">Key Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Default Probability</span>
                            <span className="font-semibold text-foreground">
                              {entry.probabilityOfDefault}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CIBIL Score</span>
                            <span className="font-semibold text-foreground">
                              {String(input.cibilScore ?? "—")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Annual Income</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(Number(input.annualIncome ?? 0))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Loan Amount</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(Number(input.loanAmount ?? 0))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Loan Purpose</span>
                            <span className="font-semibold text-foreground">
                              {String(input.loanPurpose ?? "—")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-foreground">AI Insights</h4>
                        {entry.aiInsights && entry.aiInsights.length > 0 ? (
                          <ul className="space-y-2">
                            {entry.aiInsights.map((tip, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {i + 1}
                                </span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No AI insights for this assessment.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
