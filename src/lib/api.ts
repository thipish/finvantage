/**
 * FinVantage API Client
 * Handles auth, ML predictions, and history via the Python FastAPI backend.
 * Falls back to the local credit engine if the backend is unavailable.
 */

import type { ProfileInput, CreditResult } from "./creditEngine";
import { calculateCreditScore } from "./creditEngine";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY || "";

function getAuthToken(): string | null {
  try {
    const raw = sessionStorage.getItem("finvantage_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session.token ?? null;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Auth API ───────────────────────────────────────────────────────
export interface AuthResult {
  token: string;
  user: { id: number; name: string; email: string };
}

export async function apiRegister(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ fullName, email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }

  return res.json();
}

export async function apiLogin(
  email: string,
  password: string
): Promise<AuthResult> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Invalid email or password");
  }

  return res.json();
}

// ─── ML Prediction ──────────────────────────────────────────────────
export interface MLPredictionResult extends CreditResult {
  aiInsights: string[];
  predictionId: number;
}

export async function predictCreditRisk(
  profile: ProfileInput
): Promise<MLPredictionResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();

    return {
      score: data.score,
      maxScore: data.maxScore,
      probabilityOfDefault: data.probabilityOfDefault,
      status: data.status,
      approvalProbability: data.approvalProbability,
      healthMetrics: data.healthMetrics,
      breakdown: data.breakdown,
      profile,
      aiInsights: data.aiInsights ?? [],
      predictionId: data.predictionId ?? 0,
    };
  } catch (err) {
    console.warn("ML backend unavailable, using local engine:", err);

    const local = calculateCreditScore(profile);
    return {
      ...local,
      aiInsights: [],
      predictionId: 0,
    };
  }
}

// ─── History ────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: number;
  userName: string;
  creditScore: number;
  probabilityOfDefault: number;
  approvalStatus: string;
  statusLabel: string;
  healthMetrics: Record<string, unknown>;
  breakdown: Array<{ category: string; points: number; maxPoints: number }>;
  aiInsights: string[];
  assessmentInput: Record<string, unknown>;
  predictionId: number;
  createdAt: string;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/api/history`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`History API error: ${res.status}`);
  }

  return res.json();
}
