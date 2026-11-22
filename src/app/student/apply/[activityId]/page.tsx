import { getActivity, getActivityBySlug } from "@/lib/activities";
import { getApplicationFormByActivity } from "@/lib/application-forms";
import { getCurrentStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import ApplyForm from "./apply-form";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;

  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }

  let activity: Awaited<ReturnType<typeof getActivity>> | null = null;
  try {
    activity = await getActivity(activityId);
  } catch {
    activity = null;
  }
  if (!activity) {
    try {
      activity = await getActivityBySlug(activityId);
    } catch {
      activity = null;
    }
  }
  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <h2 className="text-headline-md font-bold text-ink">Activity not found</h2>
        <p className="text-body-sm text-muted">The program you are looking for does not exist.</p>
        <Button href="/activities">Back to activities</Button>
      </div>
    );
  }

  let form: Awaited<ReturnType<typeof getApplicationFormByActivity>> | null = null;
  if (activity.applicationsEnabled) {
    try {
      form = await getApplicationFormByActivity(activity.id);
    } catch {
      form = null;
    }
  }

  const now = new Date();
  const applicationOpen =
    activity.applicationOpensAt &&
    new Date(activity.applicationOpensAt) <= now &&
    (!activity.applicationDeadline || new Date(activity.applicationDeadline) >= now);

  if (!form || form.status !== "open" || !form.published) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card">
          <svg className="h-12 w-12 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-headline-md font-bold text-ink">Applications are not open</h2>
          <p className="text-body-sm text-muted">
            The application form for this program is not currently accepting submissions.
          </p>
        </div>
        <Button href="/activities">Back to activities</Button>
      </div>
    );
  }

  if (!applicationOpen) {
    let deadlineMsg = "";
    let opensMsg = "";
    if (activity.applicationDeadline) {
      deadlineMsg = ` Applications closed on ${new Date(activity.applicationDeadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}.`;
    }
    if (activity.applicationOpensAt) {
      opensMsg = ` Applications open on ${new Date(activity.applicationOpensAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}.`;
    }
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card">
          <svg className="h-12 w-12 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-headline-md font-bold text-ink">Applications are not open</h2>
          <p className="text-body-sm text-muted">{opensMsg}{deadlineMsg}</p>
        </div>
        <Button href="/activities">Back to activities</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Apply now</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            {activity.title}
          </h1>
          <p className="text-body-sm text-muted">
            Reference will be generated upon submission. Track your application
            status from your dashboard.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 md:p-10 shadow-card">
        <div className="flex flex-col gap-2 mb-6">
          <p className="text-body-sm text-muted">{form.description}</p>
          <p className="text-xs text-muted">
            Fields marked <span className="text-danger">*</span> are required.
          </p>
        </div>

        <ApplyForm
          activityId={activity.id}
          activityTitle={activity.title}
          fields={form.fields}
          confirmationMessage={form.confirmationMessage}
        />
      </div>
    </div>
  );
}
