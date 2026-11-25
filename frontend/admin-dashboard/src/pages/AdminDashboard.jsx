
import { useCallback, useEffect, useRef, useState } from "react";
import "./../App.css";
import {
  getEmergencies,
  getIncidents,
  getFloodRisks,
  setEmergencyStatus,
  setIncidentStatus,
  openAdminSocket,
  getSavedAdmin,
  getIncidentEvidence,
  reviewIncidentVerification,
} from "../api";

import IncidentMap from "../components/IncidentMap";

const EMERGENCY_STATUSES = ["active", "dispatched", "resolved"];

const INCIDENT_STATUSES = [
  "reported",
  "verified",
  "investigating",
  "resolved",
  "rejected",
];

const REVIEW_STATUSES = ["unverified", "needs_review", "verifying"];

const SERVICE_LABELS = {
  hospital: "Hospital",
  fire_station: "Fire Station",
  police: "Police Station",
  ambulance: "Ambulance Service",
};

const when = (value) => {
  if (!value) return "-";

  const normalized = /[zZ]|[+-]\d\d:\d\d$/.test(value)
    ? value
    : `${value}Z`;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const statusClass = (status) =>
  ({
    active: "b-red",
    critical: "b-red",
    reported: "b-amber",
    unverified: "b-amber",
    needs_review: "b-amber",
    verifying: "b-amber",
    dispatched: "b-blue",
    verified: "b-blue",
    investigating: "b-blue",
    resolved: "b-green",
    rejected: "b-grey",
    normal: "b-grey",
    high: "b-red",
  }[String(status || "").toLowerCase()] || "b-grey");

const riskClass = (risk) =>
  ({
    LOW: "b-green",
    MODERATE: "b-amber",
    HIGH: "b-red",
    SEVERE: "b-red",
    CRITICAL: "b-red",
  }[String(risk || "").toUpperCase()] || "b-grey");

const formatDistance = (meters) => {
  const distance = Number(meters);

  if (!Number.isFinite(distance) || distance < 0) return "Distance unavailable";

  return distance >= 1000
    ? `${(distance / 1000).toFixed(1)} km away`
    : `${Math.round(distance)} m away`;
};

export default function AdminDashboard({ onLogout }) {
  const admin = getSavedAdmin();

  const [tab, setTab] = useState("overview");
  const [emergencies, setEmergencies] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [floods, setFloods] = useState([]);
  const [feed, setFeed] = useState([]);
  const [emergencyServices, setEmergencyServices] = useState({});
  const [socket, setSocket] = useState("connecting");
  const [error, setError] = useState("");
  const [reviewReason, setReviewReason] = useState({});
  const [reviewBusy, setReviewBusy] = useState(null);
  const [evidenceUrls, setEvidenceUrls] = useState({});
  const [evidenceBusy, setEvidenceBusy] = useState(null);

  const retry = useRef(null);
  const evidenceUrlsRef = useRef({});
  const loadingRef = useRef(false);

  const loadAll = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;

    try {
      const [emergencyData, incidentData] = await Promise.all([
        getEmergencies(),
        getIncidents(),
      ]);

      setEmergencies(Array.isArray(emergencyData) ? emergencyData : []);
      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setError("");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        onLogout();
        return;
      }

      setError(err.message || "Could not load dashboard data.");
    } finally {
      loadingRef.current = false;
    }

    try {
      const floodData = await getFloodRisks();
      setFloods(floodData?.stations || []);
    } catch {
      setFloods([]);
    }
  }, [onLogout]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAll();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAll]);

  // Live updates and reconnect handling.
  useEffect(() => {
    let ws;
    let closed = false;

    const connect = () => {
      if (closed) return;

      try {
        ws = openAdminSocket();

        ws.onopen = () => {
          setSocket("live");
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const payload = message.data || message.emergency || {};

            // Retain nearby-service results for this dashboard session.
            if (message.type === "new_emergency" && payload.id != null) {
              setEmergencyServices((previous) => ({
                ...previous,
                [payload.id]: {
                  services: Array.isArray(payload.nearby_services)
                    ? payload.nearby_services
                    : [],
                  notifications: Array.isArray(
                    payload.simulated_notifications
                  )
                    ? payload.simulated_notifications
                    : [],
                  source: payload.service_lookup_source || "unavailable",
                  receivedAt: new Date().toISOString(),
                },
              }));
            }

            setFeed((old) =>
              [
                {
                  ...message,
                  payload,
                  at: new Date(),
                },
                ...old,
              ].slice(0, 30)
            );

            loadAll();
          } catch {
            setError("Received an unreadable live update.");
          }
        };

        ws.onerror = () => {
          setSocket("offline");
        };

        ws.onclose = () => {
          setSocket("offline");

          if (!closed) {
            retry.current = setTimeout(connect, 3000);
          }
        };
      } catch {
        setSocket("offline");

        if (!closed) {
          retry.current = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(retry.current);

      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [loadAll]);

  // Release temporary image URLs when the dashboard unmounts.
  useEffect(() => {
    return () => {
      Object.values(evidenceUrlsRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });

      evidenceUrlsRef.current = {};
    };
  }, []);

  async function changeEmergency(id, status) {
    setError("");

    try {
      await setEmergencyStatus(id, status);
      await loadAll();
    } catch (err) {
      setError(err.message || "Could not update emergency status.");
    }
  }

  async function changeIncident(id, status) {
    setError("");

    try {
      await setIncidentStatus(id, status);
      await loadAll();
    } catch (err) {
      setError(err.message || "Could not update incident status.");
    }
  }

  async function reviewIncident(id, decision) {
    const reason = (reviewReason[id] || "").trim();

    if (!reason) {
      setError("Enter a review reason before submitting a decision.");
      return;
    }

    setReviewBusy(id);
    setError("");

    try {
      await reviewIncidentVerification(id, decision, reason);

      setReviewReason((old) => ({
        ...old,
        [id]: "",
      }));

      await loadAll();
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError(err.message || "Admin access is required.");
      } else {
        setError(err.message || "Could not save the review decision.");
      }
    } finally {
      setReviewBusy(null);
    }
  }

  async function showEvidence(id) {
    if (evidenceUrlsRef.current[id]) return;

    setEvidenceBusy(id);
    setError("");

    try {
      const url = await getIncidentEvidence(id);

      evidenceUrlsRef.current[id] = url;

      setEvidenceUrls((old) => ({
        ...old,
        [id]: url,
      }));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError(err.message || "Admin access is required to view evidence.");
      } else {
        setError(err.message || "Could not load the evidence image.");
      }
    } finally {
      setEvidenceBusy(null);
    }
  }

  const activeSOS = emergencies.filter(
    (emergency) => emergency.status === "active"
  ).length;

  const newReports = incidents.filter(
    (incident) => incident.status === "reported"
  ).length;

  const suspicious = incidents.filter(
    (incident) => incident.ai_classification === "SUSPICIOUS"
  ).length;

  const highFlood = floods.filter((flood) =>
    ["HIGH", "SEVERE", "CRITICAL"].includes(
      String(flood.risk_level || "").toUpperCase()
    )
  ).length;

  const reviewQueue = incidents.filter((incident) =>
    REVIEW_STATUSES.includes(incident.verification_status)
  );

  return (
    <div>
      <div className="topbar">
        <div className="brand">CITYLENS AI • ADMIN</div>

        <div className="right">
          <span className="pill">
            <span
              className={`dot ${
                socket === "live"
                  ? "on"
                  : socket === "offline"
                    ? "off"
                    : ""
              }`}
            />
            {socket === "live"
              ? "Live"
              : socket === "offline"
                ? "Reconnecting..."
                : "Connecting..."}
          </span>

          <span className="muted">{admin?.name}</span>

          <button className="link" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="tabs">
        {[
          ["overview", "Overview"],
          ["emergencies", "Emergencies"],
          ["incidents", "Reports & Complaints"],
          ["flood", "Flood Risk"],
          ["verification", `AI Review Queue (${reviewQueue.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="content">
        {error && (
          <div
            className="error"
            role="alert"
            style={{ marginTop: 0, marginBottom: 14 }}
          >
            {error}
          </div>
        )}

        {tab === "overview" && (
          <>
            <div className="stats">
              <div className="stat">
                <span className="muted">ACTIVE SOS</span>
                <b style={{ color: activeSOS ? "var(--red)" : "inherit" }}>
                  {activeSOS}
                </b>
              </div>

              <div className="stat">
                <span className="muted">NEW REPORTS</span>
                <b>{newReports}</b>
              </div>

              <div className="stat">
                <span className="muted">AI-FLAGGED REPORTS</span>
                <b>{suspicious}</b>
              </div>

              <div className="stat">
                <span className="muted">HIGH FLOOD-RISK STATIONS</span>
                <b>{highFlood}</b>
              </div>
            </div>

            <IncidentMap
              incidents={incidents}
              emergencies={emergencies}
              floods={floods}
              height={340}
            />

            <h3 style={{ marginBottom: 12, marginTop: 24 }}>
              Live activity
            </h3>

            {feed.length === 0 ? (
              <div className="card empty">
                Waiting for live events... new SOS requests will appear here.
              </div>
            ) : (
              <div className="card">
                {feed.map((message, index) => {
                  const payload = message.payload || {};
                  const eventType = message.type || message.event || "";
                  const isNewEmergency = eventType === "new_emergency";
                  const isEmergencyEvent =
                    eventType.includes("emergency") ||
                    Boolean(payload.emergency_type);

                  return (
                    <div className="feed-item" key={`${eventType}-${index}`}>
                      <b>
                        {isNewEmergency
                          ? "New emergency"
                          : isEmergencyEvent
                            ? "Emergency update"
                            : eventType || "Live update"}
                      </b>{" "}
                      —{" "}
                      {payload.emergency_type ||
                        payload.incident_type ||
                        "Activity"}
                      {payload.id ? ` (#${payload.id})` : ""}{" "}
                      {payload.status && (
                        <span
                          className={`badge ${statusClass(payload.status)}`}
                        >
                          {payload.status}
                        </span>
                      )}{" "}
                      <span className="muted">
                        {message.at instanceof Date
                          ? message.at.toLocaleTimeString("en-IN")
                          : when(message.at)}
                      </span>

                      {isNewEmergency &&
                        Array.isArray(payload.nearby_services) &&
                        payload.nearby_services.length > 0 && (
                          <div className="nearby-services-list feed-services">
                            {payload.nearby_services.map((service, i) => (
                              <div
                                className="nearby-service-item"
                                key={`${service.service_type}-${service.name}-${i}`}
                              >
                                <strong>
                                  {SERVICE_LABELS[service.service_type] ||
                                    service.service_type}
                                </strong>
                                <div>{service.name}</div>
                                <small>
                                  {formatDistance(service.distance_meters)}
                                </small>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "emergencies" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TYPE</th>
                  <th>DESCRIPTION</th>
                  <th>LOCATION</th>
                  <th>NEARBY SERVICES</th>
                  <th>TIME</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {emergencies.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty">
                      No emergencies yet.
                    </td>
                  </tr>
                )}

                {emergencies.map((emergency) => {
                  const response = emergencyServices[emergency.id];
                  const services = response?.services || [];
                  const notifications = response?.notifications || [];

                  return (
                    <tr key={emergency.id}>
                      <td>#{emergency.id}</td>
                      <td>{emergency.emergency_type}</td>
                      <td>{emergency.description || "-"}</td>

                      <td>
                        <a
                          style={{ color: "var(--blue)" }}
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`}
                        >
                          {Number(emergency.latitude).toFixed(4)},{" "}
                          {Number(emergency.longitude).toFixed(4)}
                        </a>
                      </td>

                      <td>
                        {!response ? (
                          <span className="muted">
                            Awaiting service lookup
                          </span>
                        ) : services.length === 0 ? (
                          <span className="muted">
                            No nearby services found
                          </span>
                        ) : (
                          <div className="nearby-services-list">
                            {services.map((service, index) => {
                              const notification = notifications.find(
                                (item) =>
                                  item.service_name === service.name &&
                                  item.service_type === service.service_type
                              );

                              return (
                                <div
                                  className="nearby-service-item"
                                  key={`${service.service_type}-${service.name}-${index}`}
                                >
                                  <strong>
                                    {SERVICE_LABELS[service.service_type] ||
                                      service.service_type}
                                  </strong>

                                  <div>{service.name}</div>

                                  <small>
                                    {formatDistance(service.distance_meters)}
                                  </small>

                                  {notification && (
                                    <div className="muted service-notification">
                                      {notification.notification_status ===
                                      "SIMULATED_ONLY"
                                        ? "Notification prepared"
                                        : notification.notification_status}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td>{when(emergency.created_at)}</td>

                      <td>
                        <span
                          className={`badge ${statusClass(emergency.status)}`}
                        >
                          {emergency.status}
                        </span>{" "}

                        <select
                          aria-label={`Emergency ${emergency.id} status`}
                          value={emergency.status}
                          onChange={(event) =>
                            changeEmergency(emergency.id, event.target.value)
                          }
                        >
                          {EMERGENCY_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "incidents" && (
          <>
            <div className="section-heading page-section-heading">
              <div>
                <p className="eyebrow">CITIZEN INTAKE</p>
                <h2>Citizen reports &amp; complaints</h2>
                <p className="section-intro">
                  AI triage labels and prioritises incoming reports. Use the
                  review queue to record a verification decision; use status to
                  track operational progress.
                </p>
              </div>
              <div className="mini-stat">
                <span>Total reports</span>
                <strong>{incidents.length}</strong>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>TYPE</th>
                    <th>DESCRIPTION</th>
                    <th>LOCATION</th>
                    <th>AI TRIAGE</th>
                    <th>REVIEW DECISION</th>
                    <th>TIME</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {incidents.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty">
                        No reports yet.
                      </td>
                    </tr>
                  )}

                  {incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td>#{incident.id}</td>
                      <td>{incident.incident_type}</td>

                      <td style={{ maxWidth: 260 }}>
                        {incident.description || "-"}
                      </td>

                      <td>
                        <a
                          style={{ color: "var(--blue)" }}
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                        >
                          {Number(incident.latitude).toFixed(4)},{" "}
                          {Number(incident.longitude).toFixed(4)}
                        </a>
                      </td>

                      <td title={incident.ai_reason || ""}>
                        <span
                          className={`badge ${
                            incident.ai_classification === "SUSPICIOUS"
                              ? "b-red"
                              : "b-grey"
                          }`}
                        >
                          {incident.ai_classification || "-"}
                        </span>

                        <div className="muted">
                          Score {incident.ai_suspicion_score ?? "-"}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${statusClass(
                            incident.verification_status
                          )}`}
                        >
                          {incident.verification_status || "unverified"}
                        </span>

                        <div className="muted table-hint">
                          {[
                            "unverified",
                            "needs_review",
                            "verifying",
                          ].includes(
                            String(
                              incident.verification_status || ""
                            ).toLowerCase()
                          )
                            ? "Awaiting review"
                            : "Decision recorded"}
                        </div>
                      </td>

                      <td>{when(incident.created_at)}</td>

                      <td>
                        <span
                          className={`badge ${statusClass(incident.status)}`}
                        >
                          {incident.status}
                        </span>{" "}

                        <select
                          aria-label={`Incident ${incident.id} status`}
                          value={incident.status}
                          disabled={["resolved", "rejected"].includes(
                            String(incident.status || "").toLowerCase()
                          )}
                          title={
                            ["resolved", "rejected"].includes(
                              String(incident.status || "").toLowerCase()
                            )
                              ? "This report has reached a terminal operational state."
                              : "Update operational status"
                          }
                          onChange={(event) =>
                            changeIncident(incident.id, event.target.value)
                          }
                        >
                          {INCIDENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {["resolved", "rejected"].includes(
                          String(incident.status || "").toLowerCase()
                        ) && (
                          <div className="muted table-hint">
                            Terminal status · locked
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "verification" && (
          <div>
            <div className="section-heading">
              <div>
                <p className="eyebrow">AI-ASSISTED WORKFLOW</p>
                <h2>Report review queue</h2>
              </div>
              <span className="badge b-amber">
                {reviewQueue.length} awaiting review
              </span>
            </div>

            <p className="section-intro">
              AI triage provides an initial classification and explanation.
              Review the evidence and reason before recording the final
              verification decision. Urgent emergency coordination remains a
              separate workflow.
            </p>

            {reviewQueue.length === 0 ? (
              <div className="card empty">
                No incidents are waiting for verification.
              </div>
            ) : (
              reviewQueue.map((incident) => (
                <div className="card review-card" key={incident.id}>
                  <div className="row review-card-heading">
                    <div>
                      <p className="eyebrow">
                        CITIZEN REPORT · #{incident.id}
                      </p>
                      <h3>
                        {incident.incident_type || "Uncategorised report"}
                      </h3>
                    </div>

                    <span
                      className={`badge ${statusClass(
                        incident.verification_status
                      )}`}
                    >
                      {incident.verification_status}
                    </span>
                  </div>

                  <p>{incident.description || "No description provided."}</p>

                  <p className="muted">
                    Location: {Number(incident.latitude).toFixed(4)},{" "}
                    {Number(incident.longitude).toFixed(4)}{" "}
                    <a
                      style={{ color: "var(--blue)" }}
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                    >
                      Open map
                    </a>
                  </p>

                  <p className="muted">
                    Submitted: {when(incident.created_at)}
                  </p>

                  <div className="ai-assessment">
                    <div>
                      <p className="eyebrow">AI CLASSIFICATION</p>
                      <span
                        className={`badge ${
                          incident.ai_classification === "SUSPICIOUS"
                            ? "b-red"
                            : "b-blue"
                        }`}
                      >
                        {incident.ai_classification || "Not available"}
                      </span>
                    </div>

                    <div>
                      <p className="eyebrow">SUSPICION SCORE</p>
                      <strong>{incident.ai_suspicion_score ?? "—"}</strong>
                    </div>

                    <div>
                      <p className="eyebrow">EMERGENCY PRIORITY</p>
                      <span
                        className={`badge ${statusClass(
                          incident.emergency_priority
                        )}`}
                      >
                        {incident.emergency_priority || "normal"}
                      </span>
                    </div>
                  </div>

                  {incident.ai_reason && (
                    <p className="muted">AI note: {incident.ai_reason}</p>
                  )}

                  <p className="muted">
                    Verification note:{" "}
                    {incident.verification_reason ||
                      "No review note recorded."}
                  </p>

                  {incident.evidence_image_path ? (
                    <div style={{ margin: "12px 0" }}>
                      {evidenceUrls[incident.id] ? (
                        <img
                          src={evidenceUrls[incident.id]}
                          alt={`Evidence for incident ${incident.id}`}
                          style={{
                            display: "block",
                            maxWidth: "100%",
                            maxHeight: 320,
                            objectFit: "contain",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={evidenceBusy === incident.id}
                          onClick={() => showEvidence(incident.id)}
                        >
                          {evidenceBusy === incident.id
                            ? "Loading image..."
                            : "Load evidence image"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="muted">No evidence image uploaded yet.</p>
                  )}

                  <label
                    className="review-label"
                    htmlFor={`review-reason-${incident.id}`}
                  >
                    Review decision reason
                  </label>

                  <textarea
                    id={`review-reason-${incident.id}`}
                    rows={3}
                    value={reviewReason[incident.id] || ""}
                    onChange={(event) =>
                      setReviewReason((old) => ({
                        ...old,
                        [incident.id]: event.target.value,
                      }))
                    }
                    placeholder="Summarise the evidence reviewed and why this decision is appropriate..."
                    className="review-textarea"
                  />

                  <div className="review-actions">
                    <button
                      type="button"
                      disabled={reviewBusy === incident.id}
                      onClick={() => reviewIncident(incident.id, "verified")}
                      className="action-button action-success"
                    >
                      {reviewBusy === incident.id
                        ? "Saving..."
                        : "Confirm report"}
                    </button>

                    <button
                      type="button"
                      disabled={reviewBusy === incident.id}
                      onClick={() => reviewIncident(incident.id, "rejected")}
                      className="action-button action-danger"
                    >
                      Reject report
                    </button>

                    <button
                      type="button"
                      disabled={reviewBusy === incident.id}
                      onClick={() =>
                        reviewIncident(incident.id, "needs_review")
                      }
                      className="action-button action-secondary"
                    >
                      Keep in review queue
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "flood" && (
          <>
            {floods.length === 0 ? (
              <div className="card empty">
                No flood data yet. The backend collects BMC rainfall data every
                15 minutes.
              </div>
            ) : (
              floods.map((flood) => (
                <div className="card" key={flood.bmc_location_id}>
                  <div className="row">
                    <b>{flood.station_name}</b>

                    <span>
                      <span className={`badge ${riskClass(flood.risk_level)}`}>
                        {flood.risk_level}
                      </span>{" "}

                      <span className="muted">
                        score {flood.risk_score} • data{" "}
                        {String(flood.data_status).toLowerCase()}
                      </span>
                    </span>
                  </div>

                  {flood.reasons?.length > 0 && (
                    <ul
                      className="muted"
                      style={{ margin: "10px 0 0", paddingLeft: 18 }}
                    >
                      {flood.reasons.map((reason, index) => (
                        <li key={`${flood.bmc_location_id}-${index}`}>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
