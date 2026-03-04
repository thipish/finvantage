import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import AssessmentPage from "./pages/AssessmentPage";
import ReportPage from "./pages/ReportPage";
import WealthToolsPage from "./pages/WealthToolsPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading, login, register, logout } = useAuth();

  if (loading) return null;

  if (!user) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={logout} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/wealth-tools" element={<WealthToolsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
