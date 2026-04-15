import type { Route } from "../types";
import { checkDuplicateRouteIds } from "./checks/duplicateRouteIds";
import { checkObservations } from "./checks/observations";
import { checkStops } from "./checks/stops";
import type { ValidationIssue, ValidationReport } from "./types";

export type { ValidationIssue, ValidationReport } from "./types";

export function validateFeed(feed: Route[]): ValidationReport {
  const issues: ValidationIssue[] = [
    ...checkDuplicateRouteIds(feed),
    ...feed.flatMap((route) => {
      const knownStopIds = new Set(route.stops.map((stop) => stop.id));
      return [...checkStops(route), ...checkObservations(route, knownStopIds)];
    }),
  ];

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}
