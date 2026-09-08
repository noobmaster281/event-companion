import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { REPORT_REASONS } from "@/lib/safety";
import type { ReportReason, ReportStatus } from "@/lib/types";
import { ReportRow } from "./ReportRow";

interface ReportListItem {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolver_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter: { id: string; name: string | null; email: string } | null;
  reported: { id: string; name: string | null; email: string } | null;
  event: { id: string; name: string; festival_name: string } | null;
}

const STATUS_ORDER: Record<ReportStatus, number> = { open: 0, reviewing: 1, resolved: 2, dismissed: 3 };
const REASON_LABELS = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]));

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) notFound();

  const admin = await createAdminClient();
  const { data } = await admin
    .from("reports")
    .select(`
      id, reason, details, status, resolver_notes, created_at, resolved_at,
      reporter:users!reports_reporter_id_fkey(id, name, email),
      reported:users!reports_reported_id_fkey(id, name, email),
      event:events(id, name, festival_name)
    `);

  const reports = ((data ?? []) as unknown as ReportListItem[]).sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="flex flex-col flex-1 pb-8 px-5">
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Reports</h1>
        <p className="text-sm text-ink/50 mt-1">{reports.length} total</p>
      </div>

      <div className="space-y-3">
        {reports.length === 0 && (
          <p className="text-ink/40 text-sm text-center py-12">No reports yet.</p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="bg-card rounded-2xl p-4 border border-sunken">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                r.status === "open"
                  ? "bg-status-report/10 text-status-report"
                  : "bg-sunken text-ink/50"
              }`}>
                {r.status}
              </span>
              <span className="text-xs text-ink/40">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-ink font-medium mt-2">
              {REASON_LABELS[r.reason] ?? r.reason}
            </p>
            <p className="text-xs text-ink/50 mt-1">
              Reported: {r.reported?.name ?? "Unknown"} ({r.reported?.email ?? "?"})
            </p>
            <p className="text-xs text-ink/30">
              Reporter (internal only): {r.reporter?.name ?? "Unknown"} ({r.reporter?.email ?? "?"})
            </p>
            {r.event && (
              <p className="text-xs text-ink/30">Event: {r.event.festival_name} — {r.event.name}</p>
            )}
            {r.details && (
              <p className="text-sm text-ink/70 mt-2 leading-relaxed">{r.details}</p>
            )}
            <ReportRow id={r.id} status={r.status} resolverNotes={r.resolver_notes} />
          </div>
        ))}
      </div>
    </div>
  );
}
