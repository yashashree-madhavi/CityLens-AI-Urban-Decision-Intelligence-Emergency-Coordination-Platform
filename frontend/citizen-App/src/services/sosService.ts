import { apiRequest } from "./api";

export type BackendEmergency = {
  id: number;
  user_id: number;
  emergency_type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: "active" | "dispatched" | "resolved";
  created_at?: string | null;
};

export type SOSStatusLabel =
  | "SOS Sent"
  | "Received"
  | "Dispatched"
  | "Resolved";

export type SOSRecord = {
  id: string;
  type: string;
  description?: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  status: SOSStatusLabel;
};

export type ResourceRecommendation = {
  priority: string;
  recommended_resources: string[];
  reasons: string[];
};

const STATUS_LABELS: Record<BackendEmergency["status"], SOSStatusLabel> = {
  active: "Received",
  dispatched: "Dispatched",
  resolved: "Resolved",
};

export function toSOSRecord(item: BackendEmergency): SOSRecord {
  const created = item.created_at
    ? new Date(
        /[zZ]|[+-]\d\d:\d\d$/.test(item.created_at)
          ? item.created_at
          : `${item.created_at}Z`
      ).toISOString()
    : new Date().toISOString();

  return {
    id: String(item.id),
    type: item.emergency_type,
    description: item.description ?? undefined,
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: created,
    status: STATUS_LABELS[item.status] ?? "Received",
  };
}

export type SOSRequest = {
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
};

export async function sendSOS(
  data: SOSRequest
): Promise<{
  record: SOSRecord;
  recommendation: ResourceRecommendation;
}> {
  const response = await apiRequest<{
    emergency: BackendEmergency;
    resource_recommendation: ResourceRecommendation;
  }>("/emergencies", {
    method: "POST",
    body: {
      emergency_type: data.type,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  return {
    record: toSOSRecord(response.emergency),
    recommendation: response.resource_recommendation,
  };
}

export async function getMySOS(): Promise<SOSRecord[]> {
  const items = await apiRequest<BackendEmergency[]>("/emergencies/my");
  return items.map(toSOSRecord);
}
