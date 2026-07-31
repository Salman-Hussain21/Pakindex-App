"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MapBusiness {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  address: string | null;
  business_type: string | null;
  thumbnail: string | null;
  category_name: string | null;
  area_name: string | null;
  lead_id: string;
  stage: string;
  notes: string | null;
  next_follow_up: string | null;
  assigned_at: string;
  is_visited: boolean | null;
  last_visit_at: string | null;
}

const DEFAULT_CENTER: [number, number] = [24.8607, 67.0011];

const STAGE_COLORS: Record<string, string> = {
  new: "#0ea5e9",
  contacted: "#3b82f6",
  interested: "#a855f7",
  meeting: "#f59e0b",
  proposal: "#6366f1",
  won: "#16a34a",
  lost: "#dc2626",
};

function FitBounds({ businesses }: { businesses: MapBusiness[] }) {
  const map = useMap();

  useEffect(() => {
    if (businesses.length === 0) return;
    const bounds: [number, number][] = businesses.map((b) => [Number(b.latitude), Number(b.longitude)]);
    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [businesses, map]);

  return null;
}

export default function EmployeeLiveMap({
  businesses,
  routeMode = false,
  routeList = [],
  onToggleRoute,
  onSelectBusiness,
}: {
  businesses: MapBusiness[];
  routeMode?: boolean;
  routeList?: string[];
  onToggleRoute?: (id: string) => void;
  onSelectBusiness?: (leadId: string) => void;
}) {
  const routeCoordinates = routeList
    .map((id) => businesses.find((b) => b.id === id))
    .filter(Boolean)
    .map((b) => [Number(b!.latitude), Number(b!.longitude)] as [number, number]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds businesses={businesses} />

      {routeCoordinates.length > 1 && (
        <Polyline positions={routeCoordinates} color="#0ea5e9" weight={4} dashArray="8, 8" />
      )}

      {businesses.map((b) => {
        const isSelected = routeList.includes(b.id);
        const orderIndex = routeList.indexOf(b.id);
        const stageColor = STAGE_COLORS[b.stage] || "#0ea5e9";

        return (
          <CircleMarker
            // Including is_visited (and stage) in the key forces React to
            // fully unmount + remount this marker — and its Popup — whenever
            // either value changes. Without this, react-leaflet's Popup can
            // keep showing stale content because Leaflet manages its own
            // internal DOM node for the popup that doesn't always re-render
            // just because a prop changed while it's already open.
            key={`${b.id}-${b.is_visited}-${b.stage}`}
            center={[Number(b.latitude), Number(b.longitude)]}
            radius={isSelected ? 10 : 8}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: isSelected ? "#f59e0b" : stageColor,
              fillOpacity: 0.9,
            }}
            eventHandlers={routeMode && onToggleRoute ? { click: () => onToggleRoute(b.id) } : {}}
          >
            {!routeMode && (
              <Popup>
                <div style={{ minWidth: 190 }}>
                  <p style={{ fontWeight: 600, marginBottom: 2 }}>{b.name}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                    {b.category_name || "Restaurant"} {b.area_name ? `· ${b.area_name}` : ""}
                  </p>
                  {b.phone && <p style={{ fontSize: 12, margin: "2px 0 0", color: "#333" }}>{b.phone}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        color: stageColor, border: `1px solid ${stageColor}`,
                        borderRadius: 999, padding: "1px 6px",
                      }}
                    >
                      {b.stage}
                    </span>
                    {b.is_visited && (
                      <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>✓ Visited</span>
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => onSelectBusiness?.(b.lead_id)}
                      style={{ width: "100%", padding: "6px", backgroundColor: "#02502f", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
                    >
                      View Details & Manage Lead
                    </button>
                  </div>
                </div>
              </Popup>
            )}
            {routeMode && isSelected && (
              <Popup autoClose={false} closeButton={false}>
                <div style={{ fontWeight: "bold", textAlign: "center" }}>Stop #{orderIndex + 1}</div>
              </Popup>
            )}
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}