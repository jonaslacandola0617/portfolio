-- Add optional public web-project destinations.
-- These remain nullable so existing and non-web-development projects are unaffected.
ALTER TABLE "Project"
ADD COLUMN "liveSiteUrl" TEXT,
ADD COLUMN "demoUrl" TEXT;
