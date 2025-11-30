export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Total Recall
        </p>
      </div>
    </footer>
  );
}
