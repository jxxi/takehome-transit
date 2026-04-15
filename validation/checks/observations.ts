import type { Route } from "../../types";
import type { ValidationIssue } from "../types";

function checkInactiveStops(route: Route, knownStopIds: Set<string>): ValidationIssue[] {
  return [...knownStopIds]
    .filter((stopId) => !route.observations.some((obs) => obs.stopId === stopId && (obs.boardings > 0 || obs.alightings > 0)))
    .map((stopId) => ({ severity: "warning" as const, kind: "inactive_stop" as const, routeId: route.id, stopId }));
}

function checkFlowImbalance(route: Route, totalBoardings: number, totalAlightings: number): ValidationIssue[] {
  const totalVolume = totalBoardings + totalAlightings;
  if (totalVolume === 0) {
    return [];
  }

  const imbalancePct = Math.abs(totalBoardings - totalAlightings) / totalVolume;
  if (imbalancePct <= 0.1) {
    return [];
  }

  return [{
    severity: "warning",
    kind: "route_flow_imbalance",
    routeId: route.id,
    totalBoardings,
    totalAlightings,
    imbalancePct: Math.round(imbalancePct * 1000) / 10,
  }];
}

export function checkObservations(route: Route, knownStopIds: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  let totalBoardings = 0;
  let totalAlightings = 0;

  if (route.observations.length === 0) {
    issues.push({ severity: "warning", kind: "no_observations", routeId: route.id });
    return issues;
  }

  for (const obs of route.observations) {
    if (!knownStopIds.has(obs.stopId)) {
      issues.push({ severity: "error", kind: "orphan_observation", routeId: route.id, stopId: obs.stopId, day: obs.day });
    }

    if (obs.boardings < 0) {
      issues.push({ severity: "error", kind: "negative_counts", routeId: route.id, stopId: obs.stopId, day: obs.day, field: "boardings", value: obs.boardings });
    }
    if (obs.alightings < 0) {
      issues.push({ severity: "error", kind: "negative_counts", routeId: route.id, stopId: obs.stopId, day: obs.day, field: "alightings", value: obs.alightings });
    }

    const key = `${obs.stopId}:${obs.day}`;
    if (seen.has(key)) {
      issues.push({ severity: "warning", kind: "duplicate_observation", routeId: route.id, stopId: obs.stopId, day: obs.day });
    }
    seen.add(key);

    totalBoardings += obs.boardings;
    totalAlightings += obs.alightings;
  }

  issues.push(...checkInactiveStops(route, knownStopIds));
  issues.push(...checkFlowImbalance(route, totalBoardings, totalAlightings));

  return issues;
}
