"use client";

import { ContentResourcesEditor } from "@/components/admin/content-resources-editor";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";

interface Resource {
  mediaId: string;
  label: string;
  description: string;
}

export function LabResourcesEditor({
  labId,
  media,
  initialResources,
}: {
  labId: string;
  media: AdminMediaItem[];
  initialResources: Resource[];
}) {
  return (
    <ContentResourcesEditor
      contentType="lab"
      recordId={labId}
      media={media}
      initialResources={initialResources}
    />
  );
}
