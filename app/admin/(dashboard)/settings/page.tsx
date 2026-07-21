import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function AdminSettingsPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Settings"
      description="Edit name, bio, social links, and the home page's Currently Learning list without a redeploy — backed by the SiteSettings table already in the schema."
      phase="Phase 5"
    />
  );
}
