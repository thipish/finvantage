import { useEffect, useState } from "react";
import { History, TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";
import { fetchHistory, type HistoryEntry } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const ReportSummary = ({ entry }: { entry: HistoryEntry }) => {
  const input = entry.assessmentInput as Record<string, unknown>;
  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-heading text-lg font-bold text-foreground">{entry.creditScore}</span>
        <span className="text-muted-foreground">/ 850</span>
        <Badge variant="outline" className={`ml-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusColor(entry.statusLabel)}`}>
          {entry.statusLabel}
        </Badge>
        <span className="flex items-center gap-1 text-muted-foreground">
          {approvalIcon(entry.approvalStatus)}
          {entry.approvalStatus}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-muted-foreground">
        <span>Default: <strong className="text-foreground">{entry.probabilityOfDefault}%</strong></span>
        <span>CIBIL: <strong className="text-foreground">{String(input.cibilScore ?? "—")}</strong></span>
        <span>Income: <strong className="text-foreground">{formatCurrency(Number(input.annualIncome ?? 0))}</strong></span>
        <span>Loan: <strong className="text-foreground">{formatCurrency(Number(input.loanAmount ?? 0))}</strong></span>
        <span>Purpose: <strong className="text-foreground">{String(input.loanPurpose ?? "—")}</strong></span>
      </div>
      {entry.aiInsights && entry.aiInsights.length > 0 && (
        <p className="text-muted-foreground italic truncate max-w-md" title={entry.aiInsights[0]}>
          💡 {entry.aiInsights[0]}
        </p>
      )}
    </div>
  );
};

const HistoryPage = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
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

      {/* History Table */}
      {!loading && entries.length > 0 && (
        <Card className="border-border/50 shadow-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">User Name</TableHead>
                <TableHead className="font-semibold">Date Taken</TableHead>
                <TableHead className="font-semibold">Report Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell className="font-medium text-foreground whitespace-nowrap align-top pt-4">
                    {entry.userName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground align-top pt-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ReportSummary entry={entry} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default HistoryPage;
