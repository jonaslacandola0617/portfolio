-- Move homepage showcase ownership from the SiteSettings singleton to Project rows.
-- A null showcaseOrder means the project is not featured. Slots 1 and 2 map
-- directly to the two homepage showcase compositions.
ALTER TABLE "Project" ADD COLUMN "showcaseOrder" INTEGER;

-- Preserve any previously configured settings-level selection during rollout.
WITH selected AS (
  SELECT project_id, ordinality::INTEGER AS showcase_order
  FROM "SiteSettings",
       unnest("homepageProjectIds") WITH ORDINALITY AS picked(project_id, ordinality)
  WHERE "id" = 'singleton' AND ordinality <= 2
)
UPDATE "Project" AS project
SET "showcaseOrder" = selected.showcase_order
FROM selected
WHERE project."id" = selected.project_id
  AND project."publishStatus" = 'PUBLISHED';

-- The settings array was introduced before this management-row design and may
-- still be empty. In that case preserve the homepage visitors already see by
-- seeding the two newest published projects into slots 1 and 2.
WITH fallback AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "completionDate" DESC, "updatedAt" DESC)::INTEGER AS showcase_order
  FROM "Project"
  WHERE "publishStatus" = 'PUBLISHED'
  ORDER BY "completionDate" DESC, "updatedAt" DESC
  LIMIT 2
)
UPDATE "Project" AS project
SET "showcaseOrder" = fallback.showcase_order
FROM fallback
WHERE project."id" = fallback."id"
  AND NOT EXISTS (SELECT 1 FROM "Project" WHERE "showcaseOrder" IS NOT NULL);

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_showcaseOrder_check"
  CHECK ("showcaseOrder" IS NULL OR "showcaseOrder" IN (1, 2));

CREATE UNIQUE INDEX "Project_showcaseOrder_key" ON "Project"("showcaseOrder");

ALTER TABLE "SiteSettings" DROP COLUMN "homepageProjectIds";
