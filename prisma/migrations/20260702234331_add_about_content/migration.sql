-- CreateTable
CREATE TABLE "about_content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "about_content_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "about_content" ADD CONSTRAINT "about_content_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
