import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AppSidebar } from "@/components/AppSidebar";
import LandingPage from "./pages/LandingPage";
import ExpenseTrackerPage from "./pages/ExpenseTrackerPage";
import AssessmentPage from "./pages/AssessmentPage";
import ReportPage from "./pages/ReportPage";
import WealthToolsPage from "./pages/WealthToolsPage";
import HistoryPage from "./pages/HistoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import { Menu } from "lucide-react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useApp();

  if (!user) return <LoginPage />;

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center border-b border-border bg-card/50 backdrop-blur-xl px-4 sticky top-0 z-50">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
                  {user.role === "admin" ? "⚡ ADMIN" : "USER"}
                </span>
                <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>
            <main className="flex-1 p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/expenses" element={<ExpenseTrackerPage />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/wealth-tools" element={<WealthToolsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
