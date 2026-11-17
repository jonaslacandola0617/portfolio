-- Editable homepage content and a per-project "AI-assisted build" flag.
-- Safe to re-run: each change only happens if it hasn't been applied yet,
-- and the backfill runs only at the moment the column is created, so it
-- never overrides choices made later in the admin.

ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "homepage" JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Project' AND column_name = 'aiAssisted'
  ) THEN
    ALTER TABLE "Project" ADD COLUMN "aiAssisted" BOOLEAN NOT NULL DEFAULT false;

    -- Web projects were labelled AI-assisted by category before this flag existed.
    UPDATE "Project" p
    SET "aiAssisted" = true
    FROM "Category" c
    WHERE p."categoryId" = c.id
      AND c.name ~* '(web|software|app)';
  END IF;
END $$;
