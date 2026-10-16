
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MUMBAI_CENTER = [19.076, 72.8777];

function validCoordinates(item) {
  const latitude = Number(item?.latitude ?? item?.lat);
  const longitude = Number(item?.longitude ?? item?.lon ?? item?.lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  // Avoid accidentally plotting records with missing coordinates at (0, 0).
  if (
    (item?.latitude == null && item?.lat == null) ||
    (item?.longitude == null && item?.lon == null && item?.lng == null)
  ) {
    return null;
  }

  return [latitude, longitude];
}

function FitMarkers({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [35, 35], maxZoom: 13 });
    }
  }, [map, points]);

  return null;
}

function MapMarker({ item, kind }) {
  const position = validCoordinates(item);
  if (!position) return null;

  const isEmergency = kind === "emergency";
  const isFlood = kind === "flood";
  const color = isEmergency ? "#dc2626" : isFlood ? "#2563eb" : "#d97706";

  const title =
    item.station_name ||
    item.emergency_type ||
    item.incident_type ||
    item.title ||
    item.name ||
    (isFlood ? "Flood Station" : "Incident");

  const description =
    item.description ||
    (isFlood
      ? `Risk: ${item.risk_level || "UNKNOWN"} (Score: ${item.risk_score ?? "-"})`
      : null) ||
    item.details ||
    item.message ||
    "No additional description available.";

  return (
    <CircleMarker
      center={position}
      radius={isEmergency ? 9 : isFlood ? 7 : 6}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.78,
        weight: 2,
      }}
    >
      <Popup>
        <div style={{ minWidth: 170, maxWidth: 260 }}>
          <strong>{title}</strong>
          <p style={{ margin: "8px 0" }}>{description}</p>
          <div>
            <strong>Type:</strong> {kind}
          </div>
          {item.status && (
            <div>
              <strong>Status:</strong> {item.status}
            </div>
          )}
          {item.risk_level && (
            <div>
              <strong>Risk Level:</strong> {item.risk_level}
            </div>
          )}
          {item.emergency_priority && (
            <div>
              <strong>Priority:</strong> {item.emergency_priority}
            </div>
          )}
          {item.verification_status && (
            <div>
              <strong>Verification:</strong> {item.verification_status}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function IncidentMap({
  incidents = [],
  emergencies = [],
  floods = [],
  height = 440,
}) {
  const incidentList = Array.isArray(incidents) ? incidents : [];
  const emergencyList = Array.isArray(emergencies) ? emergencies : [];
  const floodList = Array.isArray(floods) ? floods : [];

  const points = [
    ...incidentList,
    ...emergencyList,
    ...floodList,
  ]
    .map(validCoordinates)
    .filter(Boolean);

  return (
    <section className="incident-map-panel">
      <div className="incident-map-heading">
        <div>
          <h3>City Incident Map</h3>
          <p>Reported incidents, emergencies and mapped flood-risk records</p>
        </div>
        <span className="incident-map-count">{points.length} mapped</span>
      </div>

      <div
        className="incident-map-legend"
        aria-label="Map marker legend"
      >
        <span><i style={{ background: "#d97706" }} /> Incidents</span>
        <span><i style={{ background: "#dc2626" }} /> Emergencies</span>
        <span><i style={{ background: "#2563eb" }} /> Flood Stations</span>
      </div>

      <div style={{ height, width: "100%" }}>
        <MapContainer
          center={MUMBAI_CENTER}
          zoom={11}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", borderRadius: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitMarkers points={points} />

          {incidentList.map((item) => (
            <MapMarker key={`incident-${item.id}`} item={item} kind="incident" />
          ))}

          {emergencyList.map((item) => (
            <MapMarker key={`emergency-${item.id}`} item={item} kind="emergency" />
          ))}

          {floodList.map((item, index) => (
            <MapMarker
              key={`flood-${item.id ?? index}`}
              item={item}
              kind="flood"
            />
          ))}
        </MapContainer>
      </div>

      {points.length === 0 && (
        <p className="incident-map-note">
          No records with usable coordinates are available to display.
        </p>
      )}
    </section>
  );
}
