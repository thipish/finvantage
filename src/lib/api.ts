/**
 * FinVantage API Client
 * Sends profile data to the Python FastAPI backend for ML prediction.
 * Falls back to the local credit engine if the backend is unavailable.
 */

import type { ProfileInput, CreditResult } from "./creditEngine";
import { calculateCreditScore } from "./creditEngine";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY || "";

export interface MLPredictionResult extends CreditResult {
  aiInsights: string[];
  predictionId: number;
}

/**
 * Call the Python ML backend. Falls back to local engine on failure.
 */
export async function predictCreditRisk(
  profile: ProfileInput
): Promise<MLPredictionResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
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

    // Fallback to client-side logistic regression
    const local = calculateCreditScore(profile);
    return {
      ...local,
      aiInsights: [],
      predictionId: 0,
    };
  }
}
