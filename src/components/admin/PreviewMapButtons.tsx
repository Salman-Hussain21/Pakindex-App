"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import type { BusinessDetail } from "./BusinessDetailModal";

const BusinessDetailModal = dynamic(() => import("./BusinessDetailModal"), { ssr: false });
const MiniMapPopup = dynamic(() => import("./MiniMapPopup"), { ssr: false });

export default function PreviewMapButtons({ business }: { business: BusinessDetail }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showMap, setShowMap] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        className="inline-flex shrink-0 items-center rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        Preview
      </button>
      <button
        onClick={() => setShowMap(true)}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-white/10 dark:text-brand-400 dark:hover:bg-brand-900/20"
      >
        <MapPin size={10} />Map
      </button>
      {showPreview && <BusinessDetailModal business={business} onClose={() => setShowPreview(false)} />}
      {showMap && (
        <MiniMapPopup
          name={business.name}
          latitude={(business as any).latitude}
          longitude={(business as any).longitude}
          address={business.address}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  );
}
