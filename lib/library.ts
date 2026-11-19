import { createClient } from "@/lib/supabase/server";

export const LITERATURE_BUCKET = "UX Literature";

export type LibraryDocument = {
  id: string;
  title: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string | null;
  updatedAt: string;
  publicUrl: string;
};

export function getPublicDocumentUrl(projectUrl: string, path: string) {
  const encodedBucket = encodeURIComponent(LITERATURE_BUCKET);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  return `${projectUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

export async function getLibraryDocuments(): Promise<LibraryDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<{
    documents: LibraryDocument[];
  }>("list-ux-literature");

  if (error) {
    throw new Error(`Unable to load the document library: ${error.message}`);
  }

  return data?.documents ?? [];
}
