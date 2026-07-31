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
  const [mapReady, setMapReady] = useState(false);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  // Google Maps URL: use coordinates if available, otherwise search by name+address
  const googleUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address || ""} Pakistan`)}`;

  useEffect(() => {
    if (!hasCoords || !mapRef.current) return;
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
      setMapReady(true);
    }).catch(() => {});
    return () => { try { map?.remove(); } catch {} };
  }, [lat, lng, hasCoords, name]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="flex-shrink-0 text-brand-600 dark:text-brand-400" />
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-gray-100">{name}</p>
          </div>
          <button onClick={onClose} className="ml-2 flex-shrink-0 text-ink-900/40 hover:text-ink-900 dark:text-gray-500 dark:hover:text-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Map area */}
        {hasCoords ? (
          <div ref={mapRef} style={{ height: 200 }} className="bg-gray-100 dark:bg-gray-800" />
        ) : (
          /* No coords — show helpful fallback instead of dead space */
          <div className="flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800" style={{ height: 160 }}>
            <MapPin size={28} className="text-ink-900/20 dark:text-gray-600" />
            <div className="text-center px-4">
              <p className="text-sm font-medium text-ink-900/50 dark:text-gray-400">No GPS coordinates saved</p>
              <p className="text-xs text-ink-900/30 dark:text-gray-600 mt-0.5">Use Google Maps to find this location</p>
            </div>
            <a href={googleUrl} target="_blank" rel="noreferrer"
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
              Search on Google Maps
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-black/5 px-4 py-3 dark:border-white/10">
          {address && <p className="mb-2 text-xs text-ink-900/60 dark:text-gray-400 leading-relaxed">{address}</p>}
          <a href={googleUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">
            <ExternalLink size={11} />
            {hasCoords ? "Open in Google Maps" : "Search on Google Maps"}
          </a>
        </div>
      </div>
    </div>
  );
}
