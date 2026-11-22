import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCourse } from "@/lib/courses";
import { EditCourseForm } from "@/components/admin/course-form";

export const metadata: Metadata = { title: "Edit Course" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function CoursePage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/jallal-institute/courses"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Edit {course.name}
        </h1>
      </div>

      <EditCourseForm course={course} />
    </div>
  );
}
