import { listPublishedActivities } from "@/lib/activities";
import { mediaUrl } from "@/lib/storage";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  "boot-camp": "Boot Camp",
  hackathon: "Hackathon",
  "web-development": "Web Development",
  "app-development": "App Development",
  "data-analysis": "Data Analysis",
  "artificial-intelligence": "Artificial Intelligence",
  cybersecurity: "Cybersecurity",
  "digital-skills": "Digital Skills",
  videography: "Videography",
  entrepreneurship: "Entrepreneurship",
  conference: "Conference",
  seminar: "Seminar",
  "community-outreach": "Community Outreach",
  other: "Other",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ActivitiesPage() {
  let activities: Awaited<ReturnType<typeof listPublishedActivities>> = [];
  try {
    activities = await listPublishedActivities();
  } catch {
    activities = [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Activities &amp; Programs</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Upcoming Activities &amp; Programs
          </h1>
          <p className="text-body-md text-muted">
            Discover and apply for Jallal Group training boot camps, hackathons,
            workshops, and professional programs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/student/login" className="Button">
            <button className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-white text-sm font-semibold shadow-sm hover:bg-rich transition-colors">
              Apply Now
            </button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
        {activities.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 8.088 9.246 9 7.5 9c-1.757 0-3.338.917-4.123 1.584a3.003 3.003 0 00-.316 3.05c0 .337.027.666.077.984 1.063.672 2.53 1.073 4.056 1.073 1.525 0 2.993-.401 4.056-1.073.05-.318.077-.647.077-.984 0-1.028-.166-2.057-.316-3.05a3.003 3.003 0 00-.316-3.05c-.785-.667-2.366-1.584-4.123-1.584-1.746 0-3.332.912-4.5 2.25m12 0c.584-.816.91-1.802.91-2.25 0-1.09-.326-2.19-.884-3.162a3.003 3.003 0 00-.316-3.05c-.785-.667-2.366-1.584-4.123-1.584-1.746 0-3.332.912-4.5 2.25m0 13c-.584.816-.91 1.802-.91 2.25 0 1.09.326 2.19.884 3.162a3.003 3.003 0 00.316 3.05c.785.667 2.366 1.584 4.123 1.584 1.746 0 3.332-.912 4.5-2.25m0-13c.584-.816.91-1.802.91-2.25 0-1.09-.326-2.19-.884-3.162a3.003 3.003 0 00-.316-3.05c-.785-.667-2.366-1.584-4.123-1.584-1.746 0-3.332.912-4.5 2.25m0 13c-.584.816-.91 1.802-.91 2.25 0 1.09.326 2.19.884 3.162a3.003 3.003 0 00.316 3.05c.785.667 2.366 1.584 4.123 1.584 1.746 0 3.332-.912 4.5-2.25m0-13c.584-.816.91-1.802.91-2.25 0-1.09-.326-2.19-.884-3.162a3.003 3.003 0 00-.316-3.05c-.785-.667-2.366-1.584-4.123-1.584-1.746 0-3.332.912-4.5 2.25" /></svg>
            </div>
            <p className="text-body-sm text-ink">No activities published yet.</p>
            <p className="mt-2 text-body-sm text-muted">
              Check back soon for upcoming boot camps, hackathons, and training programs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.slug}`}
                className="flex flex-col h-full rounded-lg border border-line bg-white overflow-hidden hover:shadow-card transition-all group"
              >
                <div className="relative h-48 overflow-hidden">
                  {activity.posterImageId ? (
                    <img
                      src={mediaUrl(activity.posterImageId)}
                      alt={activity.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-surface flex items-center justify-center text-muted">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white uppercase tracking-tighter">
                    {CATEGORY_LABELS[activity.category] ?? activity.category}
                  </span>
                  {activity.isFree ? (
                    <span className="absolute top-3 right-3 rounded-md bg-success px-2 py-0.5 text-xs font-semibold text-white uppercase tracking-tighter">
                      Free
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-ink uppercase tracking-tighter">
                      Paid
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-body-lg font-semibold text-ink leading-snug group-hover:text-accent transition-colors">
                    {activity.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-muted line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-line flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-label-sm text-muted">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatDate(activity.startDate)}
                    </div>
                    <div className="text-right">
                      <span className="text-body-sm font-semibold text-ink">
                        {activity.totalSlots} slots
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">How to apply</h2>
        <ol className="space-y-3 text-body-sm text-muted list-decimal list-inside">
          <li>
            Browse the activities above and click one to view full details.
          </li>
          <li>
            Log in to your student account (or register if you are new).
          </li>
          <li>
            Complete the application form and submit before the deadline.
          </li>
          <li>
            Track your application status from your student dashboard.
          </li>
        </ol>
      </div>
    </div>
  );
}
