import { apiRequest } from "./api";

type BackendAlert = {
  id: number;
  user_id: number | null;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: number;
  created_at: string | null;
};

export type Alert = {
  id: string;
  title: string;
  message: string;
  severity: string;
  createdAt: string;
  isRead: boolean;
  /** Broadcast alerts (no user) cannot be marked read per user */
  isBroadcast: boolean;
};

export async function getAlerts(): Promise<Alert[]> {
  const items = await apiRequest<BackendAlert[]>("/alerts");

  return items.map((item) => ({
    id: String(item.id),
    title: item.title,
    message: item.message,
    severity: item.severity,
    createdAt: item.created_at
      ? new Date(
          /[zZ]|[+-]\d\d:\d\d$/.test(item.created_at)
            ? item.created_at
            : `${item.created_at}Z`
        ).toISOString()
      : new Date().toISOString(),
    isRead: item.is_read === 1,
    isBroadcast: item.user_id === null,
  }));
}

export async function getUnreadCount(): Promise<number> {
  const data = await apiRequest<{ unread_count: number }>(
    "/alerts/unread-count"
  );
  return data.unread_count;
}

export async function markAlertAsRead(alertId: string): Promise<void> {
  await apiRequest(`/alerts/${alertId}/read`, { method: "PATCH" });
}
