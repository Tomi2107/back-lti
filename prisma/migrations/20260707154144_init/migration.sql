-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "moodle_user_sub" TEXT NOT NULL,
    "contrast_mode" TEXT NOT NULL DEFAULT 'normal',
    "font_size" INTEGER NOT NULL DEFAULT 16,
    "font_family" TEXT NOT NULL DEFAULT 'Arial',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "moodle_user_sub" TEXT NOT NULL,
    "moodle_course_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "user_agent" TEXT NOT NULL DEFAULT '',
    "ip_address" TEXT,
    "city" TEXT,
    "focus_mode_activated" BOOLEAN NOT NULL DEFAULT false,
    "focus_mode_total_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "resultado" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_caches" (
    "id" TEXT NOT NULL,
    "text_hash" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "generated_summary" TEXT,
    "simplified_text" TEXT,
    "key_concepts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_caches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moodle_course_caches" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "moodle_course_id" TEXT,
    "content_text_raw" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moodle_course_caches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progresses" (
    "id" TEXT NOT NULL,
    "moodle_user_sub" TEXT NOT NULL,
    "moodle_activity_id" TEXT NOT NULL,
    "moodle_course_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "due_date" TIMESTAMP(3),
    "last_interaction_timestamp" TIMESTAMP(3),

    CONSTRAINT "user_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_moodle_user_sub_key" ON "users"("moodle_user_sub");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_id_key" ON "sessions"("session_id");

-- CreateIndex
CREATE INDEX "sessions_moodle_user_sub_idx" ON "sessions"("moodle_user_sub");

-- CreateIndex
CREATE UNIQUE INDEX "event_logs_event_id_key" ON "event_logs"("event_id");

-- CreateIndex
CREATE INDEX "event_logs_session_id_idx" ON "event_logs"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_caches_text_hash_key" ON "ai_caches"("text_hash");

-- CreateIndex
CREATE UNIQUE INDEX "moodle_course_caches_activity_id_key" ON "moodle_course_caches"("activity_id");

-- CreateIndex
CREATE INDEX "user_progresses_moodle_user_sub_idx" ON "user_progresses"("moodle_user_sub");

-- CreateIndex
CREATE UNIQUE INDEX "user_progresses_moodle_user_sub_moodle_activity_id_key" ON "user_progresses"("moodle_user_sub", "moodle_activity_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_moodle_user_sub_fkey" FOREIGN KEY ("moodle_user_sub") REFERENCES "users"("moodle_user_sub") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;
