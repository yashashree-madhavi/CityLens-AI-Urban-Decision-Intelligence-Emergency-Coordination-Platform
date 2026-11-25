import { apiRequest, API_BASE_URL } from "./api";

/** Exactly what the backend sends (see backend/app/schemas/incident_report.py) */
export type BackendIncident = {
  id: number;
  user_id: number;
  incident_type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: "reported" | "verified" | "investigating" | "resolved" | "rejected";
  ai_classification?: string | null;
  ai_suspicion_score?: number | null;
  ai_reason?: string | null;
  evidence_image_path?: string | null;
  verification_status?: string | null;
  verification_reason?: string | null;
  created_at?: string | null;
};

export type ReportStatusLabel =
  | "Submitted"
  | "Verified"
  | "Under Review"
  | "Assigned"
  | "Action in Progress"
  | "Resolved"
  | "Rejected";

/** What the screens show */
export type Report = {
  id: string;
  type: string;
  description: string;
  imageUri: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  lastUpdated?: string;
  status: ReportStatusLabel;
  verificationStatus: string;
  verificationReason?: string | null;
  hasEvidence: boolean;
};

const STATUS_LABELS: Record<BackendIncident["status"], ReportStatusLabel> = {
  reported: "Submitted",
  verified: "Verified",
  investigating: "Action in Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

export function toReport(item: BackendIncident): Report {
  const created = item.created_at
    ? new Date(
        /[zZ]|[+-]\d\d:\d\d$/.test(item.created_at)
          ? item.created_at
          : `${item.created_at}Z`
      ).toISOString()
    : new Date().toISOString();

  return {
    id: String(item.id),
    type: item.incident_type,
    description: item.description ?? "",
    imageUri: item.evidence_image_path
      ? `${API_BASE_URL}/incidents/${item.id}/evidence`
      : null,
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: created,
    lastUpdated: created,
    status: STATUS_LABELS[item.status] ?? "Submitted",
    verificationStatus: item.verification_status || "unverified",
    verificationReason: item.verification_reason,
    hasEvidence: Boolean(item.evidence_image_path),
  };
}

export type CreateIncidentData = {
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUri?: string | null;
};

export async function uploadIncidentEvidence(
  incidentId: number | string,
  imageUri: string
): Promise<BackendIncident> {
  const filename = imageUri.split("/").pop() || "evidence.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : "jpg";
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const formData = new FormData();
  // React Native / Expo expects { uri, name, type } object on FormData
  formData.append("file", {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  return apiRequest<BackendIncident>(`/incidents/${incidentId}/evidence`, {
    method: "POST",
    body: formData,
  });
}

export async function reportIncident(
  data: CreateIncidentData
): Promise<Report> {
  const created = await apiRequest<BackendIncident>("/incidents", {
    method: "POST",
    body: {
      incident_type: data.type,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  if (data.imageUri) {
    try {
      const updated = await uploadIncidentEvidence(created.id, data.imageUri);
      return toReport(updated);
    } catch (uploadErr) {
      console.warn("Evidence photo upload failed, incident record preserved:", uploadErr);
    }
  }

  return toReport(created);
}

export async function getMyReports(): Promise<Report[]> {
  const items = await apiRequest<BackendIncident[]>("/incidents/my");
  return items.map(toReport);
}
