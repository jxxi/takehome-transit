export type RouteHealthBreakdown = {
  stopCount: number;
  lowActivityThreshold: number;
  mixedStopRate: number;
  lowActivityStopRate: number;
  imbalanceStopRate: number;
  insufficientDataStopRate: number;
  stabilityPenalty: number;
  utilizationPenalty: number;
  balancePenalty: number;
  coveragePenalty: number;
};

export type RouteHealthReport = {
  routeId: string;
  routeName: string;
  score: number;
  rank: number;
  reasons: string[];
  breakdown: RouteHealthBreakdown;
};
