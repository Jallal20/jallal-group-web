import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Clock, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listNotifications, markNotificationRead, deleteNotification } from "@/lib/notifications";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  await requireAdmin();

  let items: Awaited<ReturnType<typeof listNotifications>>["items"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await listNotifications({ limit: 100 });
    items = result.items;
    total = result.total;
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Notifications could not be loaded right now.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Notifications</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Notification Center
        </h1>
        <p className="text-body-md text-muted">
          Administrative notifications and system alerts.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
            <Bell className="h-6 w-6" />
          </span>
          <p className="text-body-md text-ink">No notifications.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((notification) => (
            <li
              key={notification.id}
              className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-surface lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-title-md font-semibold text-ink">
                    {notification.title}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-xs font-medium",
                      notification.read
                        ? "bg-accent/10 text-forest border border-accent/20"
                        : "bg-warning/10 text-warning border border-warning/20",
                    )}
                  >
                    {notification.read ? "Read" : "Unread"}
                  </span>
                  <span className="text-label-sm text-muted">{notification.type}</span>
                </div>
                <p className="text-body-sm leading-relaxed text-ink/85">
                  {notification.message}
                </p>
                <p className="text-label-sm text-muted">
                  {formatDate(notification.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void markNotificationRead(notification.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                >
                  {notification.read ? "Mark unread" : "Mark read"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm("Delete this notification? This cannot be undone.")
                    ) {
                      void deleteNotification(notification.id).then(() => {
                        window.location.reload();
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-white px-3 py-2 label-caps text-danger transition-colors hover:bg-danger hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-line px-6 py-3 text-label-sm text-muted">
          <span>{total} notification{total === 1 ? "" : "s"} shown</span>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
