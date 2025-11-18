-- AlterTable
ALTER TABLE `User` ADD COLUMN `nickname` VARCHAR(191) NULL;

-- Move data from name to nickname
UPDATE `User` SET `nickname` = `name` WHERE `name` IS NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `name`;