import LibraryReader from "@/components/library/LibraryReader";

export default async function ProjectsReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LibraryReader section="projects" slug={slug} backLabel="All projects" />;
}
