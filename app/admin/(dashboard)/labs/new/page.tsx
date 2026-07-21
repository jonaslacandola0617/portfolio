import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LabForm } from "@/components/admin/lab-form";

export default function NewLabPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <Link href="/admin/labs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to labs
      </Link>
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">New lab</h1>
      <LabForm mode="create" />
    </div>
  );
}
