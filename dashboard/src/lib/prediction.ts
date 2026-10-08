import type { Reading } from '../types';

export interface PredictionResult {
  /** Current clarity % (latest reading) */
  current: number;
  /** Linear regression slope, % per second (negative = declining) */
  slope: number;
  /** Predicted seconds until clarity hits threshold. null if not predicted within window */
  etaSeconds: number | null;
  /** Confidence 0-1 based on R² of the fit */
  confidence: number;
  /** Number of samples used */
  samples: number;
}

/**
 * Simple linear regression: y = a + b*x
 * Returns { slope: b, intercept: a, r2 } where r2 is the coefficient of determination.
 */
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 3) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  const denom = sumXX - n * meanX * meanX;
  if (denom === 0) return { slope: 0, intercept: meanY, r2: 0 };

  const slope = (sumXY - n * meanX * meanY) / denom;
  const intercept = meanY - slope * meanX;

  // R² calculation
  const ssTot = sumYY - n * meanY * meanY;
  const ssRes = points.reduce((acc, p) => {
    const pred = intercept + slope * p.x;
    return acc + Math.pow(p.y - pred, 2);
  }, 0);
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

/**
 * Predict when clarity will drop below the threshold.
 *
 * @param readings     Recent readings (oldest → newest). Needs at least 10.
 * @param threshold    Algae detection threshold (%)
 * @param horizonSec   Max prediction window in seconds (e.g., 900 = 15 min)
 */
export function predictBloom(
  readings: Reading[],
  threshold: number,
  horizonSec: number
): PredictionResult {
  const emptyResult: PredictionResult = {
    current: 0,
    slope: 0,
    etaSeconds: null,
    confidence: 0,
    samples: 0,
  };

  if (readings.length < 10) return emptyResult;

  // Use the most recent 60 readings (~1 minute)
  const recent = readings.slice(-60);

  // Convert to regression points
  // x = seconds since first sample, y = clarity
  const t0 = new Date(recent[0].created_at).getTime();
  const points = recent.map((r) => ({
    x: (new Date(r.created_at).getTime() - t0) / 1000,
    y: r.light_transmission,
  }));

  const current = points[points.length - 1].y;
  const { slope, intercept, r2 } = linearRegression(points);

  // If slope is flat or positive, no bloom is approaching
  if (slope >= -0.001) {
    return {
      current,
      slope,
      etaSeconds: null,
      confidence: r2,
      samples: points.length,
    };
  }

  // Solve: intercept + slope * t = threshold
  // t = (threshold - intercept) / slope
  const currentTimeSec = points[points.length - 1].x;
  const thresholdTimeSec = (threshold - intercept) / slope;
  const etaSeconds = thresholdTimeSec - currentTimeSec;

  // Not within window, or in the past
  if (etaSeconds < 0 || etaSeconds > horizonSec) {
    return {
      current,
      slope,
      etaSeconds: null,
      confidence: r2,
      samples: points.length,
    };
  }

  return {
    current,
    slope,
    etaSeconds,
    confidence: r2,
    samples: points.length,
  };
}

export function formatEta(seconds: number): string {
  if (seconds < 60) return `~${Math.round(seconds)} sec`;
  const minutes = seconds / 60;
  if (minutes < 1.5) return `~1 min`;
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `~${hours.toFixed(1)} h`;
}