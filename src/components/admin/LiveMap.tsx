"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

export interface MapBusiness {
  id: string;
  name: string;
  status: string;
  latitude: number | string;
  longitude: number | string;
  rating: number | null;
  phone: string | null;
  category_name: string | null;
  area_name: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  approved: "#03603d", // brand green — live/active
  pending: "#f59e0b", // amber — awaiting review
  rejected: "#dc2626", // red
};

// Karachi — most of the demo data lives here. Re-centers automatically once
// real businesses load.
const DEFAULT_CENTER: [number, number] = [24.8607, 67.0011];

// Pans/zooms the map to fit whatever set of businesses is currently shown —
// this is what makes selecting an area in the dropdown actually "zoom into"
// it instead of just filtering markers on a static view.
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

export default function LiveMap({ businesses }: { businesses: MapBusiness[] }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds businesses={businesses} />
      {businesses.map((b) => (
        <CircleMarker
          key={b.id}
          center={[Number(b.latitude), Number(b.longitude)]}
          radius={7}
          pathOptions={{
            color: "#fff",
            weight: 1.5,
            fillColor: STATUS_COLOR[b.status] || "#6b7280",
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>{b.name}</p>
              <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                {b.category_name || "—"} {b.area_name ? `· ${b.area_name}` : ""}
              </p>
              <p style={{ fontSize: 12, margin: "4px 0 0" }}>
                {b.rating ? `★ ${b.rating}` : "No rating"} · <span style={{ textTransform: "capitalize" }}>{b.status}</span>
              </p>
              {b.phone && <p style={{ fontSize: 12, margin: "2px 0 0" }}>{b.phone}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
