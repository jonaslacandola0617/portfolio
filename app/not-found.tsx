import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="idx mb-4">404</p>
      <h1 className="font-display text-3xl font-semibold text-text">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-text-dim">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 border border-border-strong bg-text px-5 py-2.5 text-sm font-medium text-surface">
        Back to home
      </Link>
    </div>
  );
}
