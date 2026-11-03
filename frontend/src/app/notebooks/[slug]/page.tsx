import LibraryReader from "@/components/library/LibraryReader";

export default async function NotebooksReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LibraryReader section="notebooks" slug={slug} backLabel="All notebooks" />;
}
