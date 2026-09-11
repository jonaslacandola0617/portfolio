-- Remove the isolated schema left behind by the completed post-Phase-6 audit.
-- The application connection uses the public schema and never reads this copy.
DROP SCHEMA IF EXISTS "codex_post_phase6_audit" CASCADE;
