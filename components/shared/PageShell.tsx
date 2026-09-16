import Navigation from "@/components/shared/Navigation";

export default function PageShell({
  children,
  contained = true,
}: {
  children: React.ReactNode;
  contained?: boolean;
}) {
  return (
    <div className="page-shell">
      <Navigation />
      {contained ? (
        <main className="page-container page-main">{children}</main>
      ) : (
        <main className="page-main px-0">{children}</main>
      )}
    </div>
  );
}
