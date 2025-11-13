-- AlterTable
ALTER TABLE `imagetag` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `ImageTag_deletedAt_idx` ON `ImageTag`(`deletedAt`);
