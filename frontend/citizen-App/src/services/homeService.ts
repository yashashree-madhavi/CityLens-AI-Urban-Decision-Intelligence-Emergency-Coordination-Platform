
import { apiRequest } from "./api";

export type HomeSummary = {
  weather: {
    temperature: number;
    apparent_temperature: number;
    humidity: number;
    rain: number;
    wind_speed: number;
    weather_code: number;
    timestamp?: string | null;
    latitude?: number;
    longitude?: number;
    source?: string;
  } | null;

  aqi: {
    us_aqi: number;
    label: string;
    pm2_5: number;
    pm10: number;
    timestamp?: string | null;
    latitude?: number;
    longitude?: number;
    source?: string;
  } | null;

  traffic: {
    congestion_level: string;
    congestion_percentage: number;
    current_speed: number;
    free_flow_speed: number;
    road_closure: boolean | null;
  } | null;

  flood_risk: {
    station_name: string;
    risk_level: string;
    risk_score: number;
    data_status: string;
    reasons: string[];
  } | null;
};

export async function getHomeSummary(
  latitude: number,
  longitude: number
): Promise<HomeSummary> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  return apiRequest<HomeSummary>(
    `/home/summary?${params.toString()}`,
    { auth: false }
  );
}
