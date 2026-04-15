import type { DayOfWeek } from "../types";

export type ValidationIssue =
  | { severity: "error"; kind: "duplicate_route_id"; routeId: string }
  | { severity: "error"; kind: "orphan_observation"; routeId: string; stopId: string; day: DayOfWeek }
  | { severity: "error"; kind: "negative_counts"; routeId: string; stopId: string; day: DayOfWeek; field: "boardings" | "alightings"; value: number }
  | { severity: "error"; kind: "invalid_coordinates"; routeId: string; stopId: string; lat: number; lon: number }
  | { severity: "warning"; kind: "no_stops"; routeId: string }
  | { severity: "warning"; kind: "no_observations"; routeId: string }
  | { severity: "warning"; kind: "duplicate_stop_id"; routeId: string; stopId: string }
  | { severity: "warning"; kind: "duplicate_observation"; routeId: string; stopId: string; day: DayOfWeek }
  | { severity: "warning"; kind: "duplicate_stop_coordinates"; routeId: string; stopIds: [string, string]; lat: number; lon: number }
  | { severity: "warning"; kind: "inactive_stop"; routeId: string; stopId: string }
  | { severity: "warning"; kind: "route_flow_imbalance"; routeId: string; totalBoardings: number; totalAlightings: number; imbalancePct: number };

export type ValidationReport = {
  valid: boolean;
  issues: ValidationIssue[];
};
