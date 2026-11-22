import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getProperty } from "@/lib/properties";
import { EditPropertyForm } from "@/components/admin/property-form";

export const metadata: Metadata = { title: "Edit Property" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/jallal-properties/properties"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Edit {property.title}
        </h1>
      </div>

      <EditPropertyForm property={property} />
    </div>
  );
}
