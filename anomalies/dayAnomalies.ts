import type { DayOfWeek, Route } from "../types";
import type {
  DayActivityPoint,
  DayAnomalyDirection,
  NoDetectionReason,
  RouteDayAnomalyReport,
} from "./types";

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DEFAULT_PERCENT_THRESHOLD = 0.4;
type DayActivityEntry = { day: DayOfWeek; totalActivity: number };

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortDayMetrics(metrics: DayActivityPoint[]): DayActivityPoint[] {
  const dayToIndex = new Map<DayOfWeek, number>(DAY_ORDER.map((day, index) => [day, index]));
  return [...metrics].sort((a, b) => (dayToIndex.get(a.day) ?? 99) - (dayToIndex.get(b.day) ?? 99));
}

function getDirection(percentDeltaFromMean: number): DayAnomalyDirection {
  return percentDeltaFromMean >= 0 ? "high" : "low";
}

function buildAnomalyMessaging(input: {
  day: DayOfWeek;
  direction: DayAnomalyDirection;
  percentDeltaFromMean: number;
  thresholdPct: number;
}): Pick<DayActivityPoint, "explanation" | "operationalNote"> {
  const dayLabel = input.day.toUpperCase();
  const deltaPct = Math.round(Math.abs(input.percentDeltaFromMean) * 100);
  const thresholdPct = Math.round(input.thresholdPct * 100);

  if (input.direction === "high") {
    return {
      explanation: `${dayLabel} activity is ${deltaPct}% above this route's typical day (threshold ${thresholdPct}%).`,
      operationalNote:
        "Expect higher crowding and dwell times; consider peak reinforcement or standby capacity if this pattern repeats.",
    };
  }

  return {
    explanation: `${dayLabel} activity is ${deltaPct}% below this route's typical day (threshold ${thresholdPct}%).`,
    operationalNote:
      "Check for disruptions, holidays, or demand shifts; consider temporary frequency adjustments if this pattern repeats.",
  };
}

function hasZeroVariance(values: number[]): boolean {
  if (values.length < 2) {
    return true;
  }
  return values.every((value) => value === values[0]);
}

function toNoAnomalyDayMetrics(entries: DayActivityEntry[]): DayActivityPoint[] {
  return sortDayMetrics(
    entries.map((entry) => ({
      day: entry.day,
      totalActivity: entry.totalActivity,
      percentDeltaFromMean: 0,
      isAnomaly: false,
    }))
  );
}

function buildNoDetectionReport(input: {
  route: Route;
  thresholdPct: number;
  meanActivity: number;
  reason: NoDetectionReason;
  entries: DayActivityEntry[];
}): RouteDayAnomalyReport {
  return {
    routeId: input.route.id,
    routeName: input.route.name,
    thresholdPct: input.thresholdPct,
    meanActivity: round(input.meanActivity),
    reasonNoDetection: input.reason,
    dayMetrics: toNoAnomalyDayMetrics(input.entries),
    anomalies: [],
  };
}

export function detectDayAnomalies(
  routes: readonly Route[],
  percentThreshold = DEFAULT_PERCENT_THRESHOLD
): RouteDayAnomalyReport[] {
  return routes.map((route) => {
    const dayToTotalActivity = new Map<DayOfWeek, number>();

    for (const obs of route.observations) {
      const totalActivity = obs.boardings + obs.alightings;
      dayToTotalActivity.set(obs.day, (dayToTotalActivity.get(obs.day) ?? 0) + totalActivity);
    }

    const entries: DayActivityEntry[] = [...dayToTotalActivity.entries()].map(([day, totalActivity]) => ({
      day,
      totalActivity,
    }));
    const totals = entries.map((entry) => entry.totalActivity);
    const meanActivity = mean(totals);

    if (entries.length < 2) {
      return buildNoDetectionReport({
        route,
        thresholdPct: percentThreshold,
        meanActivity,
        reason: "insufficient-days",
        entries,
      });
    }

    if (hasZeroVariance(totals) || meanActivity === 0) {
      return buildNoDetectionReport({
        route,
        thresholdPct: percentThreshold,
        meanActivity,
        reason: "zero-variance",
        entries,
      });
    }

    const dayMetrics = sortDayMetrics(
      entries.map((entry) => {
        const rawPercentDelta = (entry.totalActivity - meanActivity) / meanActivity;
        const percentDeltaFromMean = round(rawPercentDelta);
        const isAnomaly = Math.abs(rawPercentDelta) >= percentThreshold;
        const direction = isAnomaly ? getDirection(rawPercentDelta) : undefined;
        const messaging =
          isAnomaly && direction
            ? buildAnomalyMessaging({
                day: entry.day,
                direction,
                percentDeltaFromMean: rawPercentDelta,
                thresholdPct: percentThreshold,
              })
            : {};

        return {
          day: entry.day,
          totalActivity: entry.totalActivity,
          percentDeltaFromMean,
          isAnomaly,
          direction,
          ...messaging,
        };
      })
    );

    const anomalies = dayMetrics.filter((metric) => metric.isAnomaly);

    return {
      routeId: route.id,
      routeName: route.name,
      thresholdPct: percentThreshold,
      meanActivity: round(meanActivity),
      dayMetrics,
      anomalies,
    };
  });
}
