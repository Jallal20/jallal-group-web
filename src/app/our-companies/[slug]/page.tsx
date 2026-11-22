import { redirect } from "next/navigation";

type Params = { slug: string };

export default function CompanyRedirect({ params }: { params: Params }) {
  redirect(`/companies/${params.slug}`);
}
