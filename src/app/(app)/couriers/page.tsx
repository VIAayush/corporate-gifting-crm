import { CouriersPage } from "@/app/(app)/vendors-ui";
export default function Page(props: { searchParams: Promise<{ q?: string; page?: string; error?: string }> }) {
  return <CouriersPage {...props} />;
}
