-- Skill groups remain strings, but new records no longer inherit a domain-specific group.
ALTER TABLE "Skill" ALTER COLUMN "group" SET DEFAULT 'Ungrouped';

-- Existing Cybersecurity skills are intentionally not changed: the old default cannot be
-- distinguished safely from a genuine group assignment.

-- Certificate progress columns remain for backward-compatible data preservation, but the
-- application no longer reads or accepts them. Existing rows become completed credentials.
UPDATE "Certificate"
SET
  "progressStatus" = 'COMPLETED',
  "progressLabel" = 'Completed',
  "progressPercent" = 100;

ALTER TABLE "Certificate" ALTER COLUMN "progressStatus" SET DEFAULT 'COMPLETED';
ALTER TABLE "Certificate" ALTER COLUMN "progressLabel" SET DEFAULT 'Completed';
ALTER TABLE "Certificate" ALTER COLUMN "progressPercent" SET DEFAULT 100;
ALTER TABLE "Certificate" ALTER COLUMN "dateStarted" DROP NOT NULL;
ALTER TABLE "Certificate" ALTER COLUMN "logo" SET DEFAULT 'default';
ALTER TABLE "Certificate" ADD COLUMN "logoMediaId" TEXT;

CREATE INDEX "Certificate_logoMediaId_idx" ON "Certificate"("logoMediaId");

ALTER TABLE "Certificate"
ADD CONSTRAINT "Certificate_logoMediaId_fkey"
FOREIGN KEY ("logoMediaId") REFERENCES "Media"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
