import { summarizeRouteStops } from "../summaries";
import type { Route } from "../types";
import type { RouteHealthBreakdown, RouteHealthReport } from "./types";

const STABILITY_WEIGHT = 40;
const UTILIZATION_WEIGHT = 30;
const BALANCE_WEIGHT = 20;
const COVERAGE_WEIGHT = 10;
const IMBALANCE_SHARE_THRESHOLD = 0.6;
const LOW_ACTIVITY_MIN_FLOOR = 30;
const LOW_ACTIVITY_PERCENTILE = 0.2;

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * clamp(p, 0, 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower] ?? 0;
  }
  const weight = index - lower;
  const low = sorted[lower] ?? 0;
  const high = sorted[upper] ?? 0;
  return low + (high - low) * weight;
}

function buildReasons(breakdown: RouteHealthBreakdown): string[] {
  const reasons: Array<{ label: string; value: number }> = [
    { label: "High stop-level volatility", value: breakdown.mixedStopRate },
    { label: "Many low-activity stops", value: breakdown.lowActivityStopRate },
    { label: "Frequent stop flow imbalance", value: breakdown.imbalanceStopRate },
    { label: "Insufficient stop coverage", value: breakdown.insufficientDataStopRate },
  ];

  return reasons
    .filter((reason) => reason.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((reason) => reason.label);
}

function buildBreakdown(route: Route, lowActivityThreshold: number): RouteHealthBreakdown {
  const summaries = summarizeRouteStops(route);
  const stopCount = Math.max(1, summaries.length);

  let mixedCount = 0;
  let lowActivityCount = 0;
  let imbalanceCount = 0;
  let insufficientDataCount = 0;

  for (const stop of summaries) {
    const activity = stop.totalBoardings + stop.totalAlightings;
    const netShare = activity === 0 ? 0 : Math.abs(stop.netFlow) / activity;

    if (stop.trend.kind === "mixed") {
      mixedCount += 1;
    }
    if (activity < lowActivityThreshold) {
      lowActivityCount += 1;
    }
    if (activity > 0 && netShare > IMBALANCE_SHARE_THRESHOLD) {
      imbalanceCount += 1;
    }
    if (stop.trend.kind === "insufficient-data") {
      insufficientDataCount += 1;
    }
  }

  const mixedStopRate = mixedCount / stopCount;
  const lowActivityStopRate = lowActivityCount / stopCount;
  const imbalanceStopRate = imbalanceCount / stopCount;
  const insufficientDataStopRate = insufficientDataCount / stopCount;

  const stabilityPenalty = mixedStopRate * STABILITY_WEIGHT;
  const utilizationPenalty = lowActivityStopRate * UTILIZATION_WEIGHT;
  const balancePenalty = imbalanceStopRate * BALANCE_WEIGHT;
  const coveragePenalty = insufficientDataStopRate * COVERAGE_WEIGHT;

  return {
    stopCount,
    lowActivityThreshold,
    mixedStopRate: round(mixedStopRate),
    lowActivityStopRate: round(lowActivityStopRate),
    imbalanceStopRate: round(imbalanceStopRate),
    insufficientDataStopRate: round(insufficientDataStopRate),
    stabilityPenalty: round(stabilityPenalty),
    utilizationPenalty: round(utilizationPenalty),
    balancePenalty: round(balancePenalty),
    coveragePenalty: round(coveragePenalty),
  };
}

export function rankRoutesByHealth(routes: Route[]): RouteHealthReport[] {
  if (routes.length === 0) {
    return [];
  }

  const activities = routes.flatMap((route) =>
    summarizeRouteStops(route).map((stop) => stop.totalBoardings + stop.totalAlightings)
  );

  const lowActivityThreshold = Math.max(
    LOW_ACTIVITY_MIN_FLOOR,
    percentile(activities, LOW_ACTIVITY_PERCENTILE)
  );

  const scored = routes.map((route) => {
    const breakdown = buildBreakdown(route, lowActivityThreshold);
    const penaltyTotal =
      breakdown.stabilityPenalty +
      breakdown.utilizationPenalty +
      breakdown.balancePenalty +
      breakdown.coveragePenalty;
    const score = round(clamp(100 - penaltyTotal, 0, 100), 1);

    return {
      routeId: route.id,
      routeName: route.name,
      score,
      rank: 0,
      reasons: buildReasons(breakdown),
      breakdown,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.routeName.localeCompare(b.routeName);
  });

  return scored.map((report, index) => ({
    ...report,
    rank: index + 1,
  }));
}
