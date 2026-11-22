import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getProject } from "@/lib/tech-projects";

export const metadata: Metadata = { title: "Edit Project" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function TechProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/jallal-tech/projects"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Edit {project.name}
        </h1>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card">
        <h3 className="label-caps text-accent mb-4">Project Details</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
            <dt className="text-muted">Name</dt>
            <dd className="font-semibold text-ink">{project.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
            <dt className="text-muted">Slug</dt>
            <dd className="font-mono text-xs text-ink">{project.slug}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
            <dt className="text-muted">Category</dt>
            <dd className="text-ink">{project.category}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
            <dt className="text-muted">Status</dt>
            <dd className="text-ink">{project.status}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
            <dt className="text-muted">Published</dt>
            <dd className="text-ink">{project.published ? "Yes" : "No"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
          {project.description}
        </p>
      </div>
    </div>
  );
}

