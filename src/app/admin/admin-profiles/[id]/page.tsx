import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminProfile } from "@/lib/admin-profiles";
import { AdminProfileForm } from "@/components/admin/admin-profile-form";

export const metadata: Metadata = { title: "Edit Administrator" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function AdminProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const profile = await getAdminProfile(id);
  if (!profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/admin-profiles"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to administrators
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Edit Administrator
        </h1>
      </div>

      <AdminProfileForm profile={profile} />
    </div>
  );
}

