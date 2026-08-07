-- Timeline was retired from both the public portfolio and CMS.
-- This migration permanently removes its tag join table and records.
DROP TABLE "_TagToTimelineEntry";
DROP TABLE "TimelineEntry";
