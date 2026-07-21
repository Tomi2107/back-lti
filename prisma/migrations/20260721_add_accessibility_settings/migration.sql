ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "accessibility_settings" JSONB NOT NULL DEFAULT '{}';