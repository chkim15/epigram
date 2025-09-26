export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Three-column layout will be implemented in the page component */}
      {children}
    </div>
  );
}