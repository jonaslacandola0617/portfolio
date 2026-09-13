-- Add the isolated Video Portfolio CMS models without changing existing content types.
CREATE TYPE "VideoDiscipline" AS ENUM ('VIDEO_EDITING', 'CINEMATOGRAPHY');

CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "youtubeUrl" TEXT,
    "youtubeVideoId" TEXT,
    "disciplines" "VideoDiscipline"[] NOT NULL DEFAULT ARRAY[]::"VideoDiscipline"[],
    "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "client" TEXT,
    "runtime" TEXT,
    "customPosterId" TEXT,
    "completionDate" TIMESTAMP(3),
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VideoPortfolioSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "eyebrow" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "aboutHeading" TEXT NOT NULL,
    "aboutBody" TEXT NOT NULL,
    "videoEditingDescription" TEXT NOT NULL,
    "cinematographyDescription" TEXT NOT NULL,
    "heroVideoId" TEXT,
    "featuredVideoIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoPortfolioSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VideoProject_slug_key" ON "VideoProject"("slug");
CREATE INDEX "VideoProject_publishStatus_sortOrder_idx" ON "VideoProject"("publishStatus", "sortOrder");
CREATE INDEX "VideoProject_customPosterId_idx" ON "VideoProject"("customPosterId");

ALTER TABLE "VideoProject"
ADD CONSTRAINT "VideoProject_customPosterId_fkey"
FOREIGN KEY ("customPosterId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
