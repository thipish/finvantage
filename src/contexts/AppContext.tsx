import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
}

export interface Assessment {
  id: string;
  userName: string;
  userEmail: string;
  date: string;
  cibilScore: number;
  requestedAmount: number;
  annualIncome: number;
  loanTerm: number;
  monthlyDebt: number;
  status: "Approved" | "Rejected";
  aiTip: string;
}

interface AppContextType {
  user: AppUser | null;
  loading: boolean;
  expenses: Expense[];
  assessments: Assessment[];
  totalExpenses: number;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  addAssessment: (assessment: Omit<Assessment, "id">) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Mock seed data for admin view
const MOCK_ASSESSMENTS: Assessment[] = [
  { id: "a1", userName: "Rahul Sharma", userEmail: "rahul@example.com", date: "2026-03-01", cibilScore: 780, requestedAmount: 500000, annualIncome: 1200000, loanTerm: 36, monthlyDebt: 15000, status: "Approved", aiTip: "Strong credit profile with healthy DTI ratio." },
  { id: "a2", userName: "Priya Patel", userEmail: "priya@example.com", date: "2026-02-28", cibilScore: 620, requestedAmount: 800000, annualIncome: 600000, loanTerm: 48, monthlyDebt: 25000, status: "Rejected", aiTip: "High DTI ratio. Consider reducing existing debt." },
  { id: "a3", userName: "Arjun Gupta", userEmail: "arjun@example.com", date: "2026-02-25", cibilScore: 740, requestedAmount: 300000, annualIncome: 900000, loanTerm: 24, monthlyDebt: 10000, status: "Approved", aiTip: "Good financial health. Eligible for premium rates." },
  { id: "a4", userName: "Sneha Reddy", userEmail: "sneha@example.com", date: "2026-02-20", cibilScore: 550, requestedAmount: 1000000, annualIncome: 500000, loanTerm: 60, monthlyDebt: 30000, status: "Rejected", aiTip: "CIBIL score below threshold. Improve credit history." },
  { id: "a5", userName: "Vikram Singh", userEmail: "vikram@example.com", date: "2026-02-15", cibilScore: 810, requestedAmount: 2000000, annualIncome: 3000000, loanTerm: 36, monthlyDebt: 40000, status: "Approved", aiTip: "Excellent profile. Top-tier loan products available." },
  { id: "a6", userName: "Admin User", userEmail: "admin@finvantage.com", date: "2026-03-05", cibilScore: 750, requestedAmount: 700000, annualIncome: 1500000, loanTerm: 36, monthlyDebt: 20000, status: "Approved", aiTip: "Balanced profile with strong income coverage." },
];

const MOCK_EXPENSES: Expense[] = [
  { id: "e1", category: "Rent", amount: 25000, date: "2026-03-01" },
  { id: "e2", category: "Groceries", amount: 8000, date: "2026-03-01" },
  { id: "e3", category: "EMI", amount: 15000, date: "2026-03-01" },
  { id: "e4", category: "Dining", amount: 5000, date: "2026-03-01" },
  { id: "e5", category: "Utilities", amount: 3000, date: "2026-03-01" },
  { id: "e6", category: "Transport", amount: 4000, date: "2026-03-01" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [assessments, setAssessments] = useState<Assessment[]>(MOCK_ASSESSMENTS);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const login = useCallback(async (email: string, _password: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const role = email.toLowerCase() === "admin@finvantage.com" ? "admin" : "user";
    const name = role === "admin" ? "Admin User" : email.split("@")[0];
    setUser({ id: Date.now(), name, email, role });
    setLoading(false);
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const role = email.toLowerCase() === "admin@finvantage.com" ? "admin" : "user";
    setUser({ id: Date.now(), name, email, role });
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [{ ...expense, id: crypto.randomUUID() }, ...prev]);
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addAssessment = useCallback((assessment: Omit<Assessment, "id">) => {
    setAssessments((prev) => [{ ...assessment, id: crypto.randomUUID() }, ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{ user, loading, expenses, assessments, totalExpenses, login, register, logout, addExpense, removeExpense, addAssessment }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
