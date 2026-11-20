-- CreateTable
CREATE TABLE "charitable_organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "logo_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "charitable_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charitable_organizations_name_key" ON "charitable_organizations"("name");

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "charitable_organization_id" INTEGER;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_charitable_organization_id_fkey" FOREIGN KEY ("charitable_organization_id") REFERENCES "charitable_organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;