-- CreateTable
CREATE TABLE `ActivityConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activityId` VARCHAR(191) NOT NULL,
    `config` JSON NOT NULL,
    `version` INTEGER NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ActivityConfig_activityId_deletedAt_idx`(`activityId`, `deletedAt`),
    INDEX `ActivityConfig_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `ActivityConfig_activityId_version_key`(`activityId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
