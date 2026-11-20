-- AlterTable:
ALTER TABLE "clubs" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "clubs" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- Restriction: An user can only own one club.
CREATE UNIQUE INDEX "clubs_user_id_key" ON "clubs"("user_id");

-- Foregin key: if the user is deleted the club also will.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;