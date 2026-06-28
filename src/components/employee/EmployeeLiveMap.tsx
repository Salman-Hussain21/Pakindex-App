"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

const DEFAULT_CENTER: [number, number] = [24.8607, 67.0011];

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
  onToggleRoute
}: {
  businesses: MapBusiness[];
  routeMode?: boolean;
  routeList?: string[];
  onToggleRoute?: (id: string) => void;
}) {
  // Extract coordinates for the route polyline based on the selected routeList order
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
      
      {/* Draw the routing line between selected businesses */}
      {routeCoordinates.length > 1 && (
        <Polyline positions={routeCoordinates} color="#0ea5e9" weight={4} dashArray="8, 8" />
      )}

      {businesses.map((b) => {
        const isSelected = routeList.includes(b.id);
        const orderIndex = routeList.indexOf(b.id);
        
        return (
          <CircleMarker
            key={b.id}
            center={[Number(b.latitude), Number(b.longitude)]}
            radius={isSelected ? 10 : 8}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: isSelected ? "#f59e0b" : "#0ea5e9", // Amber if in route, blue otherwise
              fillOpacity: 0.9,
            }}
            eventHandlers={routeMode && onToggleRoute ? { click: () => onToggleRoute(b.id) } : {}}
          >
            {!routeMode && (
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ fontWeight: 600, marginBottom: 2 }}>{b.name}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                    {b.category_name || "Restaurant"} {b.area_name ? `· ${b.area_name}` : ""}
                  </p>
                  {b.phone && <p style={{ fontSize: 12, margin: "2px 0 0", color: "#333" }}>{b.phone}</p>}
                  <div style={{ marginTop: 8 }}>
                    <button 
                      onClick={() => alert(`Added ${b.name} to CRM!`)}
                      style={{ width: "100%", padding: "6px", backgroundColor: "#02502f", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
                    >
                      + Add to CRM Lead
                    </button>
                  </div>
                </div>
              </Popup>
            )}
            {/* When in route mode, display the stop number instead of normal popup */}
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
