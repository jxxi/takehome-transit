import type { DayOfWeek } from "../types";

export type TrendConfidence = "low" | "medium" | "high";

export type StopTrend =
  | { kind: "commuter-origin"; confidence: TrendConfidence }
  | { kind: "commuter-destination"; confidence: TrendConfidence }
  | { kind: "weekend-leisure"; confidence: TrendConfidence }
  | { kind: "balanced"; confidence: TrendConfidence }
  | { kind: "mixed"; confidence: TrendConfidence }
  | { kind: "insufficient-data"; reason: "fewer-than-2-days" | "no-observations" };

export type StopRidershipSummary = {
  stopId: string;
  stopName: string;
  totalBoardings: number;
  totalAlightings: number;
  netFlow: number;
  daysObserved: DayOfWeek[];
  trend: StopTrend;
};
