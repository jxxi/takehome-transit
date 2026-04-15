import type { DayOfWeek, RidershipObservation, Route } from "../types";
import type { StopRidershipSummary, StopTrend, TrendConfidence } from "./types";

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAY_SET = new Set<DayOfWeek>(["mon", "tue", "wed", "thu", "fri"]);
const WEEKEND_SET = new Set<DayOfWeek>(["sat", "sun"]);
const DOMINANCE_RATIO = 1.3;

function sortDays(days: Set<DayOfWeek>): DayOfWeek[] {
  return DAY_ORDER.filter((day) => days.has(day));
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const avg = mean(values);
  const variance = values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function confidenceFromCoverage(daysObserved: number): TrendConfidence {
  if (daysObserved >= 5) {
    return "high";
  }
  if (daysObserved >= 3) {
    return "medium";
  }
  return "low";
}

function classifyTrend(observations: RidershipObservation[]): StopTrend {
  if (observations.length === 0) {
    return { kind: "insufficient-data", reason: "no-observations" };
  }

  const days = new Set<DayOfWeek>();
  const dayToVolume = new Map<DayOfWeek, number>();
  let totalBoardings = 0;
  let totalAlightings = 0;
  let totalActivity = 0;
  let weekendActivity = 0;
  let weekdayActivity = 0;

  for (const obs of observations) {
    days.add(obs.day);
    totalBoardings += obs.boardings;
    totalAlightings += obs.alightings;
    const activity = obs.boardings + obs.alightings;
    totalActivity += activity;

    dayToVolume.set(obs.day, (dayToVolume.get(obs.day) ?? 0) + activity);

    if (WEEKEND_SET.has(obs.day)) {
      weekendActivity += activity;
    }
    if (WEEKDAY_SET.has(obs.day)) {
      weekdayActivity += activity;
    }
  }

  if (days.size < 2) {
    return { kind: "insufficient-data", reason: "fewer-than-2-days" };
  }

  const volumes = [...dayToVolume.values()];
  const avg = mean(volumes);
  const cv = avg === 0 ? 0 : stdDev(volumes) / avg;

  const netFlow = totalBoardings - totalAlightings;
  const netShare = totalActivity === 0 ? 0 : Math.abs(netFlow) / totalActivity;
  const weekendShare = totalActivity === 0 ? 0 : weekendActivity / totalActivity;
  const weekdayShare = totalActivity === 0 ? 0 : weekdayActivity / totalActivity;

  const confidence = confidenceFromCoverage(days.size);
  const isWeekendDominant =
    weekendShare > 0 && weekendShare >= weekdayShare * DOMINANCE_RATIO;
  const isWeekdayDominant =
    weekdayShare > 0 && weekdayShare >= weekendShare * DOMINANCE_RATIO;
  const hasStrongDirectionalFlow = netShare >= 0.25;

  if (isWeekendDominant) {
    return { kind: "weekend-leisure", confidence };
  }

  if (isWeekdayDominant && hasStrongDirectionalFlow && netFlow > 0) {
    return { kind: "commuter-origin", confidence };
  }

  if (isWeekdayDominant && hasStrongDirectionalFlow && netFlow < 0) {
    return { kind: "commuter-destination", confidence };
  }

  if (netShare <= 0.1 && cv <= 0.35) {
    return { kind: "balanced", confidence };
  }

  return { kind: "mixed", confidence };
}

export function summarizeRouteStops(route: Route): StopRidershipSummary[] {
  return route.stops.map((stop) => {
    const observations = route.observations.filter((obs) => obs.stopId === stop.id);
    const totalBoardings = observations.reduce((sum, obs) => sum + obs.boardings, 0);
    const totalAlightings = observations.reduce((sum, obs) => sum + obs.alightings, 0);
    const daysObserved = sortDays(new Set(observations.map((obs) => obs.day)));

    return {
      stopId: stop.id,
      stopName: stop.name,
      totalBoardings,
      totalAlightings,
      netFlow: totalBoardings - totalAlightings,
      daysObserved,
      trend: classifyTrend(observations),
    };
  });
}
