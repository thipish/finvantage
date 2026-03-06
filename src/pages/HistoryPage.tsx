import { History } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const HistoryPage = () => {
  const { user, assessments } = useApp();

  const userAssessments = assessments.filter(
    (a) => a.userEmail === user?.email
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Assessment History</h1>
        <p className="mt-1 text-muted-foreground">Review your past credit risk assessments</p>
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-primary" /> Your Assessments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/30 border-border">
                <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                <TableHead className="text-muted-foreground font-semibold">CIBIL</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Requested Amount</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userAssessments.map((a) => (
                <TableRow key={a.id} className="border-border hover:bg-accent/20">
                  <TableCell className="text-muted-foreground font-mono text-sm">{a.date}</TableCell>
                  <TableCell className="text-foreground font-semibold">{a.cibilScore}</TableCell>
                  <TableCell className="text-neon font-mono">{formatCurrency(a.requestedAmount)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      a.status === "Approved"
                        ? "bg-success/15 text-success border border-success/30"
                        : "bg-danger/15 text-danger border border-danger/30"
                    }`}>
                      {a.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {userAssessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    No assessments yet. Complete a risk assessment to see your history here.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;
