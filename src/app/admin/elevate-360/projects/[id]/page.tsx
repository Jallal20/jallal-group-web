import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteProject,
  listProjects,
  updateProject,
} from "@/lib/elevate-projects";
import { ProjectFormBase } from "@/components/admin/project-form";

export const metadata: Metadata = { title: "Edit Project" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function ElevateProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const project = await listProjects({ limit: 1 });
  const existing = (await import("@/lib/elevate-projects")).getProject(id);
  const found = await existing;
  if (!found) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/elevate-360/projects"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Edit {found.name}
        </h1>
      </div>

      <ProjectFormBase
        values={{
          name: found.name,
          slug: found.slug,
          description: found.description,
          objectives: found.objectives,
          category: found.category,
          imageIds: found.imageIds.join(", "),
          status: found.status,
          launchDate: found.launchDate ?? "",
          participationInfo: found.participationInfo,
          featured: found.featured,
          published: found.published,
        }}
        errors={{}}
        status="idle"
        serverError={null}
        deleting={false}
        onUpdate={() => {}}
        onDelete={async () => {
          await deleteProject(id);
          window.location.replace("/admin/elevate-360/projects");
        }}
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const data: Record<string, unknown> = Object.fromEntries(formData);
          await updateProject(id, {
            name: String(data.name ?? ""),
            slug: String(data.slug ?? ""),
            description: String(data.description ?? ""),
            objectives: String(data.objectives ?? ""),
            category: String(data.category ?? ""),
            imageIds: (String(data.imageIds ?? "").split(",").map((s) => s.trim()).filter(Boolean) as string[]),
            status: data.status as "planned" | "in-development" | "completed" | "on-hold",
            launchDate: String(data.launchDate ?? "") || null,
            participationInfo: String(data.participationInfo ?? ""),
            featured: data.featured === "true",
            published: data.published === "true",
          });
          window.location.replace("/admin/elevate-360/projects");
        }}
        endpoint="/admin/elevate-360/projects"
        itemName="Project"
      />
    </div>
  );
}
