import Navigation from "@/components/shared/Navigation";

export default function PageShell({
  children,
  title = "Home",
}: {
  children: React.ReactNode;
  contained?: boolean;
  title?: string;
}) {
  return (
    <div className="page-shell">
      <Navigation title={title} />
      <main className="page-main">
        <div className="feed-column">{children}</div>
      </main>
    </div>
  );
}
