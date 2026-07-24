"use client";

import { MapContainer, TileLayer, Circle, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";

interface GridCell {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status: "fresh" | "stale" | "outdated" | "unscraped";
  approvedCount: number;
  daysSince: number | null;
}

const STATUS_COLOR: Record<string, string> = {
  fresh: "#22c55e",
  stale: "#f59e0b",
  outdated: "#ef4444",
  unscraped: "#94a3b8",
};

function FitAll({ cells }: { cells: GridCell[] }) {
  const map = useMap();
  useEffect(() => {
    if (cells.length === 0) return;
    const bounds: [number, number][] = cells.map(c => [c.lat, c.lng]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [cells, map]);
  return null;
}

export default function GridScrapeMap({
  cells, selected, queued, scraping, onSelect, onToggleQueue, onScrape,
}: {
  cells: GridCell[];
  selected: string | null;
  queued: Set<string>;
  scraping: string | null;
  onSelect: (id: string) => void;
  onToggleQueue: (id: string) => void;
  onScrape: (id: string) => void;
}) {
  return (
    <MapContainer
      center={[24.8607, 67.0011]}
      zoom={11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitAll cells={cells} />

      {cells.map(cell => {
        const isSelected = selected === cell.id;
        const isQueued = queued.has(cell.id);
        const isScraping = scraping === cell.id;
        const color = isScraping ? "#8b5cf6" : isQueued ? "#3b82f6" : STATUS_COLOR[cell.status];

        return (
          <Circle
            key={cell.id}
            center={[cell.lat, cell.lng]}
            radius={700}
            pathOptions={{
              color: isSelected ? "#1d4ed8" : color,
              fillColor: color,
              fillOpacity: isSelected ? 0.8 : 0.55,
              weight: isSelected ? 3 : isQueued ? 2 : 1.5,
              dashArray: isQueued ? "6 3" : undefined,
            }}
            eventHandlers={{ click: () => onSelect(cell.id) }}
          >
            <Tooltip permanent={false} direction="top">
              <div style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 700, marginBottom: 3 }}>{cell.label}</p>
                <p style={{ fontSize: 11, color: "#666" }}>
                  {cell.approvedCount > 0 ? `${cell.approvedCount} approved` : "No data yet"}
                  {cell.daysSince !== null ? ` · ${cell.daysSince}d ago` : " · never scraped"}
                </p>
                <p style={{ fontSize: 11, marginTop: 4, color: isScraping ? "#8b5cf6" : isQueued ? "#3b82f6" : "#03603d", fontWeight: 600 }}>
                  {isScraping ? "Scraping now…" : isQueued ? "Queued" : "Click to select"}
                </p>
              </div>
            </Tooltip>
          </Circle>
        );
      })}
    </MapContainer>
  );
}
