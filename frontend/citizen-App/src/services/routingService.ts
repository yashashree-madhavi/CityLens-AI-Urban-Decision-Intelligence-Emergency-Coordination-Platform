import { apiRequest } from "./api";

export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export type AnalyzedRoute = {
  route_id: number;
  distance_km: number;
  travel_time_minutes: number;
  traffic_delay_minutes: number;
  traffic: {
    congestion_level: string;
    congestion_percentage: number;
    road_closure: boolean | null;
  };
  route_intelligence: {
    overall_status?: string;
    risk_flags?: string[];
    [key: string]: unknown;
  };
  route_geometry: RoutePoint[];
  [key: string]: unknown;
};

export type RouteAnalysis = {
  origin: RoutePoint;
  destination: RoutePoint;
  recommended_route_id: number | null;
  recommendation: {
    route_id: number;
    reason?: string;
    summary?: string;
    [key: string]: unknown;
  } | null;
  routes: AnalyzedRoute[];
  [key: string]: unknown;
};

/** Calls the backend's AI route analysis (traffic + flood + incidents). */
export async function analyzeRoute(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<RouteAnalysis> {
  const query =
    `origin_latitude=${origin.latitude}` +
    `&origin_longitude=${origin.longitude}` +
    `&destination_latitude=${destination.latitude}` +
    `&destination_longitude=${destination.longitude}`;

  return apiRequest<RouteAnalysis>(`/routing/analyze?${query}`, {
    auth: false,
  });
}
