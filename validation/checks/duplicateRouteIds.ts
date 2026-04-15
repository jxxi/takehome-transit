import type { Route } from "../../types";
import type { ValidationIssue } from "../types";

export function checkDuplicateRouteIds(feed: Route[]): ValidationIssue[] {
  const seen = new Set<string>();

  return feed.flatMap((route) => {
    const issue = seen.has(route.id)
      ? [{ severity: "error" as const, kind: "duplicate_route_id" as const, routeId: route.id }]
      : [];
    seen.add(route.id);
    return issue;
  });
}
