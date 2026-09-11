-- Store the ordered project IDs selected for the two homepage showcase positions.
ALTER TABLE "SiteSettings"
ADD COLUMN "homepageProjectIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
