"use client";

import { useState } from "react";
import { ImageOff, X, Sparkles } from "lucide-react";
import StatusBadge from "./StatusBadge";
import AIPitchModal from "@/components/company/AIPitchModal";

export interface BusinessDetail {
  id: string;
  name: string;
  category_name?: string | null;
  business_type?: string | null;
  rating?: number | null;
  review_count?: number | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city_name?: string | null;
  area_name?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  open_state?: string | null;
  price_range?: string | null;
  service_options?: string[] | null;
  thumbnail?: string | null;
  images?: string[] | null;
  extensions?: { popularFor?: string[]; offerings?: string[]; highlights?: string[] } | null;
  status?: string | null;
  rejection_reason?: string | null;
  added_by_company?: string | null;
  assigned_employee?: string | null;
  created_at?: string;
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center gap-1 rounded-xl bg-gray-100 text-ink-900/30 dark:bg-gray-800 dark:text-gray-600">
        <ImageOff size={22} />
        <span className="text-xs">Photo unavailable</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className="h-40 w-full rounded-xl object-cover"
    />
  );
}

function MenuPhotoThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Menu"
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
    />
  );
}

export default function BusinessDetailModal({
  business,
  onClose,
  actions,
}: {
  business: BusinessDetail;
  onClose: () => void;
  actions?: React.ReactNode;
}) {
  const [showAiModal, setShowAiModal] = useState(false);
  const menuPhotos = (business.images || []).filter(Boolean);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink-900 dark:text-gray-100">{business.name}</h2>
                <button
                  onClick={() => setShowAiModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 px-3 py-1 text-[11px] font-bold text-white shadow hover:opacity-95 transition-all"
                  title="Generate AI Lead Score & Sales Script"
                >
                  <Sparkles size={12} />
                  AI Intelligence
                </button>
              </div>
              <div className="mt-1"><StatusBadge status={business.status} /></div>
            </div>
            <button
              onClick={onClose}
              className="text-ink-900/40 hover:text-ink-900 dark:text-gray-500 dark:hover:text-gray-100"
            >
              <X size={18} />
            </button>
          </div>

        <div className="space-y-6 px-6 py-5">
          {business.thumbnail && <Thumbnail src={business.thumbnail} alt={business.name} />}

          {menuPhotos.length > 0 && (
            <Section title={`Menu Photos (${menuPhotos.length})`}>
              <div className="col-span-2 flex gap-2 overflow-x-auto pb-1">
                {menuPhotos.map((url, i) => (
                  <MenuPhotoThumb key={i} src={url} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Basic">
            <Field label="Category" value={business.category_name} />
            <Field label="Type" value={business.business_type} />
            <Field label="Rating" value={business.rating ? `★ ${business.rating}` : null} />
            <Field label="Reviews" value={business.review_count} />
          </Section>

          <Section title="Contact">
            <Field label="Phone" value={business.phone} />
            <Field label="Website" value={business.website} link />
          </Section>

          <Section title="Location">
            <Field label="Address" value={business.address} full />
            <Field label="Area" value={business.area_name} />
            <Field label="City" value={business.city_name} />
            <Field
              label="Coordinates"
              value={
                business.latitude && business.longitude
                  ? `${business.latitude}, ${business.longitude}`
                  : null
              }
            />
          </Section>

          <Section title="Operations">
            <Field label="Open Status" value={business.open_state} />
            <Field label="Price Range" value={business.price_range} />
            <Field
              label="Service Options"
              value={business.service_options?.join(", ")}
              full
            />
          </Section>

          {((business.extensions?.popularFor?.length ?? 0) > 0 || (business.extensions?.offerings?.length ?? 0) > 0) && (
            <Section title="Popular For & Offerings">
              {(business.extensions?.popularFor?.length ?? 0) > 0 && (
                <div className="col-span-2">
                  <p className="mb-1 text-[11px] text-ink-900/40 dark:text-gray-500">Popular For</p>
                  <div className="flex flex-wrap gap-1.5">
                    {business.extensions!.popularFor!.map((tag, i) => (
                      <span key={i} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(business.extensions?.offerings?.length ?? 0) > 0 && (
                <div className="col-span-2">
                  <p className="mb-1 text-[11px] text-ink-900/40 dark:text-gray-500">Offerings</p>
                  <div className="flex flex-wrap gap-1.5">
                    {business.extensions!.offerings!.map((tag, i) => (
                      <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-ink-900/70 dark:bg-gray-800 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {(business.added_by_company || business.assigned_employee) && (
            <Section title="CRM">
              <Field label="Added By Company" value={business.added_by_company || "Not added"} />
              <Field label="Assigned Employee" value={business.assigned_employee || "—"} />
            </Section>
          )}

          {business.rejection_reason && (
            <Section title="Rejection Reason">
              <p className="text-sm text-red-700 dark:text-red-400">{business.rejection_reason}</p>
            </Section>
          )}
        </div>

        {actions && (
          <div className="flex justify-end gap-2 border-t border-black/5 px-6 py-4 dark:border-white/10">{actions}</div>
        )}
      </div>
    </div>

    <AIPitchModal
      isOpen={showAiModal}
      onClose={() => setShowAiModal(false)}
      business={{
        id: business.id,
        name: business.name,
        category: business.category_name || business.business_type || undefined,
        area: business.area_name || undefined,
        city: business.city_name || "Karachi",
        rating: business.rating,
        review_count: business.review_count,
        price_range: business.price_range,
        phone: business.phone || undefined,
        address: business.address || undefined,
      }}
    />
  </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-900/40 dark:text-gray-500">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  full,
  link,
}: {
  label: string;
  value?: string | number | null;
  full?: boolean;
  link?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-[11px] text-ink-900/40 dark:text-gray-500">{label}</p>
      {value ? (
        link ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-brand-700 hover:underline dark:text-brand-400"
          >
            {value}
          </a>
        ) : (
          <p className="break-words text-sm text-ink-900 dark:text-gray-100">{value}</p>
        )
      ) : (
        <p className="text-sm text-ink-900/30 dark:text-gray-600">—</p>
      )}
    </div>
  );
}
