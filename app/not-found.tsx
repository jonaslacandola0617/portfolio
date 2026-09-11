import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="public-not-found">
      <div className="public-not-found-code">404</div>
      <div className="public-not-found-line" aria-hidden="true"><span /></div>
      <div className="public-not-found-copy">
        <span>OUTSIDE THE MAP</span>
        <h1>Nothing lives here.</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist, but the rest of the work is still where you left it.</p>
        <Link href="/"><ArrowLeft size={13}/> Back home</Link>
      </div>
    </section>
  );
}
