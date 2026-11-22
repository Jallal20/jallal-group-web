import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { ShowcaseProjectForm } from "@/components/admin/showcase-project-form";

export const metadata: Metadata = { title: "Edit Project" };
export const dynamic = "force-dynamic";

export default async function AdminProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const project = await getProject(id).catch(() => null);

  if (!project) notFound();

  const initial = {
    title: project.title,
    slug: project.slug,
    type: project.type,
    category: project.category,
    status: project.status,
    companyId: project.companyId,
    companyName: project.companyName,
    description: project.description,
    objectives: project.objectives,
    coverImageId: project.coverImageId,
    eventDate: project.eventDate ?? "",
    endDate: project.endDate ?? "",
    location: project.location,
    online: project.online,
    registrationUrl: project.registrationUrl,
    registrationOpenAt: project.registrationOpenAt ?? "",
    registrationCloseAt: project.registrationCloseAt ?? "",
    progress: String(project.progress ?? 0),
    featured: project.featured,
    displayOrder: String(project.displayOrder ?? 0),
    published: project.published,
    publishedAt: project.publishedAt ?? "",
    activityId: project.activityId,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
          style={{ textDecoration: "none" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Edit Project
        </h1>
        <p className="text-body-md text-muted">
          {project.title} - {project.status}
        </p>
      </div>

      <ShowcaseProjectForm mode="update" projectId={id} initial={initial} />
    </div>
  );
}