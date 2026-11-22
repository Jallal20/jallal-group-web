"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShowcaseProjectForm } from "@/components/admin/showcase-project-form";

export default function NewAdminProjectPage() {
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
          Add New Project / Event
        </h1>
      </div>

      <ShowcaseProjectForm mode="create" />
    </div>
  );
}
