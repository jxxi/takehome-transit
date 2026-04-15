import type { Route } from "../../types";
import type { ValidationIssue } from "../types";

export function checkStops(route: Route): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const coordsSeen = new Map<string, string>();

  if (route.stops.length === 0) {
    issues.push({ severity: "warning", kind: "no_stops", routeId: route.id });
  }

  for (const stop of route.stops) {
    if (seen.has(stop.id)) {
      issues.push({ severity: "warning", kind: "duplicate_stop_id", routeId: route.id, stopId: stop.id });
    }
    seen.add(stop.id);

    const coordKey = `${stop.lat},${stop.lon}`;
    const existing = coordsSeen.get(coordKey);
    if (existing && existing !== stop.id) {
      issues.push({
        severity: "warning",
        kind: "duplicate_stop_coordinates",
        routeId: route.id,
        stopIds: [existing, stop.id],
        lat: stop.lat,
        lon: stop.lon,
      });
    } else {
      coordsSeen.set(coordKey, stop.id);
    }

    if (stop.lat < -90 || stop.lat > 90 || stop.lon < -180 || stop.lon > 180) {
      issues.push({
        severity: "error",
        kind: "invalid_coordinates",
        routeId: route.id,
        stopId: stop.id,
        lat: stop.lat,
        lon: stop.lon,
      });
    }
  }

  return issues;
}
