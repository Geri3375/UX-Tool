import { AppShell } from "@/components/app-shell";
import { getLibraryDocuments } from "@/lib/library";

export default async function Home() {
  const documents = await getLibraryDocuments();

  return <AppShell documents={documents} />;
}
