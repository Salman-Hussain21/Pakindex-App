import { query } from "@/lib/db";

export type AuditEntity =
  | "user" | "company" | "business" | "crm_lead" | "employee" | "scrape_job" | "territory";
export type AuditAction =
  | "create" | "update" | "delete" | "login" | "logout"
  | "export" | "import" | "approve" | "reject" | "restore" | "merge" | "assign";

// Fire-and-forget audit log insert. Never throws into the caller — a logging
// failure should never block the real action (approve/reject/etc).
export async function logAudit(params: {
  performedBy: string | null;
  companyId?: string | null;
  entityType: AuditEntity;
  entityId?: string | null;
  action: AuditAction;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
}) {
  try {
    await query(
      `INSERT INTO audit_logs (performed_by, company_id, entity_type, entity_id, action, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.performedBy,
        params.companyId ?? null,
        params.entityType,
        params.entityId ?? null,
        params.action,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
      ]
    );
  } catch (err) {
    console.error("audit log insert failed:", err);
  }
}

// Push a notification to every super_admin (the only role using this panel
// today — once Company/Employee dashboards exist, pass recipient ids in).
export async function notifyAdmins(params: {
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    const admins = await query(`SELECT id FROM users WHERE role = 'super_admin' AND deleted_at IS NULL`);
    for (const row of admins.rows) {
      await query(
        `INSERT INTO notifications (recipient_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5)`,
        [row.id, params.type, params.title, params.body ?? null, params.link ?? null]
      );
    }
  } catch (err) {
    console.error("notification insert failed:", err);
  }
}

// Push a notification to a company's users (or a specific subset via
// recipientIds). Mirrors notifyAdmins but scoped to a single company_id —
// used by company_admin/employee side routes (employees, CRM, restaurants).
export async function notifyCompany(params: {
  companyId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  recipientIds?: string[]; // optional — if omitted, notifies all active users in the company
}) {
  try {
    let recipients: { id: string }[];
    if (params.recipientIds && params.recipientIds.length > 0) {
      recipients = params.recipientIds.map((id) => ({ id }));
    } else {
      const res = await query(
        `SELECT id FROM users WHERE company_id = $1 AND deleted_at IS NULL AND status = 'active'`,
        [params.companyId]
      );
      recipients = res.rows;
    }

    for (const row of recipients) {
      await query(
        `INSERT INTO notifications (recipient_id, company_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5, $6)`,
        [row.id, params.companyId, params.type, params.title, params.body ?? null, params.link ?? null]
      );
    }
  } catch (err) {
    console.error("company notification insert failed:", err);
  }
}