import { Platform } from "react-native";
import Constants from "expo-constants";
import { getToken, removeToken } from "../utils/tokenStorage";

/**
 * Where is the backend?
 *
 * 1. If EXPO_PUBLIC_API_URL is set (see .env.example) -> use that.
 * 2. Otherwise, in development, take the IP of the computer that is
 *    running `expo start` (the phone and computer must be on the same
 *    Wi-Fi) and use port 8000.
 * 3. Fallbacks for emulators.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:8000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  return "http://127.0.0.1:8000";
}

export const API_BASE_URL = resolveBaseUrl();

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  /** Send as application/x-www-form-urlencoded (needed for /auth/login). */
  form?: Record<string, string>;
  /** Pass false for public endpoints. Default: attach saved token. */
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** FastAPI sends errors as { detail: "text" } or { detail: [ {msg} ] }. */
function extractErrorMessage(errorData: any): string {
  const detail = errorData?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item: any) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  return errorData?.message || "Something went wrong.";
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, form, auth = true } = options;

  const headers: Record<string, string> = {};
  let requestBody: any;

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    // Do not set Content-Type so fetch sets multipart/form-data with boundary
    requestBody = body;
  } else if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    requestBody = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (auth) {
    const token = await getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: requestBody,
    });
  } catch {
    throw new ApiError(
      `Unable to connect to the server (${API_BASE_URL}). ` +
        "Check that the backend is running and your phone is on the same Wi-Fi.",
      0
    );
  }

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      message = extractErrorMessage(await response.json());
    } catch {
      // Server did not return JSON
    }

    // Token expired / invalid -> forget it so the user logs in again
    if (response.status === 401 && auth) {
      await removeToken();
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type RainfallForecastItem = {
  location: string;
  forecast_time: string;
  precipitation_probability: number;
  precipitation_mm: number;
  rain_mm: number | null;
  weather_code: number | null;
};

export type RainfallForecastResponse = {
  location: string;
  forecast_provider: string;
  forecast_type: string;
  next_rain: RainfallForecastItem | null;
  hourly_forecasts: RainfallForecastItem[];
};

export async function getRainfallForecast(
  latitude: number,
  longitude: number,
  locationName = "Selected area"
): Promise<RainfallForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    location_name: locationName,
  });

  return apiRequest<RainfallForecastResponse>(
    `/rainfall/forecast?${params.toString()}`,
    { auth: false }
  );
}