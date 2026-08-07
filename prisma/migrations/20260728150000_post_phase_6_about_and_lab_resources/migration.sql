ALTER TABLE "SiteSettings" ADD COLUMN "aboutPage" JSONB;

ALTER TABLE "Download"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "labId" TEXT,
  ADD COLUMN "mediaId" TEXT;

CREATE INDEX "Download_projectId_sortOrder_idx" ON "Download"("projectId", "sortOrder");
CREATE INDEX "Download_labId_sortOrder_idx" ON "Download"("labId", "sortOrder");
CREATE INDEX "Download_mediaId_idx" ON "Download"("mediaId");

ALTER TABLE "Download"
  ADD CONSTRAINT "Download_labId_fkey"
  FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Download"
  ADD CONSTRAINT "Download_mediaId_fkey"
  FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
