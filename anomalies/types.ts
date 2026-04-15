import type { DayOfWeek } from "../types";

export type DayAnomalyDirection = "high" | "low";
export type NoDetectionReason = "insufficient-days" | "zero-variance";

export type DayActivityPoint = {
  day: DayOfWeek;
  totalActivity: number;
  percentDeltaFromMean: number;
  isAnomaly: boolean;
  direction?: DayAnomalyDirection;
};

export type RouteDayAnomalyReport = {
  routeId: string;
  routeName: string;
  thresholdPct: number;
  meanActivity: number;
  reasonNoDetection?: NoDetectionReason;
  dayMetrics: DayActivityPoint[];
  anomalies: DayActivityPoint[];
};
