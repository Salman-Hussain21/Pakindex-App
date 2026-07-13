"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X, ExternalLink } from "lucide-react";

interface Props {
  name: string;
  latitude: number | string | null | undefined;
  longitude: number | string | null | undefined;
  address?: string | null;
  onClose: () => void;
}

export default function MiniMapPopup({ name, latitude, longitude, address, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [noCoords, setNoCoords] = useState(false);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  useEffect(() => {
    if (!hasCoords) { setNoCoords(true); return; }
    if (!mapRef.current) return;
    let map: any;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      L.marker([lat, lng]).addTo(map).bindPopup(name).openPopup();
      setLoaded(true);
    }).catch(() => setNoCoords(true));
    return () => { try { map?.remove(); } catch {} };
  }, [lat, lng, hasCoords, name]);

  const googleUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="flex-shrink-0 text-brand-600 dark:text-brand-400" />
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-gray-100">{name}</p>
          </div>
          <button onClick={onClose} className="ml-2 flex-shrink-0 text-ink-900/40 hover:text-ink-900 dark:text-gray-500 dark:hover:text-gray-100">
            <X size={16} />
          </button>
        </div>

        {noCoords ? (
          <div className="flex h-44 items-center justify-center bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No coordinates recorded for this business yet.</p>
          </div>
        ) : (
          <div ref={mapRef} style={{ height: 200, background: "#f1f5f9" }} />
        )}

        <div className="border-t border-black/5 px-4 py-3 dark:border-white/10">
          {address && <p className="mb-2 text-xs text-ink-900/60 dark:text-gray-400">{address}</p>}
          <a href={googleUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">
            <ExternalLink size={11} /> Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
