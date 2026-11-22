import { getActivityBySlug } from "@/lib/activities";
import { getApplicationFormByActivity } from "@/lib/application-forms";
import { mediaUrl } from "@/lib/storage";
import { getCurrentStudent } from "@/lib/student-auth";
import { notFound } from "next/navigation";
import Link from "next/link";

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

const VENUE_TYPE_LABELS: Record<string, string> = {
  physical: "Physical / In-person",
  online: "Online",
  hybrid: "Hybrid",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: string | null, time: string): string {
  if (!date) return "—";
  return `${formatDate(date)} at ${time}`;
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let activity: Awaited<ReturnType<typeof getActivityBySlug>> | null = null;
  try {
    activity = await getActivityBySlug(slug);
  } catch {
    activity = null;
  }
  if (!activity) notFound();

  let form: Awaited<ReturnType<typeof getApplicationFormByActivity>> | null = null;
  if (activity.applicationsEnabled) {
    try {
      form = await getApplicationFormByActivity(activity.id);
    } catch {
      form = null;
    }
  }

  const student = await getCurrentStudent();
  const isLoggedIn = !!student;
  const hasPublishedForm = Boolean(form && form.status === "open" && form.published);

  const now = new Date();
  const applicationOpen =
    activity.applicationOpensAt &&
    new Date(activity.applicationOpensAt) <= now &&
    (!activity.applicationDeadline || new Date(activity.applicationDeadline) >= now);

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-label-sm text-muted">
        <Link href="/activities" className="hover:text-accent transition-colors">
          ← Back to activities
        </Link>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-2/3">
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden border border-line">
            {activity.posterImageId ? (
              <img
                src={mediaUrl(activity.posterImageId)}
                alt={activity.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface flex items-center justify-center text-muted">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <span className="absolute top-4 left-4 rounded-md bg-ink px-3 py-1 text-xs font-semibold text-white uppercase tracking-tighter">
              {CATEGORY_LABELS[activity.category] ?? activity.category}
            </span>
            {activity.isFree ? (
              <span className="absolute top-4 right-4 rounded-md bg-success px-3 py-1 text-xs font-semibold text-white uppercase tracking-tighter">
                Free
              </span>
            ) : (
              <span className="absolute top-4 right-4 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-ink uppercase tracking-tighter">
                {activity.currency === "SLE" ? "Le" : activity.currency}{activity.fee.toLocaleString()}
              </span>
            )}
            <span
              className={[
                "absolute bottom-4 left-4 rounded-md px-3 py-1 text-xs font-semibold text-white uppercase tracking-tighter",
                activity.status === "published"
                  ? "bg-success"
                  : activity.status === "scheduled"
                    ? "bg-accent/90 text-ink"
                    : "bg-muted",
              ].join(" ")}
            >
              {STATUS_LABELS[activity.status] ?? activity.status}
            </span>
          </div>

          <h1 className="mt-6 text-headline-lg font-bold tracking-tight text-ink">
            {activity.title}
          </h1>
          <p className="mt-2 text-body-md text-muted">{activity.organizer}</p>

          <div className="mt-6 rounded-lg border border-line bg-surface p-5">
            <h3 className="text-body-sm font-semibold text-ink uppercase tracking-wider mb-3">
              About this program
            </h3>
            <p className="text-body-sm text-muted whitespace-pre-line">
              {activity.description}
            </p>
          </div>

          {activity.objectives && (
            <div className="mt-6 rounded-lg border border-line bg-surface p-5">
              <h3 className="text-body-sm font-semibold text-ink uppercase tracking-wider mb-3">
                Program objectives
              </h3>
              <p className="text-body-sm text-muted whitespace-pre-line">
                {activity.objectives}
              </p>
            </div>
          )}

          {activity.eligibility && (
            <div className="mt-6 rounded-lg border border-line bg-surface p-5">
              <h3 className="text-body-sm font-semibold text-ink uppercase tracking-wider mb-3">
                Eligibility requirements
              </h3>
              <p className="text-body-sm text-muted whitespace-pre-line">
                {activity.eligibility}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 lg:w-1/3">
          <div className="rounded-lg border border-line bg-white p-5 shadow-card">
            <h3 className="text-body-sm font-semibold text-ink mb-4">Program details</h3>
            <dl className="space-y-4 text-body-sm">
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Category</dt>
                <dd className="text-ink">
                  {CATEGORY_LABELS[activity.category] ?? activity.category}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Venue type</dt>
                <dd className="text-ink">
                  {VENUE_TYPE_LABELS[activity.venueType] ?? activity.venueType}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Venue</dt>
                <dd className="text-ink">{activity.venue || "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Date</dt>
                <dd className="text-ink">
                  {formatDateTime(activity.startDate, activity.startTime)} —{" "}
                  {formatDateTime(activity.endDate, activity.endTime)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Duration</dt>
                <dd className="text-ink">{activity.duration || "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Available slots</dt>
                <dd className="text-ink">{activity.totalSlots}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Fee</dt>
                <dd className="text-ink">
                  {activity.isFree ? "Free" : `${activity.currency === "SLE" ? "Le" : activity.currency}${activity.fee.toLocaleString()}`}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Applications open</dt>
                <dd className="text-ink">
                  {formatDate(activity.applicationOpensAt)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Application deadline</dt>
                <dd className="text-ink">
                  {formatDate(activity.applicationDeadline)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 rounded-lg border border-line bg-white p-5 shadow-card">
            <h3 className="text-body-sm font-semibold text-ink mb-4">Apply now</h3>
            {!isLoggedIn ? (
              <div className="space-y-3">
                <p className="text-body-sm text-muted">
                  You need to be logged in to apply for this program.
                </p>
                <Link href="/student/login" className="block">
                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-white text-sm font-semibold shadow-sm hover:bg-rich transition-colors">
                    Log in to apply
                  </button>
                </Link>
                <p className="text-xs text-muted">
                  New student?{" "}
                  <Link href="/student/register" className="text-accent hover:underline">
                    Create an account
                  </Link>
                  .
                </p>
              </div>
            ) : !hasPublishedForm ? (
              <div className="space-y-3">
                <p className="text-body-sm text-muted">
                  Applications for this program are not currently open.
                </p>
                {activity.applicationDeadline && new Date(activity.applicationDeadline) < now && (
                  <p className="text-xs text-danger">
                    The application deadline has passed.
                  </p>
                )}
                {!applicationOpen && activity.applicationOpensAt && new Date(activity.applicationOpensAt) > now && (
                  <p className="text-xs text-muted">
                    Applications open on {formatDate(activity.applicationOpensAt)}.
                  </p>
                )}
              </div>
            ) : (
              <Link href={`/student/apply/${activity.id}`} className="block">
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-ink text-sm font-semibold shadow-sm hover:#aaff1a transition-colors">
                  Start application
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
