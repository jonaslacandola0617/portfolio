-- Phase 6 resolves the non-functional Scheduled state by returning any
-- legacy scheduled records to Draft. The enum/nullable timestamp columns
-- remain for backwards-compatible schema history, but admin validation and
-- forms no longer allow creating new scheduled records.
UPDATE "Project" SET "publishStatus" = 'DRAFT', "scheduledFor" = NULL WHERE "publishStatus" = 'SCHEDULED';
UPDATE "Lab" SET "publishStatus" = 'DRAFT', "scheduledFor" = NULL WHERE "publishStatus" = 'SCHEDULED';
UPDATE "Article" SET "publishStatus" = 'DRAFT', "scheduledFor" = NULL WHERE "publishStatus" = 'SCHEDULED';
UPDATE "Certificate" SET "publishStatus" = 'DRAFT', "scheduledFor" = NULL WHERE "publishStatus" = 'SCHEDULED';
UPDATE "TimelineEntry" SET "publishStatus" = 'DRAFT', "scheduledFor" = NULL WHERE "publishStatus" = 'SCHEDULED';
