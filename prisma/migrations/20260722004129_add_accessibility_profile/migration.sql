/*
  Warnings:

  - You are about to drop the column `accessibility_settings` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `contrast_mode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `font_family` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `font_size` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "accessibility_settings",
DROP COLUMN "contrast_mode",
DROP COLUMN "font_family",
DROP COLUMN "font_size";

-- CreateTable
CREATE TABLE "accessibility_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessibility_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accessibility_profiles_userId_name_key" ON "accessibility_profiles"("userId", "name");

-- AddForeignKey
ALTER TABLE "accessibility_profiles" ADD CONSTRAINT "accessibility_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
