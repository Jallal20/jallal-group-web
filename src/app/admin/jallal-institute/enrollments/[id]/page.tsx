import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getEnrollment } from "@/lib/enrollments";
import { EnrollmentDetailForm } from "@/components/admin/enrollment-form";

export const metadata: Metadata = { title: "Enrollment Detail" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function EnrollmentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const enrollment = await getEnrollment(id);
  if (!enrollment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/jallal-institute/enrollments"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to enrollments
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Enrollment {enrollment.reference}
        </h1>
      </div>

      <EnrollmentDetailForm enrollment={enrollment} />
    </div>
  );
}
