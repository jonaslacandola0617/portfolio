-- Persist the manual certificate order used by the admin drag-and-drop list.
ALTER TABLE "Certificate" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Preserve the public ordering that existed before manual sorting was introduced.
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      ORDER BY "dateCompleted" DESC NULLS LAST, "name" ASC
    ) - 1 AS position
  FROM "Certificate"
)
UPDATE "Certificate" AS certificate
SET "sortOrder" = ranked.position
FROM ranked
WHERE certificate."id" = ranked."id";

CREATE INDEX "Certificate_sortOrder_idx" ON "Certificate"("sortOrder");
