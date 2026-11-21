import Link from "next/link";
import { ArrowLeft, FlaskConical, FolderGit2, Search } from "lucide-react";

export default function NotFound() {
  return (
    <section className="status-page" aria-labelledby="not-found-title">
      <p className="eyebrow"><span className="eyebrow-index">404</span>Page not found</p>
      <h1 id="not-found-title">This page doesn&apos;t exist.</h1>
      <p className="hero-lede">The link may be old, or the page was moved. Everything else is still here.</p>
      <div className="hero-actions">
        <Link href="/" className="btn btn-solid"><ArrowLeft size={15} /> Back home</Link>
        <Link href="/labs" className="btn btn-ghost"><FlaskConical size={15} /> Labs</Link>
        <Link href="/projects" className="btn btn-ghost"><FolderGit2 size={15} /> Projects</Link>
      </div>
      <p className="status-page-hint"><Search size={14} aria-hidden="true" /> Tip: press <kbd>/</kbd> to search the site.</p>
    </section>
  );
}
