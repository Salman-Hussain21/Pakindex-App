"use client";

import StatusBadge from "./StatusBadge";

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
  status?: string | null;
  rejection_reason?: string | null;
  added_by_company?: string | null;
  assigned_employee?: string | null;
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-black/5 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{business.name}</h2>
            <div className="mt-1"><StatusBadge status={business.status} /></div>
          </div>
          <button onClick={onClose} className="text-ink-900/40 hover:text-ink-900">
            ✕
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {business.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.thumbnail}
              alt={business.name}
              className="h-40 w-full rounded-xl object-cover"
            />
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

          {(business.added_by_company || business.assigned_employee) && (
            <Section title="CRM">
              <Field label="Added By Company" value={business.added_by_company || "Not added"} />
              <Field label="Assigned Employee" value={business.assigned_employee || "—"} />
            </Section>
          )}

          {business.rejection_reason && (
            <Section title="Rejection Reason">
              <p className="text-sm text-red-700">{business.rejection_reason}</p>
            </Section>
          )}
        </div>

        {actions && (
          <div className="flex justify-end gap-2 border-t border-black/5 px-6 py-4">{actions}</div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-900/40">
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
      <p className="text-[11px] text-ink-900/40">{label}</p>
      {value ? (
        link ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-brand-700 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="break-words text-sm text-ink-900">{value}</p>
        )
      ) : (
        <p className="text-sm text-ink-900/30">—</p>
      )}
    </div>
  );
}
