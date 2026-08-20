ALTER TABLE "Download"
  ADD COLUMN "articleId" TEXT;

CREATE INDEX "Download_articleId_sortOrder_idx" ON "Download"("articleId", "sortOrder");

ALTER TABLE "Download"
  ADD CONSTRAINT "Download_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
